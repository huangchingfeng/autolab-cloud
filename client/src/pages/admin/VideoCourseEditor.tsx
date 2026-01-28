import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Link } from "wouter";

export default function VideoCourseEditor() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const isEditing = id && id !== "new";
  const courseId = isEditing ? parseInt(id, 10) : undefined;

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    slug: "",
    description: "",
    highlights: "",
    targetAudience: "",
    coverImage: "",
    previewVideoUrl: "",
    videoUrl: "",
    videoDuration: "",
    slidesUrl: "",
    price: "",
    originalPrice: "",
    studentGroupUrl: "",
    status: "draft" as "draft" | "published" | "archived",
  });

  const { data: course, isLoading } = trpc.videoCourses.getAll.useQuery(
    undefined,
    { enabled: !!courseId }
  );

  const createMutation = trpc.videoCourses.create.useMutation({
    onSuccess: () => {
      toast.success("課程已建立");
      navigate("/admin/video-courses");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.videoCourses.update.useMutation({
    onSuccess: () => {
      toast.success("課程已更新");
      navigate("/admin/video-courses");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Load existing course data
  useEffect(() => {
    if (courseId && course) {
      const existingCourse = course.find((c) => c.id === courseId);
      if (existingCourse) {
        setFormData({
          title: existingCourse.title,
          subtitle: existingCourse.subtitle || "",
          slug: existingCourse.slug,
          description: existingCourse.description,
          highlights: existingCourse.highlights || "",
          targetAudience: existingCourse.targetAudience || "",
          coverImage: existingCourse.coverImage || "",
          previewVideoUrl: existingCourse.previewVideoUrl || "",
          videoUrl: existingCourse.videoUrl,
          videoDuration: existingCourse.videoDuration?.toString() || "",
          slidesUrl: existingCourse.slidesUrl || "",
          price: existingCourse.price.toString(),
          originalPrice: existingCourse.originalPrice?.toString() || "",
          studentGroupUrl: existingCourse.studentGroupUrl || "",
          status: existingCourse.status,
        });
      }
    }
  }, [courseId, course]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      title: formData.title,
      subtitle: formData.subtitle || undefined,
      slug: formData.slug,
      description: formData.description,
      highlights: formData.highlights || undefined,
      targetAudience: formData.targetAudience || undefined,
      coverImage: formData.coverImage || undefined,
      previewVideoUrl: formData.previewVideoUrl || undefined,
      videoUrl: formData.videoUrl,
      videoDuration: formData.videoDuration ? parseInt(formData.videoDuration, 10) : undefined,
      slidesUrl: formData.slidesUrl || undefined,
      price: parseInt(formData.price, 10),
      originalPrice: formData.originalPrice ? parseInt(formData.originalPrice, 10) : undefined,
      studentGroupUrl: formData.studentGroupUrl || undefined,
      status: formData.status,
    };

    if (courseId) {
      updateMutation.mutate({ id: courseId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const generateSlug = () => {
    const slug = formData.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setFormData({ ...formData, slug });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/video-courses">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {isEditing ? "編輯課程" : "新增課程"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>基本資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">課程名稱 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle">副標題</Label>
                <Input
                  id="subtitle"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">網址代碼 *</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                  <Button type="button" variant="outline" onClick={generateSlug}>
                    自動產生
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">課程說明 *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="highlights">課程亮點（JSON 陣列）</Label>
                <Textarea
                  id="highlights"
                  value={formData.highlights}
                  onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                  placeholder='["亮點1", "亮點2", "亮點3"]'
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">適合對象（JSON 陣列）</Label>
                <Textarea
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  placeholder='["對象1", "對象2", "對象3"]'
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Media & Pricing */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>媒體內容</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coverImage">封面圖片 URL</Label>
                  <Input
                    id="coverImage"
                    value={formData.coverImage}
                    onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previewVideoUrl">預覽影片 URL</Label>
                  <Input
                    id="previewVideoUrl"
                    value={formData.previewVideoUrl}
                    onChange={(e) => setFormData({ ...formData, previewVideoUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoUrl">課程影片 URL *</Label>
                  <Input
                    id="videoUrl"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoDuration">影片時長（秒）</Label>
                  <Input
                    id="videoDuration"
                    type="number"
                    value={formData.videoDuration}
                    onChange={(e) => setFormData({ ...formData, videoDuration: e.target.value })}
                    placeholder="7200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slidesUrl">簡報 URL</Label>
                  <Input
                    id="slidesUrl"
                    value={formData.slidesUrl}
                    onChange={(e) => setFormData({ ...formData, slidesUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>價格與設定</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">售價 (TWD) *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">原價 (TWD)</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="studentGroupUrl">學員群組連結</Label>
                  <Input
                    id="studentGroupUrl"
                    value={formData.studentGroupUrl}
                    onChange={(e) => setFormData({ ...formData, studentGroupUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">狀態</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "draft" | "published" | "archived") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">草稿</SelectItem>
                      <SelectItem value="published">已發布</SelectItem>
                      <SelectItem value="archived">已封存</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/admin/video-courses">
            <Button type="button" variant="outline">
              取消
            </Button>
          </Link>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                儲存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? "更新課程" : "建立課程"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
