import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Calendar, Clock, MapPin, Users, RefreshCw, Database, Mail, Bell } from "lucide-react";

interface SessionFormData {
  sessionId: string;
  name: string;
  date: string;
  time: string;
  dayOfWeek: string;
  location: string;
  maxCapacity: number;
  isActive: boolean;
  notes: string;
}

const initialFormData: SessionFormData = {
  sessionId: "",
  name: "",
  date: "",
  time: "",
  dayOfWeek: "",
  location: "台北",
  maxCapacity: 30,
  isActive: true,
  notes: "",
};

const dayOfWeekOptions = [
  { value: "一", label: "星期一" },
  { value: "二", label: "星期二" },
  { value: "三", label: "星期三" },
  { value: "四", label: "星期四" },
  { value: "五", label: "星期五" },
  { value: "六", label: "星期六" },
  { value: "日", label: "星期日" },
];

export default function Course2026Sessions() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<number | null>(null);
  const [deletingSession, setDeletingSession] = useState<{ id: number; name: string } | null>(null);
  const [formData, setFormData] = useState<SessionFormData>(initialFormData);
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: sessions, isLoading } = trpc.course2026.getAllSessions.useQuery();

  const createMutation = trpc.course2026.createSession.useMutation({
    onSuccess: () => {
      toast.success("課程場次已新增");
      utils.course2026.getAllSessions.invalidate();
      setIsDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (error) => {
      toast.error(`新增失敗: ${error.message}`);
    },
  });

  const updateMutation = trpc.course2026.updateSession.useMutation({
    onSuccess: () => {
      toast.success("課程場次已更新");
      utils.course2026.getAllSessions.invalidate();
      setIsDialogOpen(false);
      setEditingSession(null);
      setFormData(initialFormData);
    },
    onError: (error) => {
      toast.error(`更新失敗: ${error.message}`);
    },
  });

  const sendReminderMutation = trpc.course2026.sendSessionReminder.useMutation({
    onSuccess: (data) => {
      toast.success(`已發送 ${data.sentCount} 封提醒 Email`);
      setSendingReminder(null);
    },
    onError: (error) => {
      toast.error(`發送失敗：${error.message}`);
      setSendingReminder(null);
    },
  });

  const sendAllRemindersMutation = trpc.course2026.sendAllReminders.useMutation({
    onSuccess: (data) => {
      toast.success(`已發送 ${data.sentCount} 封提醒 Email`);
    },
    onError: (error) => {
      toast.error(`發送失敗：${error.message}`);
    },
  });

  const deleteMutation = trpc.course2026.deleteSession.useMutation({
    onSuccess: () => {
      toast.success("課程場次已刪除");
      utils.course2026.getAllSessions.invalidate();
      setIsDeleteDialogOpen(false);
      setDeletingSession(null);
    },
    onError: (error) => {
      toast.error(`刪除失敗: ${error.message}`);
    },
  });

  const seedMutation = trpc.course2026.seedSessions.useMutation({
    onSuccess: (data) => {
      if (data.count > 0) {
        toast.success(`已匯入 ${data.count} 個課程場次`);
      } else {
        toast.info(data.message);
      }
      utils.course2026.getAllSessions.invalidate();
    },
    onError: (error) => {
      toast.error(`匯入失敗: ${error.message}`);
    },
  });

  const handleOpenCreate = () => {
    setEditingSession(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (session: NonNullable<typeof sessions>[0]) => {
    setEditingSession(session.id);
    setFormData({
      sessionId: session.sessionId,
      name: session.name,
      date: session.date,
      time: session.time,
      dayOfWeek: session.dayOfWeek,
      location: session.location,
      maxCapacity: session.maxCapacity,
      isActive: session.isActive,
      notes: session.notes || "",
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (session: NonNullable<typeof sessions>[0]) => {
    setDeletingSession({ id: session.id, name: session.name });
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.sessionId || !formData.name || !formData.date || !formData.time || !formData.dayOfWeek) {
      toast.error("請填寫所有必填欄位");
      return;
    }

    if (editingSession) {
      updateMutation.mutate({
        id: editingSession,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = () => {
    if (deletingSession) {
      deleteMutation.mutate({ id: deletingSession.id });
    }
  };

  // Filter sessions by month
  const filteredSessions = sessions?.filter((session) => {
    if (monthFilter === "all") return true;
    return session.date.startsWith(`2026-${monthFilter}`);
  });

  // Calculate statistics
  const stats = {
    total: sessions?.length || 0,
    active: sessions?.filter((s) => s.isActive).length || 0,
    inactive: sessions?.filter((s) => !s.isActive).length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">課程場次管理</h1>
          <p className="text-muted-foreground">管理 2026 AI 實戰應用課的所有課程場次</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
            <Database className="mr-2 h-4 w-4" />
            {seedMutation.isPending ? "匯入中..." : "匯入預設場次"}
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            新增場次
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總場次數</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">堂課程</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">啟用中</CardTitle>
            <Badge variant="default" className="bg-green-500">啟用</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">堂課程</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已停用</CardTitle>
            <Badge variant="secondary">停用</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">堂課程</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="篩選月份" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部月份</SelectItem>
            <SelectItem value="01">1 月</SelectItem>
            <SelectItem value="02">2 月</SelectItem>
            <SelectItem value="03">3 月</SelectItem>
            <SelectItem value="04">4 月</SelectItem>
            <SelectItem value="05">5 月</SelectItem>
            <SelectItem value="06">6 月</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={() => utils.course2026.getAllSessions.invalidate()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <CardTitle>課程場次列表</CardTitle>
          <CardDescription>共 {filteredSessions?.length || 0} 個場次</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>場次 ID</TableHead>
                  <TableHead>課程名稱</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>時間</TableHead>
                  <TableHead>地點</TableHead>
                  <TableHead>人數上限</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions?.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono text-sm">{session.sessionId}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{session.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {session.date} ({session.dayOfWeek})
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {session.time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {session.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {session.maxCapacity}
                      </div>
                    </TableCell>
                    <TableCell>
                      {session.isActive ? (
                        <Badge variant="default" className="bg-green-500">啟用</Badge>
                      ) : (
                        <Badge variant="secondary">停用</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(session)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSendingReminder(session.sessionId);
                            sendReminderMutation.mutate({ sessionId: session.sessionId });
                          }}
                          disabled={sendingReminder === session.sessionId}
                          title="發送課程提醒 Email"
                        >
                          <Mail className={`h-4 w-4 ${sendingReminder === session.sessionId ? 'animate-pulse' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(session)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSessions?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      尚無課程場次資料
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSession ? "編輯課程場次" : "新增課程場次"}</DialogTitle>
            <DialogDescription>
              {editingSession ? "修改課程場次資訊" : "填寫課程場次資訊以新增場次"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionId">場次 ID *</Label>
                <Input
                  id="sessionId"
                  placeholder="例：0120_1"
                  value={formData.sessionId}
                  onChange={(e) => setFormData({ ...formData, sessionId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">星期 *</Label>
                <Select
                  value={formData.dayOfWeek}
                  onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇星期" />
                  </SelectTrigger>
                  <SelectContent>
                    {dayOfWeekOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">課程名稱 *</Label>
              <Input
                id="name"
                placeholder="例：初階 1：AI 職場應用啟航班"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">日期 *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">時間 *</Label>
                <Input
                  id="time"
                  placeholder="例：9:00-12:00"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">地點</Label>
                <Input
                  id="location"
                  placeholder="例：台北"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCapacity">人數上限</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  value={formData.maxCapacity}
                  onChange={(e) => setFormData({ ...formData, maxCapacity: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">啟用此場次</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">備註</Label>
              <Textarea
                id="notes"
                placeholder="選填備註..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "處理中..." : editingSession ? "更新" : "新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              確定要刪除課程場次「{deletingSession?.name}」嗎？此操作無法復原。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
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
