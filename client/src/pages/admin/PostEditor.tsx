import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Eye, X, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { useRef } from "react";

export default function PostEditor() {
  const [, params] = useRoute("/admin/posts/:id");
  const [, setLocation] = useLocation();
  const postId = params?.id === "new" ? null : Number(params?.id);
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: post, isLoading: postLoading } = trpc.blog.getPostById.useQuery(
    { id: postId! },
    { enabled: postId !== null && user?.role === "admin" }
  );

  const { data: categories } = trpc.blog.getCategories.useQuery();
  const { data: tags } = trpc.blog.getTags.useQuery();

  const uploadImageMutation = trpc.blog.uploadImage.useMutation({
    onSuccess: (data) => {
      // Insert markdown image syntax at cursor position
      const imageMarkdown = `\n![image](${data.url})\n`;
      setContent(prev => prev + imageMarkdown);
      toast.success("圖片上傳成功");
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error(`圖片上傳失敗：${error.message}`);
      setIsUploading(false);
    },
  });

  const createMutation = trpc.blog.createPost.useMutation({
    onSuccess: () => {
      toast.success("文章已建立");
      setLocation("/admin/posts");
    },
    onError: (error) => {
      toast.error(`建立失敗：${error.message}`);
    },
  });

  const updateMutation = trpc.blog.updatePost.useMutation({
    onSuccess: () => {
      toast.success("文章已更新");
      setLocation("/admin/posts");
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  useEffect(() => {
    if (post) {
      setTitle(post.post.title);
      setSlug(post.post.slug);
      setExcerpt(post.post.excerpt || "");
      setContent(post.post.content);
      setCoverImage(post.post.coverImage || "");
      setCategoryId(post.post.categoryId?.toString() || "");
      setStatus(post.post.status);
      setSelectedTags(post.tags?.filter(t => t !== null).map(t => t!.id) || []);
    }
  }, [post]);

  const handleSubmit = (e: React.FormEvent, publishNow?: boolean) => {
    e.preventDefault();

    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast.error("請填寫標題、網址代稱和內容");
      return;
    }

    const postData = {
      title,
      slug,
      excerpt: excerpt || undefined,
      content,
      coverImage: coverImage || undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      status: publishNow ? ("published" as const) : status,
      publishedAt: publishNow ? new Date() : status === "published" ? new Date() : undefined,
      tagIds: selectedTags,
    };

    if (postId) {
      updateMutation.mutate({ id: postId, ...postData });
    } else {
      createMutation.mutate(postData);
    }
  };

  const generateSlug = () => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(slug);
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("請選擇圖片檔案");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("圖片大小不能超過 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = (reader.result as string).split(',')[1];
        uploadImageMutation.mutate({
          filename: file.name,
          contentType: file.type,
          base64Data,
        });
      };
      reader.onerror = () => {
        toast.error("讀取檔案失敗");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("處理圖片失敗");
      setIsUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (authLoading || (postId && postLoading)) {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/posts" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{postId ? "編輯文章" : "新增文章"}</h1>
        </div>
        <div className="flex items-center gap-2">
          {status === "published" && slug && (
            <Button variant="outline" asChild>
              <Link href={`/blog/${slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                預覽
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            onClick={(e) => handleSubmit(e)}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            儲存草稿
          </Button>
          <Button
            onClick={(e) => handleSubmit(e, true)}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            發布文章
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本資訊</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">標題 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="輸入文章標題"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="slug">網址代稱 (Slug) *</Label>
                <Button type="button" variant="ghost" size="sm" onClick={generateSlug}>
                  自動生成
                </Button>
              </div>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="article-slug"
                required
              />
              <p className="text-xs text-muted-foreground">
                文章網址：/blog/{slug || "article-slug"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">摘要</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="簡短描述文章內容（選填）"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">內容 * (支援 Markdown)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "上傳中..." : "插入圖片"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="輸入文章內容，支援 Markdown 格式"
                rows={20}
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                點擊「插入圖片」上傳圖片到 S3，自動插入 Markdown 語法
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>媒體與分類</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coverImage">封面圖片網址</Label>
              <Input
                id="coverImage"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                type="url"
              />
              {coverImage && (
                <div className="mt-2 overflow-hidden rounded-lg border">
                  <img
                    src={coverImage}
                    alt="封面預覽"
                    className="w-full h-48 object-cover transition-transform duration-300 hover:scale-110"
                    onError={(e) => {
                      e.currentTarget.src = "";
                      toast.error("封面圖片網址無效");
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">分類</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="選擇分類" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">未分類</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>標籤</Label>
              <div className="flex flex-wrap gap-2">
                {tags?.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.id) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
              {tags?.length === 0 && (
                <p className="text-sm text-muted-foreground">尚無標籤，請先建立標籤</p>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
