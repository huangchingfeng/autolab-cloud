import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { toast } from "sonner";

export default function AdminPosts() {
  const { user, loading: authLoading } = useAuth();
  const [deletePostId, setDeletePostId] = useState<number | null>(null);

  const { data: posts, isLoading, refetch } = trpc.blog.getAllPosts.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const deleteMutation = trpc.blog.deletePost.useMutation({
    onSuccess: () => {
      toast.success("文章已刪除");
      refetch();
      setDeletePostId(null);
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  if (authLoading || isLoading) {
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
        <div>
          <h1 className="text-3xl font-bold">文章管理</h1>
          <p className="text-muted-foreground mt-2">管理所有部落格文章</p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            新增文章
          </Link>
        </Button>
      </div>

      {posts && posts.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>標題</TableHead>
                <TableHead>分類</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>瀏覽次數</TableHead>
                <TableHead>發布日期</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((item) => {
                const post = item.post;
                const category = item.category;

                return (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium max-w-md">
                      <div className="truncate">{post.title}</div>
                    </TableCell>
                    <TableCell>
                      {category ? (
                        <Badge variant="secondary">{category.name}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">未分類</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.status === "published" ? "default" : "outline"}>
                        {post.status === "published" ? "已發布" : "草稿"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span>{post.viewCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {post.publishedAt
                        ? format(new Date(post.publishedAt), "yyyy/MM/dd", { locale: zhTW })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {post.status === "published" && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/posts/${post.id}`}>
                            <a>
                              <Pencil className="h-4 w-4" />
                            </a>
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletePostId(post.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-16 border rounded-lg">
          <p className="text-muted-foreground mb-4">尚無文章</p>
          <Button asChild>
            <Link href="/admin/posts/new">
              <a>新增第一篇文章</a>
            </Link>
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletePostId !== null} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。確定要刪除這篇文章嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletePostId) {
                  deleteMutation.mutate({ id: deletePostId });
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
