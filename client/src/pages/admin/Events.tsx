import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, Eye, Calendar, Copy } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Link } from "wouter";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "草稿", variant: "secondary" },
  published: { label: "已發布", variant: "default" },
  cancelled: { label: "已取消", variant: "destructive" },
  completed: { label: "已結束", variant: "outline" },
};

export default function AdminEvents() {
  const { data: events, isLoading, refetch } = trpc.events.getAllEvents.useQuery();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    slug: "",
    description: "",
    highlights: "",
    targetAudience: "",
    speakerInfo: "",
    coverImage: "",
    eventDate: "",
    eventEndDate: "",
    eventTime: "",
    location: "",
    locationDetails: "",
    price: 0,
    maxAttendees: 0,
    status: "draft" as const,
    registrationEnabled: true,
    registrationDeadline: "",
    registrationInfo: "",
  });

  const createMutation = trpc.events.createEvent.useMutation({
    onSuccess: () => {
      toast.success("活動已建立");
      refetch();
      setCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`建立失敗：${error.message}`);
    },
  });

  const updateMutation = trpc.events.updateEvent.useMutation({
    onSuccess: () => {
      toast.success("活動已更新");
      refetch();
      setEditDialogOpen(false);
      setEditingEvent(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  const deleteMutation = trpc.events.deleteEvent.useMutation({
    onSuccess: () => {
      toast.success("活動已刪除");
      refetch();
      setDeleteEventId(null);
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      slug: "",
      description: "",
      highlights: "",
      targetAudience: "",
      speakerInfo: "",
      coverImage: "",
      eventDate: "",
      eventEndDate: "",
      eventTime: "",
      location: "",
      locationDetails: "",
      price: 0,
      maxAttendees: 0,
      status: "draft",
      registrationEnabled: true,
      registrationDeadline: "",
      registrationInfo: "",
    });
  };

  const handleCreate = () => {
    if (!formData.title || !formData.slug || !formData.description || !formData.eventDate || !formData.location) {
      toast.error("請填寫必填欄位");
      return;
    }

    createMutation.mutate({
      title: formData.title,
      subtitle: formData.subtitle || undefined,
      slug: formData.slug,
      description: formData.description,
      highlights: formData.highlights ? formData.highlights.split("\n").filter(Boolean) : undefined,
      targetAudience: formData.targetAudience ? formData.targetAudience.split("\n").filter(Boolean) : undefined,
      speakerInfo: formData.speakerInfo || undefined,
      coverImage: formData.coverImage || undefined,
      eventDate: new Date(formData.eventDate),
      eventTime: formData.eventTime || undefined,
      location: formData.location,
      locationDetails: formData.locationDetails || undefined,
      price: formData.price,
      maxAttendees: formData.maxAttendees || undefined,
      status: formData.status,
    });
  };

  const handleUpdate = () => {
    if (!editingEvent) return;

    updateMutation.mutate({
      id: editingEvent.id,
      title: formData.title,
      subtitle: formData.subtitle || undefined,
      slug: formData.slug,
      description: formData.description,
      highlights: formData.highlights ? formData.highlights.split("\n").filter(Boolean) : undefined,
      targetAudience: formData.targetAudience ? formData.targetAudience.split("\n").filter(Boolean) : undefined,
      speakerInfo: formData.speakerInfo || undefined,
      coverImage: formData.coverImage || undefined,
      eventDate: new Date(formData.eventDate),
      eventEndDate: formData.eventEndDate ? new Date(formData.eventEndDate) : undefined,
      eventTime: formData.eventTime || undefined,
      location: formData.location,
      locationDetails: formData.locationDetails || undefined,
      price: formData.price,
      maxAttendees: formData.maxAttendees || undefined,
      status: formData.status,
      registrationEnabled: formData.registrationEnabled,
      registrationDeadline: formData.registrationDeadline ? new Date(formData.registrationDeadline) : undefined,
      registrationInfo: formData.registrationInfo || undefined,
    });
  };

  const openEditDialog = (event: any) => {
    setEditingEvent(event);
    const highlights = event.highlights ? JSON.parse(event.highlights) : [];
    const targetAudience = event.targetAudience ? JSON.parse(event.targetAudience) : [];
    
    setFormData({
      title: event.title,
      subtitle: event.subtitle || "",
      slug: event.slug,
      description: event.description,
      highlights: highlights.join("\n"),
      targetAudience: targetAudience.join("\n"),
      speakerInfo: event.speakerInfo || "",
      coverImage: event.coverImage || "",
      eventDate: format(new Date(event.eventDate), "yyyy-MM-dd"),
      eventEndDate: event.eventEndDate ? format(new Date(event.eventEndDate), "yyyy-MM-dd") : "",
      eventTime: event.eventTime || "",
      location: event.location,
      locationDetails: event.locationDetails || "",
      price: event.price,
      maxAttendees: event.maxAttendees || 0,
      status: event.status,
      registrationEnabled: event.registrationEnabled ?? true,
      registrationDeadline: event.registrationDeadline ? format(new Date(event.registrationDeadline), "yyyy-MM-dd") : "",
      registrationInfo: event.registrationInfo || "",
    });
    setEditDialogOpen(true);
  };

  const handleDuplicateEvent = (event: any) => {
    const highlights = event.highlights ? JSON.parse(event.highlights) : [];
    const targetAudience = event.targetAudience ? JSON.parse(event.targetAudience) : [];
    
    // 複製活動資訊，並在標題後加上「（副本）」
    setFormData({
      title: `${event.title}（副本）`,
      subtitle: event.subtitle || "",
      slug: `${event.slug}-copy-${Date.now()}`, // 加上時間戳避免 slug 重複
      description: event.description,
      highlights: highlights.join("\n"),
      targetAudience: targetAudience.join("\n"),
      speakerInfo: event.speakerInfo || "",
      coverImage: event.coverImage || "",
      eventDate: format(new Date(event.eventDate), "yyyy-MM-dd"),
      eventEndDate: event.eventEndDate ? format(new Date(event.eventEndDate), "yyyy-MM-dd") : "",
      eventTime: event.eventTime || "",
      location: event.location,
      locationDetails: event.locationDetails || "",
      price: event.price,
      maxAttendees: event.maxAttendees || 0,
      status: "draft" as const, // 複製的活動預設為草稿
      registrationEnabled: event.registrationEnabled ?? true,
      registrationDeadline: event.registrationDeadline ? format(new Date(event.registrationDeadline), "yyyy-MM-dd") : "",
      registrationInfo: event.registrationInfo || "",
    });
    setEditingEvent(null); // 清除 editingEvent，表示這是新建而非編輯
    setCreateDialogOpen(true); // 開啟建立對話框
    toast.info("已複製活動資訊，請修改後儲存");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">活動管理</h1>
          <p className="text-muted-foreground">管理所有活動與課程</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新增活動
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>總活動數</CardDescription>
            <CardTitle className="text-3xl">{events?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已發布</CardDescription>
            <CardTitle className="text-3xl">
              {events?.filter((e) => e.status === "published").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>草稿</CardDescription>
            <CardTitle className="text-3xl">
              {events?.filter((e) => e.status === "draft").length || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>總報名人數</CardDescription>
            <CardTitle className="text-3xl">
              {events?.reduce((sum, e) => sum + (e.registrationCount || 0), 0) || 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>活動列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : events && events.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>活動名稱</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>地點</TableHead>
                  <TableHead>報名人數</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{event.title}</p>
                        {event.subtitle && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {event.subtitle}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(event.eventDate), "yyyy/MM/dd", { locale: zhTW })}
                      </div>
                    </TableCell>
                    <TableCell>{event.location}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {event.registrationCount || 0}
                        {event.maxAttendees && ` / ${event.maxAttendees}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_LABELS[event.status]?.variant || "secondary"}>
                        {STATUS_LABELS[event.status]?.label || event.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/events/${event.slug}`}>
                          <Button variant="ghost" size="icon" title="預覽">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDuplicateEvent(event)}
                          title="複製"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(event)}
                          title="編輯"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteEventId(event.id)}
                          title="刪除"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              尚無活動，點擊「新增活動」開始建立
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增活動</DialogTitle>
            <DialogDescription>填寫活動資訊以建立新活動</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">活動名稱 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例：MANUS 1.6 重磅更新分享會"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subtitle">副標題</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="例：阿峰老師獨家解析"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">網址代稱 *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="例：manus-1-6-update"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="eventDate">活動日期 *</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="eventTime">活動時間</Label>
                <Input
                  id="eventTime"
                  value={formData.eventTime}
                  onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                  placeholder="例：20:00 - 21:00"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">地點 *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="例：線上直播"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">活動簡介 *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="請輸入活動簡介..."
                rows={5}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="highlights">精彩亮點（每行一項）</Label>
              <Textarea
                id="highlights"
                value={formData.highlights}
                onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                placeholder="觀念升級：什麼是自主執行&#10;核心功能：三大升級亮點&#10;實戰應用：眼見為憑的演示"
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="targetAudience">適合對象（每行一項）</Label>
              <Textarea
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="對 AI 感到瓶頸的進階使用者&#10;渴望自動化解決方案的職場人&#10;想了解 AI Agent 的企業主"
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="speakerInfo">講師介紹</Label>
              <Textarea
                id="speakerInfo"
                value={formData.speakerInfo}
                onChange={(e) => setFormData({ ...formData, speakerInfo: e.target.value })}
                placeholder="講師背景與經歷..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="coverImage">封面圖片網址</Label>
              <Input
                id="coverImage"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">費用</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  placeholder="0 為免費"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">狀態</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">已發布</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                    <SelectItem value="completed">已結束</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "建立中..." : "建立活動"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>編輯活動</DialogTitle>
            <DialogDescription>修改活動資訊</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">活動名稱 *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-subtitle">副標題</Label>
              <Input
                id="edit-subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-slug">網址代稱 *</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-eventDate">活動日期 *</Label>
                <Input
                  id="edit-eventDate"
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-eventTime">活動時間</Label>
                <Input
                  id="edit-eventTime"
                  value={formData.eventTime}
                  onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">地點 *</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">活動簡介 *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-highlights">精彩亮點（每行一項）</Label>
              <Textarea
                id="edit-highlights"
                value={formData.highlights}
                onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-targetAudience">適合對象（每行一項）</Label>
              <Textarea
                id="edit-targetAudience"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-speakerInfo">講師介紹</Label>
              <Textarea
                id="edit-speakerInfo"
                value={formData.speakerInfo}
                onChange={(e) => setFormData({ ...formData, speakerInfo: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-coverImage">封面圖片網址</Label>
              <Input
                id="edit-coverImage"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-price">費用</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">狀態</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">草稿</SelectItem>
                    <SelectItem value="published">已發布</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                    <SelectItem value="completed">已結束</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Registration Settings Section */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-4">報名設定</h3>
              
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="edit-registrationEnabled">開放報名</Label>
                    <p className="text-sm text-muted-foreground">手動控制是否開放報名</p>
                  </div>
                  <input
                    id="edit-registrationEnabled"
                    type="checkbox"
                    checked={formData.registrationEnabled}
                    onChange={(e) => setFormData({ ...formData, registrationEnabled: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-eventEndDate">活動結束日期</Label>
                    <Input
                      id="edit-eventEndDate"
                      type="date"
                      value={formData.eventEndDate}
                      onChange={(e) => setFormData({ ...formData, eventEndDate: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">活動實際結束的日期時間</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-registrationDeadline">報名截止日期</Label>
                    <Input
                      id="edit-registrationDeadline"
                      type="date"
                      value={formData.registrationDeadline}
                      onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">獨立於活動日期的報名截止時間</p>
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-registrationInfo">報名資訊說明</Label>
                  <Textarea
                    id="edit-registrationInfo"
                    value={formData.registrationInfo}
                    onChange={(e) => setFormData({ ...formData, registrationInfo: e.target.value })}
                    placeholder="自訂報名說明文字，例如：報名注意事項、特殊要求等"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "更新中..." : "更新活動"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteEventId !== null} onOpenChange={() => setDeleteEventId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              確定要刪除此活動嗎？此操作無法復原，所有相關的報名資料也會一併刪除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteEventId(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteEventId && deleteMutation.mutate({ id: deleteEventId })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "刪除中..." : "確認刪除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
