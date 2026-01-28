import { useState } from "react";
import { trpc } from "@/lib/trpc";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Trash2, RefreshCw, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

export default function Notifications() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"info" | "warning" | "success" | "error">("info");
  const [targetType, setTargetType] = useState<"all" | "user" | "role">("all");
  const [targetUserId, setTargetUserId] = useState("");
  const [targetRole, setTargetRole] = useState<"user" | "admin">("user");
  const [link, setLink] = useState("");

  const { data, isLoading, refetch } = trpc.notifications.getAllNotifications.useQuery({
    limit: 100,
    offset: 0,
  });

  const createMutation = trpc.notifications.createNotification.useMutation({
    onSuccess: () => {
      toast.success("通知已建立");
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`建立失敗：${error.message}`);
    },
  });

  const deleteMutation = trpc.notifications.deleteNotification.useMutation({
    onSuccess: () => {
      toast.success("通知已刪除");
      refetch();
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  const resetForm = () => {
    setTitle("");
    setContent("");
    setType("info");
    setTargetType("all");
    setTargetUserId("");
    setTargetRole("user");
    setLink("");
  };

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("請填寫標題和內容");
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      type,
      targetType,
      targetUserId: targetType === "user" && targetUserId ? Number(targetUserId) : undefined,
      targetRole: targetType === "role" ? targetRole : undefined,
      link: link.trim() || undefined,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("確定要刪除此通知嗎？")) {
      deleteMutation.mutate({ id });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "error":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "info":
        return "default";
      case "warning":
        return "secondary";
      case "success":
        return "default";
      case "error":
        return "destructive";
      default:
        return "default";
    }
  };

  const getTargetTypeLabel = (notification: any) => {
    if (notification.targetType === "all") {
      return "所有用戶";
    } else if (notification.targetType === "user") {
      return `用戶 ID: ${notification.targetUserId}`;
    } else if (notification.targetType === "role") {
      return notification.targetRole === "admin" ? "管理員" : "一般用戶";
    }
    return "-";
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">通知管理</h1>
          <p className="text-muted-foreground mt-1">建立和管理系統通知</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                建立通知
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>建立新通知</DialogTitle>
                <DialogDescription>
                  建立一則新的系統通知，發送給指定的用戶群組
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">通知標題 *</Label>
                  <Input
                    id="title"
                    placeholder="例如：網站維護公告"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">通知內容 *</Label>
                  <Textarea
                    id="content"
                    placeholder="輸入通知的詳細內容..."
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">通知類型</Label>
                    <Select value={type} onValueChange={(v) => setType(v as any)}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">ℹ️ 資訊</SelectItem>
                        <SelectItem value="success">✅ 成功</SelectItem>
                        <SelectItem value="warning">⚠️ 警告</SelectItem>
                        <SelectItem value="error">❌ 錯誤</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetType">發送對象</Label>
                    <Select value={targetType} onValueChange={(v) => setTargetType(v as any)}>
                      <SelectTrigger id="targetType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">所有用戶</SelectItem>
                        <SelectItem value="user">特定用戶</SelectItem>
                        <SelectItem value="role">特定角色</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {targetType === "user" && (
                  <div className="space-y-2">
                    <Label htmlFor="targetUserId">用戶 ID</Label>
                    <Input
                      id="targetUserId"
                      type="number"
                      placeholder="輸入用戶 ID"
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                    />
                  </div>
                )}

                {targetType === "role" && (
                  <div className="space-y-2">
                    <Label htmlFor="targetRole">角色</Label>
                    <Select value={targetRole} onValueChange={(v) => setTargetRole(v as any)}>
                      <SelectTrigger id="targetRole">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">一般用戶</SelectItem>
                        <SelectItem value="admin">管理員</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="link">連結（可選）</Label>
                  <Input
                    id="link"
                    placeholder="例如：/events/123"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "建立中..." : "建立通知"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>通知列表</CardTitle>
          <CardDescription>
            共 {data?.total || 0} 則通知
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : !data?.notifications || data.notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              尚無通知，點擊「建立通知」開始
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>類型</TableHead>
                  <TableHead>標題</TableHead>
                  <TableHead>內容</TableHead>
                  <TableHead>發送對象</TableHead>
                  <TableHead>建立時間</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <Badge variant={getTypeBadgeVariant(notification.type)} className="gap-1">
                        {getTypeIcon(notification.type)}
                        {notification.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{notification.title}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {notification.content}
                    </TableCell>
                    <TableCell>{getTargetTypeLabel(notification)}</TableCell>
                    <TableCell>
                      {format(new Date(notification.createdAt), "yyyy/MM/dd HH:mm", {
                        locale: zhTW,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(notification.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
