import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CategoriesAndTags() {
  const { user, loading: authLoading } = useAuth();
  
  // Category states
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);

  // Tag states
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [tagName, setTagName] = useState("");
  const [tagSlug, setTagSlug] = useState("");
  const [deleteTagId, setDeleteTagId] = useState<number | null>(null);

  const { data: categories, refetch: refetchCategories } = trpc.blog.getCategories.useQuery();
  const { data: tags, refetch: refetchTags } = trpc.blog.getTags.useQuery();

  const createCategoryMutation = trpc.blog.createCategory.useMutation({
    onSuccess: () => {
      toast.success("分類已建立");
      refetchCategories();
      setCategoryDialogOpen(false);
      setCategoryName("");
      setCategorySlug("");
      setCategoryDescription("");
    },
    onError: (error) => {
      toast.error(`建立失敗：${error.message}`);
    },
  });

  const deleteCategoryMutation = trpc.blog.deleteCategory.useMutation({
    onSuccess: () => {
      toast.success("分類已刪除");
      refetchCategories();
      setDeleteCategoryId(null);
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  const createTagMutation = trpc.blog.createTag.useMutation({
    onSuccess: () => {
      toast.success("標籤已建立");
      refetchTags();
      setTagDialogOpen(false);
      setTagName("");
      setTagSlug("");
    },
    onError: (error) => {
      toast.error(`建立失敗：${error.message}`);
    },
  });

  const deleteTagMutation = trpc.blog.deleteTag.useMutation({
    onSuccess: () => {
      toast.success("標籤已刪除");
      refetchTags();
      setDeleteTagId(null);
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  const generateCategorySlug = () => {
    const slug = categoryName
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setCategorySlug(slug);
  };

  const generateTagSlug = () => {
    const slug = tagName
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setTagSlug(slug);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim() || !categorySlug.trim()) {
      toast.error("請填寫分類名稱和代稱");
      return;
    }
    createCategoryMutation.mutate({
      name: categoryName,
      slug: categorySlug,
      description: categoryDescription || undefined,
    });
  };

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim() || !tagSlug.trim()) {
      toast.error("請填寫標籤名稱和代稱");
      return;
    }
    createTagMutation.mutate({
      name: tagName,
      slug: tagSlug,
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">分類與標籤管理</h1>
        <p className="text-muted-foreground mt-2">管理文章的分類和標籤</p>
      </div>

      {/* Categories Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>分類管理</CardTitle>
          <Button onClick={() => setCategoryDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新增分類
          </Button>
        </CardHeader>
        <CardContent>
          {categories && categories.length > 0 ? (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.name}</span>
                      <Badge variant="outline">{category.slug}</Badge>
                    </div>
                    {category.description && (
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteCategoryId(category.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">尚無分類</p>
          )}
        </CardContent>
      </Card>

      {/* Tags Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>標籤管理</CardTitle>
          <Button onClick={() => setTagDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新增標籤
          </Button>
        </CardHeader>
        <CardContent>
          {tags && tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag.id} variant="secondary" className="text-sm py-2 px-3">
                  {tag.name}
                  <button
                    onClick={() => setDeleteTagId(tag.id)}
                    className="ml-2 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">尚無標籤</p>
          )}
        </CardContent>
      </Card>

      {/* Create Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增分類</DialogTitle>
            <DialogDescription>建立新的文章分類</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">分類名稱 *</Label>
              <Input
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="例如：AI 應用"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="categorySlug">代稱 (Slug) *</Label>
                <Button type="button" variant="ghost" size="sm" onClick={generateCategorySlug}>
                  自動生成
                </Button>
              </div>
              <Input
                id="categorySlug"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                placeholder="ai-application"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryDescription">描述</Label>
              <Textarea
                id="categoryDescription"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="分類描述（選填）"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createCategoryMutation.isPending}>
                建立
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Tag Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增標籤</DialogTitle>
            <DialogDescription>建立新的文章標籤</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTag} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tagName">標籤名稱 *</Label>
              <Input
                id="tagName"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="例如：ChatGPT"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tagSlug">代稱 (Slug) *</Label>
                <Button type="button" variant="ghost" size="sm" onClick={generateTagSlug}>
                  自動生成
                </Button>
              </div>
              <Input
                id="tagSlug"
                value={tagSlug}
                onChange={(e) => setTagSlug(e.target.value)}
                placeholder="chatgpt"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTagDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createTagMutation.isPending}>
                建立
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={deleteCategoryId !== null} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除分類</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。刪除分類後，該分類下的文章將變為未分類。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteCategoryId) {
                  deleteCategoryMutation.mutate({ id: deleteCategoryId });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Tag Confirmation */}
      <AlertDialog open={deleteTagId !== null} onOpenChange={() => setDeleteTagId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除標籤</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。刪除標籤後，所有文章將不再擁有此標籤。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTagId) {
                  deleteTagMutation.mutate({ id: deleteTagId });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
