import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Draft = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  suggestedTags: string[];
  seoTitle: string;
  seoDescription: string;
  linePost: string;
};

const toneOptions = [
  "專業、務實、像阿峰老師親自分享",
  "企業顧問風格，重點清楚",
  "教學型文章，適合初學者",
  "業務導向，強調成交與效率",
];

function cleanCommentText(value: string) {
  return value.trim().replace(/-->/g, "-- >");
}

function buildContentForSave(draft: Draft) {
  const notes = [
    draft.seoTitle ? `SEO 標題：${cleanCommentText(draft.seoTitle)}` : "",
    draft.seoDescription ? `SEO 描述：${cleanCommentText(draft.seoDescription)}` : "",
    draft.linePost ? `LINE 貼文：${cleanCommentText(draft.linePost)}` : "",
  ].filter(Boolean);

  if (notes.length === 0) {
    return draft.content.trim();
  }

  return `${draft.content.trim()}\n\n<!--\nAutoLab AI Writer Notes\n${notes.join("\n")}\n-->`;
}

export default function AIWriter() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [sourceContent, setSourceContent] = useState("");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("企業主、人資主管、業務主管");
  const [goal, setGoal] = useState("改寫成阿峰老師風格文章，導流企業內訓諮詢");
  const [tone, setTone] = useState(toneOptions[0]);
  const [cta, setCta] = useState("引導讀者加 LINE 或填寫企業內訓諮詢表單");
  const [sourceNotes, setSourceNotes] = useState("");
  const [categoryId, setCategoryId] = useState("0");
  const [scheduledAt, setScheduledAt] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);

  const { data: categories } = trpc.blog.getCategories.useQuery();

  const generateMutation = trpc.blog.generatePostDraft.useMutation({
    onSuccess: (data) => {
      setDraft({
        ...data,
        suggestedTags: data.suggestedTags || [],
      });
      toast.success("文章草稿已產生");
    },
    onError: (error) => {
      toast.error(`產生失敗：${error.message}`);
    },
  });

  const createMutation = trpc.blog.createPost.useMutation({
    onSuccess: (data) => {
      toast.success("已存成草稿");
      setLocation(`/admin/posts/${data.postId}`);
    },
    onError: (error) => {
      toast.error(`儲存失敗：${error.message}`);
    },
  });

  const handleGenerate = (event: FormEvent) => {
    event.preventDefault();

    if (!sourceContent.trim()) {
      toast.error("請先貼上原文或素材內容");
      return;
    }

    generateMutation.mutate({
      sourceContent: sourceContent.trim(),
      topic: topic.trim() || undefined,
      audience: audience.trim() || undefined,
      goal: goal.trim() || undefined,
      tone,
      cta: cta.trim() || undefined,
      sourceNotes: sourceNotes.trim() || undefined,
    });
  };

  const handleCreateDraft = () => {
    if (!draft?.title.trim() || !draft.slug.trim() || !draft.content.trim()) {
      toast.error("請確認標題、網址代稱和內容都有填寫");
      return;
    }

    createMutation.mutate({
      title: draft.title.trim(),
      slug: draft.slug.trim(),
      excerpt: draft.excerpt.trim() || undefined,
      content: buildContentForSave(draft),
      categoryId: categoryId !== "0" ? Number(categoryId) : undefined,
      status: "draft",
      publishedAt: scheduledAt ? new Date(scheduledAt) : undefined,
    });
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse"></div>
        <div className="h-96 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">權限不足</h2>
        <p className="text-muted-foreground">您沒有權限訪問此頁面</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/posts" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回文章
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">AI 發文助理</h1>
              <Badge variant="secondary">阿峰老師風格</Badge>
            </div>
            <p className="text-muted-foreground mt-2">貼上原文或素材，改寫成阿峰老師風格文章。</p>
          </div>
        </div>
        <Button
          onClick={handleCreateDraft}
          disabled={!draft || createMutation.isPending}
          className="w-full lg:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          存成文章草稿
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,0.9fr)_minmax(420px,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              改寫素材
            </CardTitle>
            <CardDescription>把文章、逐字稿或筆記整理成可編輯的部落格草稿。</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="sourceContent">原文或素材 *</Label>
                <Textarea
                  id="sourceContent"
                  value={sourceContent}
                  onChange={(event) => setSourceContent(event.target.value)}
                  rows={12}
                  placeholder="貼上要改寫的文章、課程逐字稿、LINE 內容、筆記或重點..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="topic">改寫方向或標題</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="例：改成企業主管看得懂的 AI 導入文章"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audience">目標讀者</Label>
                <Input
                  id="audience"
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">文章目的</Label>
                <Input
                  id="goal"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">文章語氣</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger id="tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">文章分類</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="選擇分類" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">未分類</SelectItem>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduledAt">排程發布時間</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cta">結尾行動</Label>
                <Input
                  id="cta"
                  value={cta}
                  onChange={(event) => setCta(event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceNotes">補充要求</Label>
                <Textarea
                  id="sourceNotes"
                  value={sourceNotes}
                  onChange={(event) => setSourceNotes(event.target.value)}
                  rows={5}
                  placeholder="例：語氣更像課堂分享、保留某個段落、結尾導向企業內訓..."
                />
              </div>

              <Button
                type="submit"
                disabled={generateMutation.isPending || !sourceContent.trim()}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {generateMutation.isPending ? "改寫中..." : "改寫成阿峰老師風格"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              草稿內容
            </CardTitle>
            <CardDescription>儲存後會進入文章管理，SEO 與 LINE 內容會保留在草稿底部。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {!draft ? (
              <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                尚未產生草稿
              </div>
            ) : (
              <>
                <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
                  <div className="space-y-2">
                    <Label htmlFor="draft-title">標題 *</Label>
                    <Input
                      id="draft-title"
                      value={draft.title}
                      onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="draft-slug">網址代稱 *</Label>
                    <Input
                      id="draft-slug"
                      value={draft.slug}
                      onChange={(event) => setDraft({ ...draft, slug: event.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="draft-excerpt">摘要</Label>
                  <Textarea
                    id="draft-excerpt"
                    value={draft.excerpt}
                    onChange={(event) => setDraft({ ...draft, excerpt: event.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="draft-content">文章內容 *</Label>
                  <Textarea
                    id="draft-content"
                    value={draft.content}
                    onChange={(event) => setDraft({ ...draft, content: event.target.value })}
                    rows={20}
                    className="font-mono text-sm leading-6"
                  />
                </div>

                {draft.suggestedTags.length > 0 && (
                  <div className="space-y-2">
                    <Label>建議標籤</Label>
                    <div className="flex flex-wrap gap-2">
                      {draft.suggestedTags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="seo-title">SEO 標題</Label>
                    <Input
                      id="seo-title"
                      value={draft.seoTitle}
                      onChange={(event) => setDraft({ ...draft, seoTitle: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seo-description">SEO 描述</Label>
                    <Textarea
                      id="seo-description"
                      value={draft.seoDescription}
                      onChange={(event) => setDraft({ ...draft, seoDescription: event.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="line-post">LINE 貼文</Label>
                  <Textarea
                    id="line-post"
                    value={draft.linePost}
                    onChange={(event) => setDraft({ ...draft, linePost: event.target.value })}
                    rows={5}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
