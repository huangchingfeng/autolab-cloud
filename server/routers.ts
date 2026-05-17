import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { notifyOwner } from "./_core/notification";
import { sendEmail, generateContactConfirmationEmail, generateEventConfirmationEmail, generateEventReminderEmail } from "./_core/email";
import { generateBNIEventConfirmationEmail } from "./_core/bniEventEmail";
import { ENV } from "./_core/env";
import { translateText, translateBatch, type SupportedLanguage } from "./translation";
import { chatCompletion } from "./_core/llm";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

const generatePostDraftInputSchema = z.object({
  sourceContent: z.string().optional(),
  topic: z.string().optional(),
  audience: z.string().optional(),
  goal: z.string().optional(),
  sourceNotes: z.string().optional(),
  tone: z.string().optional(),
  cta: z.string().optional(),
}).refine(
  (input) => Boolean((input.sourceContent || input.sourceNotes || input.topic || "").trim()),
  { message: "請貼上原文或素材內容" }
);

const generatedPostDraftSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  suggestedTags: z.array(z.string()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  linePost: z.string().optional(),
});

const insuranceToolIdSchema = z.enum([
  "fire",
  "protectionGap",
  "interviewQuestions",
  "policySummary",
  "lineFollowup",
  "objectionPractice",
]);

type InsuranceToolId = z.infer<typeof insuranceToolIdSchema>;

const insuranceToolLabels: Record<InsuranceToolId, string> = {
  fire: "FIRE 退休目標系統",
  protectionGap: "家庭保障缺口盤點器",
  interviewQuestions: "客戶訪談提問產生器",
  policySummary: "保單健檢摘要器",
  lineFollowup: "LINE 跟進訊息產生器",
  objectionPractice: "異議處理練習器",
};

const insuranceToolInstructions: Record<InsuranceToolId, string> = {
  fire: "根據退休目標、家庭責任、現金流與資產狀況，整理簡化退休目標討論、風險缺口、待確認資料與下一次訪談問題。不要做具體投資或保險商品推薦。",
  protectionGap: "根據家庭成員、收入責任、負債、教育費與緊急預備金，整理保障缺口討論清單、優先確認問題與客戶教育重點。不要判定應買哪張商品。",
  interviewQuestions: "根據客戶背景與業務目標，產生初談、複談、成交前確認問題，問題要自然、專業、不壓迫。",
  policySummary: "根據去識別化保單重點，整理白話摘要、可能需要補問的地方、不可直接判斷的限制與給客戶看的說明。不可宣稱既有保單好壞或直接建議解約。",
  lineFollowup: "根據客戶階段與溝通目的，產生 3 種 LINE 跟進訊息，語氣溫和、短句、清楚下一步，不誇大、不施壓。",
  objectionPractice: "根據客戶異議，產生理解客戶、釐清問題、教育觀念、邀約下一步的回應架構，並提供角色扮演練習腳本。",
};

const insuranceToolInputSchema = z.object({
  tool: insuranceToolIdSchema,
  fields: z.record(z.string(), z.string().max(2000)).default({}),
}).refine(
  (input) => Object.values(input.fields).some(value => value.trim().length > 0),
  { message: "請至少填寫一個欄位" }
).refine(
  (input) => Object.values(input.fields).join("\n").length <= 7000,
  { message: "輸入內容太長，請先刪減或分段使用" }
);

function slugifyPostTitle(input: string) {
  const slug = input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

  return slug || `ai-post-${Date.now()}`;
}

function compactExcerpt(input: string) {
  return input
    .replace(/[#*_`>\-[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function extractJsonObject(raw: string) {
  const withoutFence = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response did not contain a JSON object");
  }
  return withoutFence.slice(start, end + 1);
}

function parseGeneratedPostDraft(raw: string, fallbackTopic: string) {
  try {
    const parsed = JSON.parse(extractJsonObject(raw));
    const result = generatedPostDraftSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error("AI response JSON did not match expected draft shape");
    }

    const data = result.data;
    const content = data.content.trim();
    const title = data.title.trim() || fallbackTopic.trim();
    const suggestedTags = [...new Set((data.suggestedTags || []).map(tag => tag.trim()).filter(Boolean))].slice(0, 8);

    return {
      title,
      slug: slugifyPostTitle(data.slug || title || fallbackTopic),
      excerpt: data.excerpt?.trim() || compactExcerpt(content),
      content,
      suggestedTags,
      seoTitle: data.seoTitle?.trim() || title,
      seoDescription: data.seoDescription?.trim() || data.excerpt?.trim() || compactExcerpt(content),
      linePost: data.linePost?.trim() || "",
    };
  } catch (error) {
    console.warn("[AI Writer] Falling back to raw draft content:", error);
    const content = raw.trim();
    const title = fallbackTopic.trim();
    return {
      title,
      slug: slugifyPostTitle(title),
      excerpt: compactExcerpt(content),
      content,
      suggestedTags: [],
      seoTitle: title,
      seoDescription: compactExcerpt(content),
      linePost: "",
    };
  }
}

function formatInsuranceFields(fields: Record<string, string>) {
  return Object.entries(fields)
    .filter(([, value]) => value.trim())
    .map(([key, value]) => `- ${key}: ${value.trim()}`)
    .join("\n");
}

function buildInsuranceToolPrompt(tool: InsuranceToolId, fields: Record<string, string>) {
  return [
    `工具：${insuranceToolLabels[tool]}`,
    `任務：${insuranceToolInstructions[tool]}`,
    "",
    "使用者輸入：",
    formatInsuranceFields(fields),
    "",
    "請用 Markdown 輸出，格式如下：",
    "## 重點摘要",
    "## 可對客戶說明的白話版本",
    "## 業務員下一步",
    "## 需要再確認的資料",
    "## 合規提醒",
    "",
    "輸出要務實、短段落、可直接讓保險業務員拿去修改使用。",
  ].join("\n");
}

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  insuranceTools: router({
    generate: publicProcedure
      .input(insuranceToolInputSchema)
      .mutation(async ({ input }) => {
        if (!ENV.geminiApiKey) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "AI 工具暫時無法使用，請先確認 GEMINI_API_KEY 是否設定。",
          });
        }

        const systemPrompt = [
          "你是 AutoLab 保險業務 AI 工具箱。",
          "請使用繁體中文與台灣保險業務情境，協助業務員整理客戶溝通草稿、訪談問題、服務提醒與教育型說明。",
          "你不能推薦具體保險商品、不能比較哪張保單最好、不能宣稱保證獲利或保證理賠，也不能替代所屬公司、法遵、核保、稅務或法律意見。",
          "如果資料不足，請列為待確認，不要自行編造客戶資料、數字、病史、商品條款、費率或法規結論。",
          "不要要求使用者輸入身分證、完整生日、病歷、保單號碼等敏感個資。",
          "每份輸出都必須標示為草稿，提醒業務員依公司規範確認後再使用。",
        ].join("\n");

        try {
          const output = await chatCompletion(
            [
              { role: "system", content: systemPrompt },
              { role: "user", content: buildInsuranceToolPrompt(input.tool, input.fields) },
            ],
            { maxTokens: 3000, temperature: 0.55 }
          );

          return {
            tool: input.tool,
            title: insuranceToolLabels[input.tool],
            output,
            generatedAt: new Date().toISOString(),
          };
        } catch (error) {
          console.error("[Insurance Tools] Failed to generate output:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "保險工具產生失敗，請稍後再試。",
          });
        }
      }),
  }),

  blog: router({
    // Public procedures
    getPosts: publicProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getPublishedPosts(input?.limit, input?.offset);
      }),

    getPostBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const post = await db.getPostBySlug(input.slug);
        if (!post) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        }
        // Increment view count
        await db.incrementPostViewCount(post.post.id);
        return post;
      }),

    getPostsByCategory: publicProcedure
      .input(z.object({
        categorySlug: z.string(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getPostsByCategory(input.categorySlug, input.limit);
      }),

    searchPosts: publicProcedure
      .input(z.object({ searchTerm: z.string() }))
      .query(async ({ input }) => {
        return await db.searchPosts(input.searchTerm);
      }),

    getCategories: publicProcedure.query(async () => {
      return await db.getAllCategories();
    }),

    getCategoryBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await db.getCategoryBySlug(input.slug);
      }),

    getTags: publicProcedure.query(async () => {
      return await db.getAllTags();
    }),

    getTagBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return await db.getTagBySlug(input.slug);
      }),

    getPostsByTag: publicProcedure
      .input(z.object({
        tagSlug: z.string(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getPostsByTag(input.tagSlug, input.limit);
      }),

    getRelatedPosts: publicProcedure
      .input(z.object({ postId: z.number(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getRelatedPosts(input.postId, input.limit || 3);
      }),

    // Check if email has access to restricted article
    checkArticleAccess: publicProcedure
      .input(z.object({ 
        email: z.string().email(), 
        articleSlug: z.string() 
      }))
      .query(async ({ input }) => {
        const hasAccess = await db.checkArticleAccess(input.email.toLowerCase(), input.articleSlug);
        return { hasAccess };
      }),

    // Verify and grant article access (stores email in session/cookie)
    verifyArticleAccess: publicProcedure
      .input(z.object({ 
        email: z.string().email(), 
        articleSlug: z.string() 
      }))
      .mutation(async ({ input, ctx }) => {
        const hasAccess = await db.checkArticleAccess(input.email.toLowerCase(), input.articleSlug);
        if (!hasAccess) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Email not found in whitelist' });
        }
        // Store verified email in session cookie for this article
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(
          `article_access_${input.articleSlug}`,
          input.email.toLowerCase(),
          { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
        );
        return { success: true, hasAccess: true };
      }),

    // Admin procedures
    getAllPosts: adminProcedure.query(async ({ ctx }) => {
      return await db.getAllPosts();
    }),

    getPostById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const post = await db.getPostById(input.id);
        if (!post) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        }
        return post;
      }),

    generatePostDraft: adminProcedure
      .input(generatePostDraftInputSchema)
      .mutation(async ({ input }) => {
        const sourceContent = (input.sourceContent || input.sourceNotes || input.topic || "").trim();
        const topic = input.topic?.trim() || "依據素材改寫成阿峰老師風格文章";
        const audience = input.audience?.trim() || "企業主、人資主管、業務主管、想導入 AI 的工作者";
        const goal = input.goal?.trim() || "把素材改寫成阿峰老師風格的部落格文章，建立信任並導流企業內訓諮詢";
        const tone = input.tone?.trim() || "專業、務實、像阿峰老師親自分享";
        const cta = input.cta?.trim() || "引導讀者加 LINE 或填寫企業內訓諮詢表單";

        const systemPrompt = [
          "你是 AutoLab / AI 峰哥網站的內容主編。",
          "你的任務不是憑空寫文章，而是把使用者提供的原文、逐字稿、筆記或素材，改寫成阿峰老師風格的部落格文章。",
          "阿峰老師風格：繁體中文、台灣商務語境、專業但好懂、像企業 AI 教練在說明，重視實戰步驟、流程、工具落地和業務成果。",
          "必須保留原文重點與事實，不要編造不存在的客戶名稱、數字、經歷、價格、日期或案例。",
          "可以重組段落、補小標、補轉場與行動建議，但新增內容必須是通用方法論，不可假裝來自原文。",
          "只輸出 JSON，不要加 Markdown code fence。",
        ].join("\n");

        const userPrompt = [
          `改寫方向/標題：${topic}`,
          `目標讀者：${audience}`,
          `文章目的：${goal}`,
          `語氣：${tone}`,
          `CTA：${cta}`,
          input.sourceNotes?.trim() && input.sourceContent?.trim() ? `額外補充要求：\n${input.sourceNotes.trim()}` : "",
          "",
          "原文/素材如下，請以此為主要依據改寫：",
          sourceContent,
          "",
          "請輸出以下 JSON 欄位：",
          "{",
          '  "title": "文章標題",',
          '  "slug": "英文小寫網址代稱，例如 ai-sales-workflow",',
          '  "excerpt": "120 字內摘要",',
          '  "content": "Markdown 文章，含 H2/H3、小標、條列、結尾 CTA，約 1200-1800 字",',
          '  "suggestedTags": ["AI工具", "企業內訓"],',
          '  "seoTitle": "SEO 標題，60 字內",',
          '  "seoDescription": "SEO 描述，150 字內",',
          '  "linePost": "可貼到 LINE 社群的短版貼文，120-220 字"',
          "}",
        ].filter(Boolean).join("\n");

        try {
          const raw = await chatCompletion(
            [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            { maxTokens: 4096, temperature: 0.7 }
          );

          return parseGeneratedPostDraft(raw, topic);
        } catch (error) {
          console.error("[AI Writer] Failed to generate post draft:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "AI 產文失敗，請確認 GEMINI_API_KEY 是否設定，或稍後再試。",
          });
        }
      }),

    createPost: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        slug: z.string().min(1),
        excerpt: z.string().optional(),
        content: z.string().min(1),
        coverImage: z.string().optional(),
        categoryId: z.number().optional(),
        status: z.enum(["draft", "published"]).default("draft"),
        publishedAt: z.date().optional(),
        tagIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { tagIds, ...postData } = input;
        
        const result = await db.createPost({
          ...postData,
          authorId: ctx.user.id,
        });

        const postId = result.id;

        // Add tags if provided
        if (tagIds && tagIds.length > 0) {
          for (const tagId of tagIds) {
            await db.addTagToPost(postId, tagId);
          }
        }

        return { success: true, postId };
      }),

    updatePost: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        excerpt: z.string().optional(),
        content: z.string().min(1).optional(),
        coverImage: z.string().optional(),
        categoryId: z.number().optional(),
        status: z.enum(["draft", "published"]).optional(),
        publishedAt: z.date().optional(),
        tagIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, tagIds, ...postData } = input;

        await db.updatePost(id, postData);

        // Update tags if provided
        if (tagIds !== undefined) {
          // Get current tags
          const currentTags = await db.getTagsByPostId(id);
          const currentTagIds = currentTags.map(t => t!.id);

          // Remove tags that are not in the new list
          for (const tagId of currentTagIds) {
            if (!tagIds.includes(tagId)) {
              await db.removeTagFromPost(id, tagId);
            }
          }

          // Add new tags
          for (const tagId of tagIds) {
            if (!currentTagIds.includes(tagId)) {
              await db.addTagToPost(id, tagId);
            }
          }
        }

        return { success: true };
      }),

    deletePost: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePost(input.id);
        return { success: true };
      }),

    createCategory: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.createCategory(input);
        return { success: true };
      }),

    updateCategory: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...categoryData } = input;
        await db.updateCategory(id, categoryData);
        return { success: true };
      }),

    deleteCategory: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCategory(input.id);
        return { success: true };
      }),

    createTag: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        await db.createTag(input);
        return { success: true };
      }),

    deleteTag: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTag(input.id);
        return { success: true };
      }),

    // Image upload
    uploadImage: adminProcedure
      .input(z.object({
        filename: z.string(),
        contentType: z.string(),
        base64Data: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Convert base64 to buffer
          const buffer = Buffer.from(input.base64Data, 'base64');
          
          // Generate unique filename
          const ext = input.filename.split('.').pop() || 'jpg';
          const uniqueFilename = `blog-images/${nanoid()}-${Date.now()}.${ext}`;
          
          // Upload to S3
          const { url } = await storagePut(
            uniqueFilename,
            buffer,
            input.contentType
          );
          
          return { url };
        } catch (error) {
          console.error('Image upload error:', error);
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to upload image' });
        }
      }),
  }),

  events: router({
    // Public procedures
    getPublishedEvents: publicProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const eventsList = await db.getPublishedEvents(input?.limit, input?.offset);
        // Get registration count for each event
        const eventsWithCount = await Promise.all(
          eventsList.map(async (event) => ({
            ...event,
            registrationCount: await db.getEventRegistrationCount(event.id),
          }))
        );
        return eventsWithCount;
      }),

    getEventBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const event = await db.getEventBySlug(input.slug);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }
        const registrationCount = await db.getEventRegistrationCount(event.id);
        return { ...event, registrationCount };
      }),

    register: publicProcedure
      .input(z.object({
        eventId: z.number(),
        name: z.string().min(1, "請輸入姓名"),
        email: z.string().email("請輸入有效的電子郵件"),
        phone: z.string().min(1, "請輸入電話"),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        referralSource: z.string().optional(),
        bniChapter: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Check if event exists
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '活動不存在' });
        }

        // Check if event is still open for registration
        if (event.status !== 'published') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '活動已結束或尚未開放報名' });
        }

        // Check for duplicate registration
        const isDuplicate = await db.checkDuplicateRegistration(input.eventId, input.email);
        if (isDuplicate) {
          throw new TRPCError({ code: 'CONFLICT', message: '您已經報名過此活動' });
        }

        // Create registration
        const result = await db.createEventRegistration({
          eventId: input.eventId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          company: input.company || null,
          jobTitle: input.jobTitle || null,
          referralSource: input.referralSource || null,
          bniChapter: input.bniChapter || null,
        });

        const registrationId = result.id;

        // Send confirmation email
        try {
          await sendEmail({
            to: input.email,
            subject: `報名成功！${event.title}`,
            html: generateEventConfirmationEmail(input.name, event),
          });
          await db.updateRegistrationEmailSent(registrationId, true);
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }

        // Notify owner
        await notifyOwner({
          title: `新報名：${event.title}`,
          content: `姓名：${input.name}\n電子郵件：${input.email}\n電話：${input.phone}\n公司/職稱：${input.company || ''} ${input.jobTitle || ''}\n來源：${input.referralSource}`
        });

        // Send to accounting system
        try {
          const { sendEventRegistration } = await import('./_core/accountingWebhook');
          await sendEventRegistration({
            ...input,
            eventTitle: event.title,
          });
        } catch (webhookError) {
          console.error('Failed to send accounting webhook:', webhookError);
        }

        return { success: true, registrationId };
      }),

    registerBNI: publicProcedure
      .input(z.object({
        eventId: z.number(),
        name: z.string().min(1, "請輸入姓名"),
        email: z.string().email("請輸入有效的電子郵件"),
        phone: z.string().min(1, "請輸入電話"),
        attendeeCount: z.number(),
        profession: z.string().min(1, "請輸入所屬產業/專業別"),
        referralPerson: z.string().optional(),
        hasAiExperience: z.boolean(),
        aiToolsUsed: z.string().optional(),
        hasTakenAiCourse: z.boolean(),
        courseExpectations: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Check if event exists
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '活動不存在' });
        }

        // Check if event is still open for registration
        if (event.status !== 'published') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '活動已結束或尚未開放報名' });
        }

        // Check if event has reached max attendees
        if (event.maxAttendees && event.registrationCount >= event.maxAttendees) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: '很抱歉，活動已額滿' });
        }

        // Check for duplicate registration
        const isDuplicate = await db.checkDuplicateRegistration(input.eventId, input.email);
        if (isDuplicate) {
          throw new TRPCError({ code: 'CONFLICT', message: '您已經報名過此活動' });
        }

        // Create registration with BNI-specific fields
        const result = await db.createEventRegistration({
          eventId: input.eventId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          attendeeCount: input.attendeeCount,
          profession: input.profession,
          referralPerson: input.referralPerson || null,
          hasAiExperience: input.hasAiExperience,
          aiToolsUsed: input.aiToolsUsed || null,
          hasTakenAiCourse: input.hasTakenAiCourse,
          courseExpectations: input.courseExpectations || null,
          referralSource: 'other',
        });

        const registrationId = result.id;

        // Send confirmation email
        try {
          await sendEmail({
            to: input.email,
            subject: `報名成功！${event.title}`,
            html: generateBNIEventConfirmationEmail(input.name, event),
          });
          await db.updateRegistrationEmailSent(registrationId, true);
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }

        // Notify owner
        await notifyOwner({
          title: `BNI 活動新報名：${event.title}`,
          content: `姓名：${input.name}\nEmail：${input.email}\n電話：${input.phone}\n參加人數：${input.attendeeCount}\n專業別：${input.profession}\n推薦人：${input.referralPerson || '無'}\nAI經驗：${input.hasAiExperience ? '有' : '無'}\n使用過的工具：${input.aiToolsUsed || '無'}\n上過課程：${input.hasTakenAiCourse ? '是' : '否'}`
        });

        return { success: true, registrationId };
      }),

    // Admin procedures
    getAllEvents: adminProcedure.query(async () => {
      const eventsList = await db.getAllEvents();
      const eventsWithCount = await Promise.all(
        eventsList.map(async (event) => ({
          ...event,
          registrationCount: await db.getEventRegistrationCount(event.id),
        }))
      );
      return eventsWithCount;
    }),

    getEventById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const event = await db.getEventById(input.id);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found' });
        }
        const registrationCount = await db.getEventRegistrationCount(event.id);
        return { ...event, registrationCount };
      }),

    createEvent: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        subtitle: z.string().optional(),
        slug: z.string().min(1),
        description: z.string().min(1),
        highlights: z.array(z.string()).optional(),
        targetAudience: z.array(z.string()).optional(),
        speakerInfo: z.string().optional(),
        coverImage: z.string().optional(),
        eventDate: z.date(),
        eventEndDate: z.date().optional(),
        eventTime: z.string().optional(),
        location: z.string().min(1),
        locationDetails: z.string().optional(),
        price: z.number().default(0),
        maxAttendees: z.number().optional(),
        status: z.enum(["draft", "published", "cancelled", "completed"]).default("draft"),
        registrationDeadline: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { highlights, targetAudience, ...eventData } = input;
        const result = await db.createEvent({
          ...eventData,
          highlights: highlights ? JSON.stringify(highlights) : null,
          targetAudience: targetAudience ? JSON.stringify(targetAudience) : null,
        });
        return { success: true, eventId: result.id };
      }),

    updateEvent: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        subtitle: z.string().optional(),
        slug: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        highlights: z.array(z.string()).optional(),
        targetAudience: z.array(z.string()).optional(),
        speakerInfo: z.string().optional(),
        coverImage: z.string().optional(),
        eventDate: z.date().optional(),
        eventEndDate: z.date().optional(),
        eventTime: z.string().optional(),
        location: z.string().min(1).optional(),
        locationDetails: z.string().optional(),
        price: z.number().optional(),
        maxAttendees: z.number().optional(),
        status: z.enum(["draft", "published", "cancelled", "completed"]).optional(),
        registrationEnabled: z.boolean().optional(),
        registrationDeadline: z.date().optional(),
        registrationInfo: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, highlights, targetAudience, ...eventData } = input;
        const updateData: any = { ...eventData };
        if (highlights !== undefined) {
          updateData.highlights = JSON.stringify(highlights);
        }
        if (targetAudience !== undefined) {
          updateData.targetAudience = JSON.stringify(targetAudience);
        }
        await db.updateEvent(id, updateData);
        return { success: true };
      }),

    deleteEvent: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteEvent(input.id);
        return { success: true };
      }),

    // Registration management
    getRegistrations: adminProcedure
      .input(z.object({
        eventId: z.number().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        if (input?.eventId) {
          return await db.getEventRegistrations(input.eventId, input?.limit, input?.offset);
        }
        return await db.getAllEventRegistrations(input?.limit, input?.offset);
      }),

    getRegistrationStats: adminProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getRegistrationStats(input.eventId);
      }),

    updateRegistrationStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["registered", "confirmed", "cancelled", "attended"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateRegistrationStatus(input.id, input.status);
        return { success: true };
      }),

    deleteRegistration: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRegistration(input.id);
        return { success: true };
      }),

    // Batch update registration status
    batchUpdateRegistrationStatus: adminProcedure
      .input(z.object({
        ids: z.array(z.number()),
        status: z.enum(["registered", "confirmed", "cancelled", "attended"]),
      }))
      .mutation(async ({ input }) => {
        for (const id of input.ids) {
          await db.updateRegistrationStatus(id, input.status);
        }
        return { success: true, count: input.ids.length };
      }),

    // Batch delete registrations
    batchDeleteRegistrations: adminProcedure
      .input(z.object({
        ids: z.array(z.number()),
      }))
      .mutation(async ({ input }) => {
        for (const id of input.ids) {
          await db.deleteRegistration(id);
        }
        return { success: true, count: input.ids.length };
      }),

    // Send reminder emails to all registrants of an event
    sendReminders: adminProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ input }) => {
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '活動不存在' });
        }

        const registrations = await db.getRegistrationsByEventId(input.eventId);
        if (registrations.length === 0) {
          return { success: true, sent: 0, message: '沒有需要發送提醒的報名者' };
        }

        let sentCount = 0;
        const errors: string[] = [];

        for (const registration of registrations) {
          try {
            await sendEmail({
              to: registration.email,
              subject: `活動提醒：${event.title} 即將開始！`,
              html: generateEventReminderEmail(registration.name, event),
            });
            sentCount++;
          } catch (error) {
            console.error(`Failed to send reminder to ${registration.email}:`, error);
            errors.push(registration.email);
          }
        }

        return {
          success: true,
          sent: sentCount,
          failed: errors.length,
          errors: errors.length > 0 ? errors : undefined,
          message: `已成功發送 ${sentCount} 封提醒 Email${errors.length > 0 ? `，${errors.length} 封失敗` : ''}`
        };
      }),

    // Get events happening tomorrow (for scheduled task)
    getEventsTomorrow: adminProcedure
      .query(async () => {
        return await db.getEventsTomorrow();
      }),

    // Event registration management
    getAllEventRegistrations: adminProcedure
      .input(z.object({
        eventId: z.number().optional(),
        searchTerm: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllEventRegistrationsWithDetails(input);
      }),

    getRegistrationById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const registration = await db.getRegistrationById(input.id);
        if (!registration) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '報名記錄不存在' });
        }
        return registration;
      }),

    createEventRegistration: adminProcedure
      .input(z.object({
        eventId: z.number(),
        name: z.string().min(1, "請輸入姓名"),
        email: z.string().email("請輸入有效的電子郵件"),
        phone: z.string().min(1, "請輸入電話"),
        attendeeCount: z.number().optional(),
        profession: z.string().optional(),
        referralPerson: z.string().optional(),
        hasAiExperience: z.boolean().optional(),
        aiToolsUsed: z.string().optional(),
        hasTakenAiCourse: z.boolean().optional(),
        courseExpectations: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        referralSource: z.string().optional(),
        bniChapter: z.string().optional(),
        status: z.enum(["registered", "confirmed", "cancelled", "attended"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createEventRegistration(input);
        return { success: true, registrationId: result.id };
      }),

    updateEventRegistration: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        attendeeCount: z.number().optional(),
        profession: z.string().optional(),
        referralPerson: z.string().optional(),
        hasAiExperience: z.boolean().optional(),
        aiToolsUsed: z.string().optional(),
        hasTakenAiCourse: z.boolean().optional(),
        courseExpectations: z.string().optional(),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        referralSource: z.string().optional(),
        bniChapter: z.string().optional(),
        status: z.enum(["registered", "confirmed", "cancelled", "attended"]).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updateData } = input;
        await db.updateEventRegistration(id, updateData);
        return { success: true };
      }),

    deleteEventRegistration: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRegistration(input.id);
        return { success: true };
      }),

    getEventRegistrationStats: adminProcedure
      .query(async () => {
        return await db.getEventRegistrationStats();
      }),
  }),

  contact: router({
    // Public procedure to submit contact form
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(1, "請輸入姓名"),
        email: z.string().email("請輸入有效的電子郵件"),
        phone: z.string().optional(),
        inquiryType: z.enum(["enterprise", "public", "coaching", "other"]),
        message: z.string().min(10, "訊息至少需要10個字元"),
        turnstileToken: z.string().min(1, "請完成人機驗證"),
      }))
      .mutation(async ({ input }) => {
        // Verify Turnstile token
        const turnstileResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: ENV.turnstileSecretKey,
            response: input.turnstileToken,
          }),
        });
        
        const turnstileResult = await turnstileResponse.json() as { success: boolean };
        
        if (!turnstileResult.success) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "人機驗證失敗，請重新驗證" });
        }
        
        await db.createContact(input);
        
        // Send email notification to owner
        const inquiryTypeMap = {
          enterprise: "企業內訓",
          public: "公開課",
          coaching: "1對1教學",
          other: "其他"
        };
        
        await notifyOwner({
          title: `新的聯絡表單提交：${input.name}`,
          content: `姓名：${input.name}\n電子郵件：${input.email}\n電話：${input.phone || "未提供"}\n詢問類型：${inquiryTypeMap[input.inquiryType]}\n訊息：\n${input.message}`
        });
        
        // Send auto-reply confirmation email to user
        await sendEmail({
          to: input.email,
          subject: '感謝您的聯繫！我們已收到您的訊息',
          html: generateContactConfirmationEmail(input.name),
        });
        
        return { success: true };
      }),

    // Admin procedures
    getAll: adminProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getContacts(input?.limit, input?.offset);
      }),

    getContacts: adminProcedure
      .input(z.object({
        status: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getContacts(input?.limit, input?.offset, input?.status);
      }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const contact = await db.getContactById(input.id);
        if (!contact) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact not found' });
        }
        return contact;
      }),

    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "contacted", "resolved"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateContactStatus(input.id, input.status);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteContact(input.id);
        return { success: true };
      }),
  }),

  download: router({
    // Public procedure - register and get download link
    register: publicProcedure
      .input(z.object({
        name: z.string().min(1, "請輸入姓名"),
        email: z.string().email("請輸入有效的 Email"),
        resourceSlug: z.string(),
        resourceTitle: z.string(),
        downloadUrl: z.string(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createDownloadLead(input);
        
        // Notify owner about new download lead
        await notifyOwner({
          title: `新的簡報下載註冊：${input.name}`,
          content: `姓名：${input.name}\nEmail：${input.email}\n資源：${input.resourceTitle}`
        });
        
        return { 
          success: true, 
          downloadUrl: input.downloadUrl,
          leadId: result.id 
        };
      }),

    // Admin procedure - get all download leads
    getLeads: adminProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getDownloadLeads(input?.limit, input?.offset);
      }),
  }),

  // Payment and promo code routes
  payment: router({
    // Validate promo code
    validatePromoCode: publicProcedure
      .input(z.object({
        code: z.string().min(1),
        eventId: z.number().optional(),
        amount: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.validatePromoCode(input.code, input.eventId, input.amount);
        if (!result.valid) {
          return { valid: false, message: result.message };
        }
        
        const promoCode = result.promoCode!;
        return {
          valid: true,
          promoCode: {
            id: promoCode.id,
            code: promoCode.code,
            discountType: promoCode.discountType,
            discountValue: promoCode.discountValue,
            description: promoCode.description,
          },
        };
      }),

    // Create order and get payment form data
    createOrder: publicProcedure
      .input(z.object({
        eventId: z.number(),
        name: z.string().min(1, "請輸入姓名"),
        email: z.string().email("請輸入有效的 Email"),
        phone: z.string().min(1, "請輸入電話"),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        referralSource: z.enum(["teacher_afeng", "friend", "facebook", "threads", "youtube", "instagram", "other"]).optional(),
        referralSourceOther: z.string().optional(),
        interestedTopics: z.array(z.string()).optional(),
        promoCode: z.string().optional(),
        // 發票資訊
        needInvoice: z.boolean().optional(),
        taxId: z.string().optional(),
        invoiceTitle: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Get event info
        const event = await db.getEventById(input.eventId);
        if (!event) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '活動不存在' });
        }

        // Check for duplicate paid order
        const isDuplicate = await db.checkDuplicateOrder(input.eventId, input.email);
        if (isDuplicate) {
          throw new TRPCError({ code: 'CONFLICT', message: '您已經購買過此課程' });
        }

        let originalAmount = event.price;
        let discountAmount = 0;
        let promoCodeId: number | undefined;
        let promoCodeStr: string | undefined;

        // Validate and apply promo code if provided
        if (input.promoCode) {
          const promoResult = await db.validatePromoCode(input.promoCode, input.eventId, originalAmount);
          if (promoResult.valid && promoResult.promoCode) {
            discountAmount = db.calculateDiscount(originalAmount, promoResult.promoCode);
            promoCodeId = promoResult.promoCode.id;
            promoCodeStr = promoResult.promoCode.code;
          }
        }

        const finalAmount = Math.max(0, originalAmount - discountAmount);

        // Generate order number
        const orderNo = `ORD${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        // Create order
        const orderResult = await db.createOrder({
          orderNo,
          eventId: input.eventId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          company: input.company,
          jobTitle: input.jobTitle,
          referralSource: input.referralSource,
          referralSourceOther: input.referralSourceOther,
          interestedTopics: input.interestedTopics ? JSON.stringify(input.interestedTopics) : undefined,
          originalAmount,
          discountAmount,
          finalAmount,
          promoCodeId,
          promoCode: promoCodeStr,
          paymentStatus: 'pending',
          // 發票資訊
          needInvoice: input.needInvoice || false,
          taxId: input.taxId,
          invoiceTitle: input.invoiceTitle,
        });

        // If promo code was used, increment usage
        if (promoCodeId) {
          await db.incrementPromoCodeUsage(promoCodeId);
        }

        // If final amount is 0, mark as paid immediately
        if (finalAmount === 0) {
          await db.updateOrderPaymentStatus(orderNo, 'paid', {
            paymentMethod: 'promo_code_100_off',
            paidAt: new Date(),
          });
          
          return {
            success: true,
            orderNo,
            finalAmount: 0,
            paymentRequired: false,
          };
        }

        // Generate Newebpay payment form data
        const { createPaymentData } = await import('./_core/newebpay');
        // 藍新金流要求 NotifyURL 和 ReturnURL 只能使用 80 或 443 埠
        // 正式環境使用自訂網域 autolab.cloud
        const baseUrl = 'https://autolab.cloud';

        const paymentData = createPaymentData({
          orderId: orderNo,
          amount: finalAmount,
          itemDesc: event.title,
          email: input.email,
          returnUrl: `${baseUrl}/api/payment/return`,
          notifyUrl: `${baseUrl}/api/payment/notify`,
          clientBackUrl: `${baseUrl}/events/${event.slug}`,
        });

        return {
          success: true,
          orderNo,
          finalAmount,
          paymentRequired: true,
          paymentData,
        };
      }),

    // Get order status
    getOrderStatus: publicProcedure
      .input(z.object({ orderNo: z.string() }))
      .query(async ({ input }) => {
        const result = await db.getOrderByOrderNo(input.orderNo);
        if (!result) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '訂單不存在' });
        }
        return result;
      }),

    // Get order by order number (public, for payment result page)
    getOrderByNo: publicProcedure
      .input(z.object({ orderNo: z.string() }))
      .query(async ({ input }) => {
        const result = await db.getOrderByOrderNo(input.orderNo);
        if (!result) {
          return null;
        }
        return {
          orderNo: result.order.orderNo,
          finalAmount: result.order.finalAmount,
          paymentStatus: result.order.paymentStatus,
          event: result.event ? {
            title: result.event.title,
            slug: result.event.slug,
            eventDate: result.event.eventDate,
            location: result.event.location,
          } : null,
        };
      }),
  }),

  // Admin promo code management
  promoCodes: router({
    getAll: adminProcedure.query(async () => {
      return await db.getAllPromoCodes();
    }),

    create: adminProcedure
      .input(z.object({
        code: z.string().min(1),
        description: z.string().optional(),
        discountType: z.enum(["percentage", "fixed"]),
        discountValue: z.number().min(1),
        minAmount: z.number().optional(),
        maxUses: z.number().optional(),
        eventId: z.number().optional(),
        validFrom: z.date().optional(),
        validUntil: z.date().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await db.createPromoCode({
          ...input,
          code: input.code.toUpperCase(),
        });
        return { success: true, id: result.id };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        code: z.string().optional(),
        description: z.string().optional(),
        discountType: z.enum(["percentage", "fixed"]).optional(),
        discountValue: z.number().optional(),
        minAmount: z.number().optional(),
        maxUses: z.number().optional(),
        eventId: z.number().optional(),
        validFrom: z.date().optional(),
        validUntil: z.date().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        if (data.code) {
          data.code = data.code.toUpperCase();
        }
        await db.updatePromoCode(id, data);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePromoCode(input.id);
        return { success: true };
      }),
  }),

  // Admin order management
  orders: router({
    getAll: adminProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllOrders(input?.limit, input?.offset);
      }),

    getByEvent: adminProcedure
      .input(z.object({ eventId: z.number() }))
      .query(async ({ input }) => {
        return await db.getOrdersByEventId(input.eventId);
      }),
  }),

  // ==================== Video Courses ====================
  videoCourses: router({
    // Public: Get all published courses
    getPublished: publicProcedure.query(async () => {
      return await db.getPublishedVideoCourses();
    }),

    // Public: Get course by slug
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const course = await db.getVideoCourseBySlug(input.slug);
        if (!course) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Course not found' });
        }
        return course;
      }),

    // Public: Get course reviews
    getReviews: publicProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ input }) => {
        return await db.getVideoCourseReviews(input.courseId);
      }),

    // Protected: Check if user has purchased course
    checkPurchase: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.checkUserHasPurchasedCourse(ctx.user.id, input.courseId);
      }),

    // Protected: Get user's purchased courses
    getMyPurchases: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserVideoCoursePurchases(ctx.user.id);
    }),

    // Protected: Get course for viewing (only if purchased)
    getCourseForViewing: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ ctx, input }) => {
        const hasPurchased = await db.checkUserHasPurchasedCourse(ctx.user.id, input.courseId);
        if (!hasPurchased) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You have not purchased this course' });
        }
        const course = await db.getVideoCourseById(input.courseId);
        if (!course) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Course not found' });
        }
        return course;
      }),

    // Protected: Create purchase order
    createPurchase: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        promoCode: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if already purchased
        const hasPurchased = await db.checkUserHasPurchasedCourse(ctx.user.id, input.courseId);
        if (hasPurchased) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'You have already purchased this course' });
        }

        // Get course
        const course = await db.getVideoCourseById(input.courseId);
        if (!course) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Course not found' });
        }

        let originalAmount = course.price;
        let discountAmount = 0;
        let promoCodeId: number | undefined;
        let promoCodeStr: string | undefined;

        // Validate promo code if provided
        if (input.promoCode) {
          const promo = await db.getPromoCodeByCode(input.promoCode);
          if (promo && promo.isActive) {
            // Check validity
            const now = new Date();
            const isValid = 
              (!promo.validFrom || promo.validFrom <= now) &&
              (!promo.validUntil || promo.validUntil >= now) &&
              (!promo.maxUses || promo.usedCount < promo.maxUses) &&
              originalAmount >= promo.minAmount;

            if (isValid) {
              discountAmount = db.calculateDiscount(originalAmount, promo);
              promoCodeId = promo.id;
              promoCodeStr = promo.code;
            }
          }
        }

        const finalAmount = Math.max(0, originalAmount - discountAmount);
        const orderNo = await db.generateVideoCourseOrderNo();

        // Create purchase record
        const purchaseId = await db.createVideoCoursePurchase({
          orderNo,
          userId: ctx.user.id,
          courseId: input.courseId,
          originalAmount,
          discountAmount,
          finalAmount,
          promoCodeId,
          promoCode: promoCodeStr,
          paymentStatus: 'pending',
        });

        // Increment promo code usage
        if (promoCodeId) {
          await db.incrementPromoCodeUsage(promoCodeId);
        }

        return {
          purchaseId,
          orderNo,
          originalAmount,
          discountAmount,
          finalAmount,
          courseTitle: course.title,
        };
      }),

    // Protected: Get/Save course notes
    getNote: protectedProcedure
      .input(z.object({ courseId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserVideoCourseNote(ctx.user.id, input.courseId);
      }),

    saveNote: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        content: z.string(),
        videoTimestamp: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user has purchased
        const hasPurchased = await db.checkUserHasPurchasedCourse(ctx.user.id, input.courseId);
        if (!hasPurchased) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You have not purchased this course' });
        }

        await db.createOrUpdateVideoCourseNote({
          userId: ctx.user.id,
          courseId: input.courseId,
          content: input.content,
          videoTimestamp: input.videoTimestamp,
        });
        return { success: true };
      }),

    // Protected: Submit review
    submitReview: protectedProcedure
      .input(z.object({
        courseId: z.number(),
        rating: z.number().min(1).max(5),
        content: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user has purchased
        const hasPurchased = await db.checkUserHasPurchasedCourse(ctx.user.id, input.courseId);
        if (!hasPurchased) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You have not purchased this course' });
        }

        // Check if already reviewed
        const existingReview = await db.getUserVideoCourseReview(ctx.user.id, input.courseId);
        if (existingReview) {
          // Update existing review
          await db.updateVideoCourseReview(existingReview.id, {
            rating: input.rating,
            content: input.content,
          });
        } else {
          // Create new review
          await db.createVideoCourseReview({
            userId: ctx.user.id,
            courseId: input.courseId,
            rating: input.rating,
            content: input.content,
            isVerifiedPurchase: true,
          });
        }
        return { success: true };
      }),

    // Admin: Get all courses
    getAll: adminProcedure
      .input(z.object({ status: z.enum(['draft', 'published', 'archived']).optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAllVideoCourses(input?.status);
      }),

    // Admin: Create course
    create: adminProcedure
      .input(z.object({
        title: z.string(),
        subtitle: z.string().optional(),
        slug: z.string(),
        description: z.string(),
        highlights: z.string().optional(),
        targetAudience: z.string().optional(),
        coverImage: z.string().optional(),
        previewVideoUrl: z.string().optional(),
        videoUrl: z.string(),
        videoDuration: z.number().optional(),
        slidesUrl: z.string().optional(),
        price: z.number(),
        originalPrice: z.number().optional(),
        studentGroupUrl: z.string().optional(),
        status: z.enum(['draft', 'published', 'archived']).optional(),
      }))
      .mutation(async ({ input }) => {
        const courseId = await db.createVideoCourse({
          ...input,
          publishedAt: input.status === 'published' ? new Date() : undefined,
        });
        return { courseId };
      }),

    // Admin: Update course
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        slug: z.string().optional(),
        description: z.string().optional(),
        highlights: z.string().optional(),
        targetAudience: z.string().optional(),
        coverImage: z.string().optional(),
        previewVideoUrl: z.string().optional(),
        videoUrl: z.string().optional(),
        videoDuration: z.number().optional(),
        slidesUrl: z.string().optional(),
        price: z.number().optional(),
        originalPrice: z.number().optional(),
        studentGroupUrl: z.string().optional(),
        status: z.enum(['draft', 'published', 'archived']).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        // Set publishedAt if publishing
        if (data.status === 'published') {
          const course = await db.getVideoCourseById(id);
          if (course && !course.publishedAt) {
            (data as any).publishedAt = new Date();
          }
        }
        await db.updateVideoCourse(id, data);
        return { success: true };
      }),

    // Admin: Delete course
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteVideoCourse(input.id);
        return { success: true };
      }),

    // Admin: Get all purchases
    getAllPurchases: adminProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllVideoCoursePurchases(input?.limit, input?.offset);
      }),

    // Admin: Get dashboard stats
    getDashboardStats: adminProcedure.query(async () => {
      return await db.getVideoCourseDashboardStats();
    }),
  }),

  // 2026 AI Course Registration
  course2026: router({
    // Submit registration
    register: publicProcedure
      .input(z.object({
        userType: z.enum(["new", "returning"]),
        plan: z.string(),
        planPrice: z.number(),
        selectedSessions: z.array(z.string()),
        selectedMonth: z.string().optional(),
        name1: z.string(),
        phone1: z.string(),
        email1: z.string().email(),
        industry1: z.string().optional(),
        name2: z.string().optional(),
        phone2: z.string().optional(),
        email2: z.string().email().optional(),
        industry2: z.string().optional(),
        paymentMethod: z.enum(["transfer", "online"]),
        transferLast5: z.string().optional(),
        promoCode: z.string().optional(),
        needInvoice: z.boolean().optional(),
        taxId: z.string().optional(),
        invoiceTitle: z.string().optional(),
        subscribeNewsletter: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        // Validate transfer payment
        if (input.paymentMethod === "transfer" && !input.transferLast5) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "選擇銀行匯款必須填寫帳號後五碼",
          });
        }

        // Validate double plan
        if (input.plan === "double" && (!input.name2 || !input.phone2 || !input.email2)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "雙人同行必須填寫第二位學員資料",
          });
        }

        // Create registration record
        const registration = await db.createCourseRegistration2026({
          userType: input.userType,
          plan: input.plan,
          planPrice: input.planPrice,
          selectedSessions: JSON.stringify(input.selectedSessions),
          selectedMonth: input.selectedMonth,
          name1: input.name1,
          phone1: input.phone1,
          email1: input.email1,
          industry1: input.industry1,
          name2: input.name2,
          phone2: input.phone2,
          email2: input.email2,
          industry2: input.industry2,
          paymentMethod: input.paymentMethod,
          transferLast5: input.transferLast5,
          promoCode: input.promoCode,
          needInvoice: input.needInvoice ?? false,
          taxId: input.taxId,
          invoiceTitle: input.invoiceTitle,
          subscribeNewsletter: input.subscribeNewsletter ?? false,
          paymentStatus: input.paymentMethod === "transfer" ? "pending" : "pending",
        });

        // If online payment, generate Newebpay form
        if (input.paymentMethod === "online") {
          const newebpayForm = await db.generateNewebpayForm2026(registration.id, input.planPrice, input.email1);
          return {
            success: true,
            registrationId: registration.id,
            paymentMethod: "online",
            newebpayForm,
          };
        }

        // Send confirmation email
        const { generateCourse2026ConfirmationEmail } = await import('./_core/email');
        const emailHtml = generateCourse2026ConfirmationEmail({
          name: input.name1,
          plan: input.plan,
          planPrice: input.planPrice,
          selectedSessions: input.selectedSessions,
          paymentMethod: input.paymentMethod,
          transferLast5: input.transferLast5,
        });
        
        await sendEmail({
          to: input.email1,
          subject: `🎉 報名成功！2026 AI 實戰應用課`,
          html: emailHtml,
        });
        
        // Notify owner
        await notifyOwner({
          title: "2026 AI 實戰應用課報名通知",
          content: `新報名：${input.name1} (${input.email1})\n方案：${input.plan}\n付款方式：${input.paymentMethod === "transfer" ? "銀行匯款" : "線上刷卡"}${input.transferLast5 ? `\n帳號後五碼：${input.transferLast5}` : ""}`,
        });

        // Send to Make.com Webhook if subscribed to newsletter
        if (input.subscribeNewsletter) {
          const { sendToMakeWebhook } = await import('./_core/makeWebhook');
          await sendToMakeWebhook({
            email: input.email1,
            name: input.name1,
            source: "course_2026",
            timestamp: new Date().toISOString(),
            metadata: {
              plan: input.plan,
            },
          });
          // Also send second person if double plan
          if (input.plan === "double" && input.email2 && input.name2) {
            await sendToMakeWebhook({
              email: input.email2,
              name: input.name2,
              source: "course_2026",
              timestamp: new Date().toISOString(),
              metadata: {
                plan: input.plan,
              },
            });
          }
        }

        // Send to accounting system
        try {
          const { sendCourseRegistration } = await import('./_core/accountingWebhook');
          await sendCourseRegistration({
            userType: input.userType,
            plan: input.plan as 'single' | 'full' | 'double',
            planPrice: input.planPrice,
            selectedSessions: JSON.stringify(input.selectedSessions),
            selectedMonth: input.selectedMonth,
            name1: input.name1,
            phone1: input.phone1,
            email1: input.email1,
            industry1: input.industry1,
            name2: input.name2,
            phone2: input.phone2,
            email2: input.email2,
            industry2: input.industry2,
            paymentMethod: input.paymentMethod,
            transferLast5: input.transferLast5,
            promoCode: input.promoCode,
            paymentStatus: "pending",
          });
        } catch (webhookError) {
          console.error('Failed to send accounting webhook:', webhookError);
        }

        return {
          success: true,
          registrationId: registration.id,
          paymentMethod: "transfer",
        };
      }),

    // Admin: Get all registrations with filters
    getAllRegistrations: adminProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        paymentStatus: z.enum(["pending", "paid", "failed"]).optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllCourseRegistrations2026(
          input?.limit,
          input?.offset,
          {
            paymentStatus: input?.paymentStatus,
            search: input?.search,
          }
        );
      }),

    // Get registration by ID (public access for payment result page)
    getRegistrationById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCourseRegistration2026ById(input.id);
      }),

    // Admin: Update payment status
    updatePaymentStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        paymentStatus: z.enum(["pending", "paid", "failed"]),
      }))
      .mutation(async ({ input }) => {
        return await db.updateCourseRegistration2026PaymentStatus(
          input.id,
          input.paymentStatus
        );
      }),

    // Admin: Get course session statistics
    getCourseSessionStats: adminProcedure
      .query(async () => {
        return await db.getCourseSessionStats();
      }),

    // Admin: Get payment statistics summary
    getPaymentStatsSummary: adminProcedure
      .query(async () => {
        return await db.getPaymentStatsSummary();
      }),

    // Admin: Get all payment records
    getAllPaymentRecords: adminProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        paymentStatus: z.enum(["pending", "paid", "failed"]).optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllPaymentRecords(
          input?.limit,
          input?.offset,
          {
            paymentStatus: input?.paymentStatus,
            search: input?.search,
          }
        );
      }),

    // Admin: Get all course sessions with registrations
    getSessionsWithRegistrations: adminProcedure
      .input(z.object({ monthFilter: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getCourseSessionsWithRegistrationsFromDB(input?.monthFilter);
      }),

    // Admin: Get registrations by session ID
    getRegistrationsBySession: adminProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        return await db.getRegistrationsBySession(input.sessionId);
      }),

    // ============================================================
    // Course Sessions Management
    // ============================================================

    // Admin: Get all course sessions
    getAllSessions: adminProcedure
      .query(async () => {
        return await db.getAllCourseSessions2026();
      }),

    // Admin: Get active sessions (for registration form)
    getActiveSessions: publicProcedure
      .query(async () => {
        return await db.getActiveCourseSessions2026();
      }),

    // Admin: Create course session
    createSession: adminProcedure
      .input(z.object({
        sessionId: z.string().min(1, "場次 ID 不能為空"),
        name: z.string().min(1, "課程名稱不能為空"),
        date: z.string().min(1, "日期不能為空"),
        time: z.string().min(1, "時間不能為空"),
        dayOfWeek: z.string().min(1, "星期不能為空"),
        location: z.string().optional(),
        maxCapacity: z.number().optional(),
        isActive: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createCourseSession2026(input);
      }),

    // Admin: Update course session
    updateSession: adminProcedure
      .input(z.object({
        id: z.number(),
        sessionId: z.string().optional(),
        name: z.string().optional(),
        date: z.string().optional(),
        time: z.string().optional(),
        dayOfWeek: z.string().optional(),
        location: z.string().optional(),
        maxCapacity: z.number().optional(),
        isActive: z.boolean().optional(),
        reminderSent: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await db.updateCourseSession2026(id, data);
      }),

    // Admin: Delete course session
    deleteSession: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteCourseSession2026(input.id);
      }),

    // Admin: Seed initial sessions
    seedSessions: adminProcedure
      .mutation(async () => {
        return await db.seedCourseSessions2026();
      }),

    // ============================================================
    // Attendance Management
    // ============================================================

    // Admin: Get attendance for a session
    getSessionAttendance: adminProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        return await db.getOrCreateSessionAttendance(input.sessionId);
      }),

    // Admin: Update attendance status
    updateAttendance: adminProcedure
      .input(z.object({
        sessionId: z.string(),
        registrationId: z.number(),
        isSecondPerson: z.boolean(),
        attended: z.boolean(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.updateAttendanceByRegistration(
          input.sessionId,
          input.registrationId,
          input.isSecondPerson,
          input.attended,
          ctx.user.id
        );
      }),

    // Admin: Get attendance statistics
    getAttendanceStats: adminProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(async ({ input }) => {
        return await db.getSessionAttendanceStats(input.sessionId);
      }),

    // ============================================================
    // Course Reminder Email
    // ============================================================

    // Admin: Get sessions needing reminder
    getSessionsNeedingReminder: adminProcedure
      .query(async () => {
        return await db.getSessionsNeedingReminder();
      }),

    // Admin: Send reminder for a session
    sendSessionReminder: adminProcedure
      .input(z.object({ sessionId: z.string() }))
      .mutation(async ({ input }) => {
        const session = await db.getCourseSession2026BySessionId(input.sessionId);
        if (!session) {
          throw new TRPCError({ code: "NOT_FOUND", message: "找不到課程場次" });
        }

        const registrations = await db.getRegistrationsForSession(input.sessionId);
        if (registrations.length === 0) {
          return { success: true, sentCount: 0, message: "沒有需要發送提醒的學員" };
        }

        let sentCount = 0;
        for (const reg of registrations) {
          try {
            await sendEmail({
              to: reg.email,
              subject: `[課程提醒] ${session.name} - 明天上課`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">課程提醒</h2>
                  <p>親愛的 ${reg.name} 您好，</p>
                  <p>提醒您明天有以下課程：</p>
                  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #1f2937;">${session.name}</h3>
                    <p style="margin: 5px 0; color: #4b5563;">📅 日期：${session.date} (星期${session.dayOfWeek})</p>
                    <p style="margin: 5px 0; color: #4b5563;">⏰ 時間：${session.time}</p>
                    <p style="margin: 5px 0; color: #4b5563;">📍 地點：${session.location}</p>
                  </div>
                  <p>請準時出席，期待與您見面！</p>
                  <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">此致<br/>AI峰哥團隊</p>
                </div>
              `,
            });
            sentCount++;
          } catch (e) {
            console.error(`Failed to send reminder to ${reg.email}:`, e);
          }
        }

        // Mark reminder as sent
        await db.markSessionReminderSent(input.sessionId);

        return { success: true, sentCount, message: `已成功發送 ${sentCount} 封提醒郵件` };
      }),

    // Admin: Send reminders for all sessions needing reminder
    sendAllReminders: adminProcedure
      .mutation(async () => {
        const sessions = await db.getSessionsNeedingReminder();
        let totalSent = 0;

        for (const session of sessions) {
          const registrations = await db.getRegistrationsForSession(session.sessionId);
          
          for (const reg of registrations) {
            try {
              await sendEmail({
                to: reg.email,
                subject: `[課程提醒] ${session.name} - 明天上課`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">課程提醒</h2>
                    <p>親愛的 ${reg.name} 您好，</p>
                    <p>提醒您明天有以下課程：</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="margin: 0 0 10px 0; color: #1f2937;">${session.name}</h3>
                      <p style="margin: 5px 0; color: #4b5563;">📅 日期：${session.date} (星期${session.dayOfWeek})</p>
                      <p style="margin: 5px 0; color: #4b5563;">⏰ 時間：${session.time}</p>
                      <p style="margin: 5px 0; color: #4b5563;">📍 地點：${session.location}</p>
                    </div>
                    <p>請準時出席，期待與您見面！</p>
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">此致<br/>AI峰哥團隊</p>
                  </div>
                `,
              });
              totalSent++;
            } catch (e) {
              console.error(`Failed to send reminder to ${reg.email}:`, e);
            }
          }

          // Mark reminder as sent
          await db.markSessionReminderSent(session.sessionId);
        }

        return { success: true, sentCount: totalSent, sessionsProcessed: sessions.length };
      }),

    // ============================================================
    // Course Transfer
    // ============================================================

    // Admin: Get available sessions for transfer
    getAvailableTransferSessions: adminProcedure
      .input(z.object({
        currentSessionId: z.string(),
        registrationId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getAvailableTransferSessions(
          input.currentSessionId,
          input.registrationId
        );
      }),

    // Admin: Execute course transfer
    executeCourseTransfer: adminProcedure
      .input(z.object({
        registrationId: z.number(),
        attendeeEmail: z.string(),
        attendeeName: z.string(),
        fromSessionId: z.string(),
        fromSessionName: z.string(),
        fromSessionDate: z.string(),
        fromSessionTime: z.string(),
        toSessionId: z.string(),
        toSessionName: z.string(),
        toSessionDate: z.string(),
        toSessionTime: z.string(),
        location: z.string().optional(),
        reason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Execute the transfer
        const result = await db.executeCourseTransfer({
          registrationId: input.registrationId,
          attendeeEmail: input.attendeeEmail,
          fromSessionId: input.fromSessionId,
          toSessionId: input.toSessionId,
          reason: input.reason,
          transferredBy: ctx.user.name || ctx.user.email || `User ${ctx.user.id}`,
        });

        // Send transfer notification email
        try {
          const { generateCourseTransferEmail } = await import('./_core/email');
          const emailHtml = generateCourseTransferEmail({
            name: input.attendeeName,
            fromSessionName: input.fromSessionName,
            fromSessionDate: input.fromSessionDate,
            fromSessionTime: input.fromSessionTime,
            toSessionName: input.toSessionName,
            toSessionDate: input.toSessionDate,
            toSessionTime: input.toSessionTime,
            location: input.location || '台北',
            reason: input.reason,
          });

          await sendEmail({
            to: input.attendeeEmail,
            subject: `📅 課程調課通知 - ${input.toSessionName}`,
            html: emailHtml,
          });
        } catch (emailError) {
          console.error('Failed to send transfer notification email:', emailError);
          // Don't throw error, transfer was successful
        }

        return result;
      }),

    // Admin: Get transfer history
    getTransferHistory: adminProcedure
      .input(z.object({ registrationId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTransferHistory(input.registrationId);
      }),
  }),

  // Notifications router
  notifications: router({
    // Admin: Create notification
    createNotification: adminProcedure
      .input(z.object({
        title: z.string().min(1, "標題不能為空"),
        content: z.string().min(1, "內容不能為空"),
        type: z.enum(["info", "warning", "success", "error"]).default("info"),
        targetType: z.enum(["all", "user", "role"]).default("all"),
        targetUserId: z.number().optional(),
        targetRole: z.enum(["user", "admin"]).optional(),
        link: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createNotification(input);
      }),

    // Admin: Get all notifications
    getAllNotifications: adminProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllNotifications(input?.limit, input?.offset);
      }),

    // Admin: Delete notification
    deleteNotification: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteNotification(input.id);
      }),

    // Protected: Get user notifications
    getUserNotifications: protectedProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        return await db.getUserNotifications(
          ctx.user.id,
          ctx.user.role,
          input?.limit,
          input?.offset
        );
      }),

    // Protected: Get unread count
    getUnreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUnreadNotificationCount(ctx.user.id, ctx.user.role);
      }),

    // Protected: Mark notification as read
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.markNotificationAsRead(input.notificationId, ctx.user.id);
      }),

    // Protected: Mark all as read
    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        return await db.markAllNotificationsAsRead(ctx.user.id, ctx.user.role);
      }),
  }),

  // AI Super Sales Workshop Registration API
  aiSuperSales: router({
    register: publicProcedure
      .input(z.object({
        name: z.string().min(1, "請輸入姓名"),
        email: z.string().email("請輸入有效的 Email"),
        phone: z.string().min(1, "請輸入電話"),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        selectedSessions: z.array(z.string()).min(1, "請選擇至少一個場次"),
        referralSource: z.enum(["teacher", "line_community", "facebook", "instagram", "youtube", "other"]),
        subscribeNewsletter: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const registration = await db.createAISuperSalesRegistration(input);

        const sessionMap: Record<string, string> = {
          session1: "第一場：2/20 (四) 19:00-21:30",
          session2: "第二場：3/6 (四) 19:00-21:30",
          session3: "第三場：3/20 (四) 19:00-21:30",
          session4: "第四場：4/10 (四) 19:00-21:30",
        };
        const sessionsDisplay = input.selectedSessions.includes("all")
          ? "四場全報"
          : input.selectedSessions.map(session => sessionMap[session] || session).join(", ");

        const referralSourceMap: Record<string, string> = {
          teacher: "阿峰老師",
          line_community: "阿峰老師LINE社群",
          facebook: "Facebook",
          instagram: "Instagram",
          youtube: "YouTube",
          other: "其他",
        };
        const referralSourceDisplay = referralSourceMap[input.referralSource] || input.referralSource;

        try {
          await notifyOwner({
            title: "AI 超級業務實戰班新報名！",
            content: `姓名: ${input.name}\nEmail: ${input.email}\n電話: ${input.phone}\n公司: ${input.company || "未填寫"}\n職稱: ${input.jobTitle || "未填寫"}\n報名場次: ${sessionsDisplay}\n資訊來源: ${referralSourceDisplay}`,
          });
        } catch (error) {
          console.error("[AISuperSales] Failed to notify owner:", error);
        }

        try {
          await sendEmail({
            to: "nikeshoxmiles@gmail.com",
            subject: "AI 超級業務實戰班新報名",
            html: `
              <h2>AI 超級業務實戰班新報名</h2>
              <p><strong>姓名:</strong> ${input.name}</p>
              <p><strong>Email:</strong> ${input.email}</p>
              <p><strong>電話:</strong> ${input.phone}</p>
              <p><strong>公司:</strong> ${input.company || "未填寫"}</p>
              <p><strong>職稱:</strong> ${input.jobTitle || "未填寫"}</p>
              <p><strong>報名場次:</strong> ${sessionsDisplay}</p>
              <p><strong>資訊來源:</strong> ${referralSourceDisplay}</p>
              <p><strong>訂閱電子報:</strong> ${input.subscribeNewsletter ? "是" : "否"}</p>
            `,
          });
        } catch (error) {
          console.error("[AISuperSales] Failed to send notification email:", error);
        }

        return {
          success: true,
          registrationId: registration.id,
        };
      }),

    getAllRegistrations: adminProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        searchTerm: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllAISuperSalesRegistrations(input);
      }),

    exportCSV: adminProcedure.query(async () => {
      return await db.getAllAISuperSalesRegistrations();
    }),

    getStats: adminProcedure.query(async () => {
      return await db.getAISuperSalesStats();
    }),

    getSessionStats: adminProcedure.query(async () => {
      return await db.getAISuperSalesSessionStats();
    }),

    updateRegistration: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        phone: z.string().min(1).optional(),
        company: z.string().nullable().optional(),
        jobTitle: z.string().nullable().optional(),
        selectedSessions: z.array(z.string()).min(1).optional(),
        referralSource: z.enum(["teacher", "line_community", "facebook", "instagram", "youtube", "other"]).optional(),
        subscribeNewsletter: z.boolean().optional(),
        notes: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updated = await db.updateAISuperSalesRegistration(id, data);
        if (!updated) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Registration not found" });
        }
        return updated;
      }),

    deleteRegistration: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAISuperSalesRegistration(input.id);
        return { success: true };
      }),

    adminCreateRegistration: adminProcedure
      .input(z.object({
        name: z.string().min(1, "請輸入姓名"),
        email: z.string().email("請輸入有效的 Email"),
        phone: z.string().min(1, "請輸入電話"),
        company: z.string().optional(),
        jobTitle: z.string().optional(),
        selectedSessions: z.array(z.string()).min(1, "請選擇至少一個場次"),
        referralSource: z.enum(["teacher", "line_community", "facebook", "instagram", "youtube", "other"]),
        subscribeNewsletter: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createAISuperSalesRegistration(input);
      }),
  }),

  // Corporate Training Inquiry API
  corporateInquiry: router({
    submit: publicProcedure
      .input(z.object({
        name: z.string().min(1, "請填寫姓名"),
        company: z.string().min(1, "請填寫公司名稱"),
        jobTitle: z.string().min(1, "請填寫職稱"),
        email: z.string().email("請填寫有效的 Email"),
        phone: z.string().optional(),
        headcount: z.string().optional(),
        programs: z.array(z.string()).optional(),
        preferredTime: z.string().optional(),
        notes: z.string().optional(),
        sourcePage: z.enum(["general", "tech", "manufacturing"]),
      }))
      .mutation(async ({ input }) => {
        const inquiry = await db.createCorporateInquiry({
          ...input,
          phone: input.phone || null,
          headcount: input.headcount || null,
          programs: input.programs ? JSON.stringify(input.programs) : null,
          preferredTime: input.preferredTime || null,
          notes: input.notes || null,
        });

        const sourcePageLabel = {
          general: "(全產業) 企業內訓",
          tech: "科技業 AI 實戰工作坊",
          manufacturing: "製造業 AI 實戰工作坊",
        }[input.sourcePage];
        const programsList = input.programs?.join("、") || "未選擇";

        try {
          await sendEmail({
            to: "nikeshoxmiles@gmail.com",
            subject: `【企業邀課】${input.company} - ${sourcePageLabel}`,
            html: `
              <h2>新的企業邀課諮詢</h2>
              <p><strong>來源頁面:</strong> ${sourcePageLabel}</p>
              <p><strong>姓名:</strong> ${input.name}</p>
              <p><strong>公司:</strong> ${input.company}</p>
              <p><strong>職稱:</strong> ${input.jobTitle}</p>
              <p><strong>Email:</strong> <a href="mailto:${input.email}">${input.email}</a></p>
              <p><strong>電話:</strong> ${input.phone || "未填寫"}</p>
              <p><strong>預計人數:</strong> ${input.headcount || "未填寫"}</p>
              <p><strong>有興趣方案:</strong> ${programsList}</p>
              <p><strong>預計時間:</strong> ${input.preferredTime || "未填寫"}</p>
              <p><strong>其他需求:</strong> ${input.notes || "無"}</p>
            `,
          });
          await db.markCorporateInquiryEmailSent(inquiry.id);
        } catch (error) {
          console.error("[CorporateInquiry] Failed to send notification email:", error);
        }

        try {
          await notifyOwner({
            title: `企業邀課：${input.company}`,
            content: `${input.name}（${input.jobTitle}）從${sourcePageLabel}頁面提交了邀課諮詢。\n公司：${input.company}\nEmail：${input.email}\n電話：${input.phone || "未填寫"}\n方案：${programsList}`,
          });
        } catch (error) {
          console.error("[CorporateInquiry] Failed to notify owner:", error);
        }

        return { success: true, id: inquiry.id };
      }),

    getAll: adminProcedure
      .input(z.object({
        limit: z.number().optional(),
        offset: z.number().optional(),
        status: z.string().optional(),
        sourcePage: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await db.getAllCorporateInquiries(input);
      }),

    getStats: adminProcedure.query(async () => {
      return await db.getCorporateInquiryStats();
    }),

    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const inquiry = await db.getCorporateInquiryById(input.id);
        if (!inquiry) {
          throw new TRPCError({ code: "NOT_FOUND", message: "找不到此邀課申請" });
        }
        return inquiry;
      }),

    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "quoted", "closed", "cancelled"]),
        adminNotes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const updated = await db.updateCorporateInquiryStatus(input.id, input.status, input.adminNotes);
        if (!updated) {
          throw new TRPCError({ code: "NOT_FOUND", message: "找不到此邀課申請" });
        }
        return updated;
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteCorporateInquiry(input.id);
      }),
  }),

  // Translation API
  translation: router({
    // Public: Translate single text
    translateText: publicProcedure
      .input(z.object({
        text: z.string(),
        targetLanguage: z.enum(["zh-TW", "zh-CN", "en", "ko", "ja"]),
      }))
      .mutation(async ({ input }) => {
        const translated = await translateText(input.text, input.targetLanguage as SupportedLanguage);
        return { translatedText: translated };
      }),

    // Public: Translate multiple texts
    translateBatch: publicProcedure
      .input(z.object({
        texts: z.array(z.string()),
        targetLanguage: z.enum(["zh-TW", "zh-CN", "en", "ko", "ja"]),
      }))
      .mutation(async ({ input }) => {
        const translated = await translateBatch(input.texts, input.targetLanguage as SupportedLanguage);
        return { translatedTexts: translated };
      }),
  }),
});

export type AppRouter = typeof appRouter;
