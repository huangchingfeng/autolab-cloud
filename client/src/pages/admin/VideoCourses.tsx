import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, Eye, EyeOff, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function AdminVideoCourses() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: courses, isLoading } = trpc.videoCourses.getAll.useQuery();

  const deleteMutation = trpc.videoCourses.delete.useMutation({
    onSuccess: () => {
      toast.success("課程已刪除");
      utils.videoCourses.getAll.invalidate();
      setDeleteId(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = trpc.videoCourses.update.useMutation({
    onSuccess: () => {
      toast.success("課程狀態已更新");
      utils.videoCourses.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500">已發布</Badge>;
      case "draft":
        return <Badge variant="secondary">草稿</Badge>;
      case "archived":
        return <Badge variant="outline">已封存</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";
    updateMutation.mutate({ id, status: newStatus });
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate({ id: deleteId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">錄播課程管理</h1>
          <p className="text-muted-foreground">管理您的線上錄播課程</p>
        </div>
        <Link href="/admin/video-courses/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新增課程
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>課程列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : courses && courses.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>課程名稱</TableHead>
                  <TableHead>價格</TableHead>
                  <TableHead>學員數</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {course.coverImage && (
                          <img
                            src={course.coverImage}
                            alt={course.title}
                            className="h-12 w-16 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{course.title}</p>
                          <p className="text-sm text-muted-foreground">{course.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatPrice(course.price)}</p>
                        {course.originalPrice && course.originalPrice > course.price && (
                          <p className="text-sm text-muted-foreground line-through">
                            {formatPrice(course.originalPrice)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{course.studentCount}</TableCell>
                    <TableCell>{getStatusBadge(course.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/admin/video-courses/${course.id}`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              編輯
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={() => handleToggleStatus(course.id, course.status)}>
                            {course.status === "published" ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                下架
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                發布
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(course.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            刪除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">尚未建立任何課程</p>
              <Link href="/admin/video-courses/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  新增第一個課程
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此課程？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。刪除後，所有相關的購買記錄和學員筆記也會一併刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
