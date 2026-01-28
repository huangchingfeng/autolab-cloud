import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { marked } from "marked";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Eye, ArrowLeft, Download, FileText } from "lucide-react";
import { DownloadForm } from "@/components/DownloadForm";
import { EventPromotion } from "@/components/EventPromotion";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Streamdown } from "streamdown";
import { Link } from "wouter";
import { RelatedPosts } from "@/components/RelatedPosts";
import { AuthorBio } from "@/components/AuthorBio";
import { SubstackSubscribe } from "@/components/SubstackSubscribe";
import { ArticleAccessForm } from "@/components/ArticleAccessForm";
import { PaidContentTeaser } from "@/components/PaidContentTeaser";
import { useState, useEffect } from "react";
import { JsonLdSchema } from "@/components/JsonLdSchema";
import { SeoHead } from "@/components/SeoHead";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { calculateReadingTime } from "@/lib/readingTime";
import { Clock } from "lucide-react";

// Helper function to render Markdown with HTML support
function renderMarkdownWithHTML(content: string): string {
  // Configure marked to allow HTML
  marked.setOptions({
    breaks: true,
    gfm: true,
  });
  return marked.parse(content) as string;
}

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";
  const [showAccessForm, setShowAccessForm] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const { data, isLoading, error } = trpc.blog.getPostBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );



  // Check if this article requires access control
  const isRestrictedArticle = slug === 'ai-social-media-content-automation' || slug === 'gemini-2025-course-review' || slug === 'notebooklm-2026-course-review';
  
  // NotebookLM article now uses the same restricted article logic as Gemini
  
  // Member whitelist
  const MEMBER_WHITELIST = [
    "tan_meisee@yahoo.com", "dalelin@systex.com", "linda@tglobalcorp.com",
    "piuo0413@yahoo.com.tw", "wendywu@systex.com", "jeff_liu@systex.com",
    "winniehuang@systex.com", "akaisun@yufengrubber.com.tw", "quennlai@systex.com",
    "juliahsu@systex.com", "abby_chen@systex.com", "ceoassistant@cwgv.com.tw",
    "maggiehuang@systex.com", "cszutsung@gmail.com", "liv2227@gmail.com",
    "duncan23418@abrealbiotech.com", "sandychen0830@gmail.com", "sales009@abrealbiotech.com",
    "specialist02@abrealbiotech.com", "maggie620806@gmail.com", "stan.yin@gmail.com",
    "rabits5218@gmail.com", "sam@toolsbiotech.com", "phina2@gmail.com",
    "kuotunyh@gmail.com", "winniewei@abrealbiotech.com", "maxmaitirain@gmail.com",
    "joe0987059@gmail.com", "jiune0319@gmail.com", "jameskuo0406@gmail.com",
    "shapi.520@gmail.com", "specialist@abrealbiotech.com", "ritachiu520168@gmail.com",
    "jax@toolsbiotech.com", "jlu1005@kimo.com", "wayne@toolsbiotech.com",
    "lohas.chao@gmail.com", "yeachynlin@gmail.com", "mico0904@toolsbiotech.com",
    "shanna@toolsbiotech.com", "tingyu@toolsbiotech.com", "huangfrade0723@gmail.com",
    "nancy@toolsbiotech.com", "nina.uihona@gmail.com", "mstan@mail.ntue.edu.tw",
    "molly901213@toolsbiotech.com", "chris@toolsbiotech.com", "dorinfan117@gmail.com",
    "miniconcha@gmail.com", "valeriewong2006@gmail.com", "a0983695168@gmail.com",
    "chiachilin61@gmail.com", "tannin.wu@toolsbiotech.com", "t1979sun@gmail.com",
    "alvin.cho@toolsbiotech.com", "nikeshoxmiles@gmail.com"
  ];
  
  // Check if user is a paid member
  const isPaidMember = isAuthenticated && user?.email && MEMBER_WHITELIST.includes(user.email.toLowerCase());

  // Check cookie for existing access
  useEffect(() => {
    if (isRestrictedArticle && typeof document !== 'undefined') {
      const cookies = document.cookie.split('; ');
      const accessCookie = cookies.find(c => c.startsWith(`article_access_${slug}=`));
      if (accessCookie) {
        setHasAccess(true);
      }
    }
  }, [slug, isRestrictedArticle]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16">
          <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-96 bg-muted rounded"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="text-3xl font-bold">文章不存在</h1>
            <p className="text-muted-foreground">找不到您要查看的文章</p>
            <Button asChild>
              <Link href="/blog">
                返回文章列表
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { post, author, category, tags } = data;

  // 建立 BlogPosting Schema
  const blogPostSchema = {
    type: 'BlogPosting' as const,
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.coverImage || undefined,
    datePublished: (post.publishedAt || post.createdAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: {
      '@type': 'Person' as const,
      name: '黃敬峰',
      url: 'https://ai-tw.manus.space',
    },
    publisher: {
      '@type': 'Organization' as const,
      name: 'AI峰哥 - 黃敬峰企業AI培訓',
      logo: {
        '@type': 'ImageObject' as const,
        url: 'https://ai-tw.manus.space/teacher-photo.jpg',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage' as const,
      '@id': `https://ai-tw.manus.space/blog/${post.slug}`,
    },
  };

  return (
    <>
      <SeoHead
        title={`${post.title} | AI峰哥`}
        description={post.excerpt || post.title}
        keywords={tags.filter((t): t is NonNullable<typeof t> => t !== null).map(t => t.name).join(', ')}
        ogImage={post.coverImage || undefined}
        ogType="article"
        canonicalUrl={`https://ai-tw.manus.space/blog/${post.slug}`}
      />
      <JsonLdSchema data={blogPostSchema} />
      <ReadingProgressBar />
      <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background" style={{paddingTop: '10px', paddingBottom: '64px'}}>
          <div className="container">
            <div className="max-w-4xl mx-auto space-y-6">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/blog" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  返回文章列表
                </Link>
              </Button>

              {category && (
                <Badge variant="secondary" className="text-sm">
                  {category.name}
                </Badge>
              )}

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {author && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{author.name}</span>
                  </div>
                )}
                {post.publishedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(post.publishedAt), "yyyy年MM月dd日", {
                        locale: zhTW,
                      })}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span>{post.viewCount} 次瀏覽</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>約 {calculateReadingTime(post.content)} 分鐘閱讀</span>
                </div>
              </div>

              {tags && tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.filter(tag => tag !== null).map((tag) => (
                    <Badge key={tag!.id} variant="outline">
                      #{tag!.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Cover Image */}
        {post.coverImage && (
          <section className="container py-8">
            <div className="max-w-4xl mx-auto">
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          </section>
        )}

        {/* Content */}
        <section className="container" style={{paddingTop: '10px', paddingBottom: '64px'}}>
          <article className="max-w-4xl mx-auto">
            {isRestrictedArticle && !hasAccess ? (
              // Show access form or teaser for restricted articles
              showAccessForm ? (
                <ArticleAccessForm
                  articleSlug={slug}
                  onAccessGranted={() => {
                    setHasAccess(true);
                    setShowAccessForm(false);
                  }}
                />
              ) : (
                <>
                  {/* Show first 1/3 of content */}
                  <div className="prose prose-lg max-w-none dark:prose-invert">
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdownWithHTML(post.content.split('\n').slice(0, Math.ceil(post.content.split('\n').length / 3)).join('\n')) }} />
                  </div>
                  
                  {/* Paid content teaser */}
                  <PaidContentTeaser onUnlock={() => setShowAccessForm(true)} />
                </>
              )
            ) : (
              // Show full content for non-restricted articles or verified users
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <div dangerouslySetInnerHTML={{ __html: renderMarkdownWithHTML(post.content) }} />
              </div>
            )}
          </article>
        </section>

        {/* Download Resource Section - Only show for specific posts */}
        {post.slug === "xincheng-industry-ai-transformation" && (
          <section className="container py-12">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl p-8 border border-amber-100 dark:border-amber-900">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FileText className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold mb-2">傳產 AI 轉型實戰簡報</h3>
                    <p className="text-muted-foreground mb-4">
                      免費下載完整簡報，包含新呈工業 AI 轉型案例分析、三個關鍵心法、實戰步驟與圖表！
                    </p>
                    <DownloadForm
                      resourceSlug="xincheng-industry-ai-transformation"
                      resourceTitle="傳產 AI 轉型實戰簡報"
                      downloadUrl="/downloads/Factory_AI_Transformation.pdf"
                      buttonText="免費下載簡報"
                      description="填寫以下資訊即可免費下載完整簡報"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {post.slug === "google-gemini-ai-prompts-taiwan-localization" && (
          <section className="container py-12">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-2xl p-8 border border-green-100 dark:border-green-900">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FileText className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold mb-2">📥 下載完整簡報</h3>
                    <p className="text-muted-foreground mb-4">
                      想要更深入了解這些提示詞的應用？阿峰老師特別準備了「台灣 2026 AI 執行系統」完整簡報，內含更多實戰案例與應用技巧！
                    </p>
                    <DownloadForm
                      resourceSlug="google-gemini-ai-prompts-taiwan-localization"
                      resourceTitle="台灣 2026 AI 執行系統完整簡報"
                      downloadUrl="https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/downloads/台灣_2026_AI_執行系統-cyjk61fb92.pdf"
                      buttonText="免費下載簡報"
                      description="填寫以下資訊，我們會立即將簡報下載連結寄送到您的信箱"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {post.slug === "google-gemini-3-guide-flash-thinking-pro" && (
          <section className="container py-12">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-8 border border-blue-100 dark:border-blue-900">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FileText className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold mb-2">Gemini AI 菁英團隊戰略指南</h3>
                    <p className="text-muted-foreground mb-4">
                      免費下載完整簡報，包含文章所有重點整理、圖表與實戰步驟，讓您隨時複習參考！
                    </p>
                    <DownloadForm
                      resourceSlug="google-gemini-3-guide-flash-thinking-pro"
                      resourceTitle="Gemini AI 菁英團隊戰略指南"
                      downloadUrl="https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/downloads/gemini-ai-strategy-guide-1766013637092.pdf"
                      buttonText="免費下載簡報"
                      description="填寫以下資訊即可免費下載完整簡報"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {post.slug === "google-notebooklm-8-tips-visual-slides" && (
          <section className="container py-12">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl p-8 border border-amber-100 dark:border-amber-900">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <FileText className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold mb-2">NotebookLM 視覺化簡報實戰指南</h3>
                    <p className="text-muted-foreground mb-4">
                      免費下載完整簡報，包含 8 種功能的詳細操作步驟、實際案例與應用場景！
                    </p>
                    <DownloadForm
                      resourceSlug="google-notebooklm-8-tips-visual-slides"
                      resourceTitle="NotebookLM 視覺化簡報實戰指南"
                      downloadUrl="https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/downloads/notebooklm-8-tips-slides-1766211981791.pdf"
                      buttonText="免費下載簡報"
                      description="填寫以下資訊即可免費下載完整簡報"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {post.slug === "ai-crm-automation-sales-engine" && (
          <section className="container py-12">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-2xl p-8 border border-blue-100 dark:border-blue-900">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <FileText className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold mb-2">AI × CRM 效率革命 完整簡報</h3>
                    <p className="text-muted-foreground mb-4">
                      免費下載直播完整簡報，包含所有案例、流程圖與實戰技巧，讓你隨時複習參考！
                    </p>
                    <DownloadForm
                      resourceSlug="ai-crm-automation-sales-engine"
                      resourceTitle="AI × CRM 效率革命 完整簡報"
                      downloadUrl="https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/blog/ai-crm/AI_CRM_效率革命.pdf"
                      buttonText="免費下載簡報"
                      description="填寫以下資訊即可免費下載完整簡報"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {post.slug === "manus-ai-agent-website-app-automation" && (
          <section className="container py-12">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-2xl p-8 border border-violet-100 dark:border-violet-900">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="flex-shrink-0 flex gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FileText className="h-8 w-8 text-white" />
                    </div>
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Download className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">免費下載 Manus 課後精華資料</h3>
                    <p className="text-muted-foreground mb-4">
                      填寫以下資訊，即可免費下載兩份完整資料：
                    </p>
                    <ul className="text-sm text-muted-foreground mb-4 space-y-1">
                      <li className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-violet-500" />
                        <span>AI 代理人 Manus 課後精華簡報 (PDF)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-emerald-500" />
                        <span>Manus AI 系統應用與功能特點總覽 (Excel)</span>
                      </li>
                    </ul>
                    <DownloadForm
                      resourceSlug="manus-ai-agent-bundle"
                      resourceTitle="Manus 課後精華資料包"
                      downloadUrl="https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/manus-article/AI代理人Manus課後精華.pdf"
                      downloadUrl2="https://d2xsxph8kpxj0f.cloudfront.net/95179607/D8QXMb7ThVwxNTQZRzfrBM/manus-article/ManusAI系統應用與功能特點總覽.xlsx"
                      buttonText="免費下載資料包"
                      description="填寫以下資訊即可免費下載"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Author Bio Section */}
        <section className="container py-12">
          <div className="max-w-4xl mx-auto">
            <AuthorBio />
          </div>
        </section>

        {/* Substack Subscribe Section */}
        <section className="container py-12">
          <div className="max-w-4xl mx-auto">
            <SubstackSubscribe />
          </div>
        </section>

        {/* Event Promotion Section */}
        <EventPromotion />

        {/* Related Posts Section */}
        <RelatedPosts postId={post.id} currentSlug={post.slug} />

        {/* View All Posts CTA */}
        <section className="container py-16">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h2 className="text-2xl font-bold">探索更多文章</h2>
            <Button asChild size="lg">
              <Link href="/blog">
                查看所有文章
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
      </div>
    </>
  );
}
