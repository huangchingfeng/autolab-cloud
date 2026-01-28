import { useState, useMemo } from "react";
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
import { toast } from "sonner";
import { Trash2, Mail, Phone, Building2, Search, Download, Filter, BarChart3, Bell } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  registered: { label: "已報名", variant: "default" },
  confirmed: { label: "已確認", variant: "secondary" },
  cancelled: { label: "已取消", variant: "destructive" },
  attended: { label: "已出席", variant: "outline" },
};

const REFERRAL_LABELS: Record<string, string> = {
  teacher_afeng: "阿峰老師",
  friend: "朋友推薦",
  facebook: "Facebook",
  threads: "Threads",
  youtube: "YouTube",
  instagram: "Instagram",
  other: "其他",
};

export default function AdminRegistrations() {
  const { data: events } = trpc.events.getAllEvents.useQuery();
  const [selectedEventId, setSelectedEventId] = useState<number | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteRegistrationId, setDeleteRegistrationId] = useState<number | null>(null);
  const [showStatsDialog, setShowStatsDialog] = useState(false);

  const { data: registrations, isLoading, refetch } = trpc.events.getRegistrations.useQuery(
    selectedEventId === "all" ? {} : { eventId: selectedEventId }
  );

  const { data: stats } = trpc.events.getRegistrationStats.useQuery(
    { eventId: selectedEventId as number },
    { enabled: selectedEventId !== "all" && showStatsDialog }
  );

  const updateStatusMutation = trpc.events.updateRegistrationStatus.useMutation({
    onSuccess: () => {
      toast.success("狀態已更新");
      refetch();
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  const deleteMutation = trpc.events.deleteRegistration.useMutation({
    onSuccess: () => {
      toast.success("報名已刪除");
      refetch();
      setDeleteRegistrationId(null);
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  const sendRemindersMutation = trpc.events.sendReminders.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(`發送失敗：${error.message}`);
    },
  });

  const handleSendReminders = () => {
    if (selectedEventId === "all") {
      toast.error("請先選擇一個活動");
      return;
    }
    if (confirm("確定要發送提醒 Email 給所有已報名的學員嗎？")) {
      sendRemindersMutation.mutate({ eventId: selectedEventId });
    }
  };

  // Filter registrations
  const filteredRegistrations = useMemo(() => {
    if (!registrations) return [];

    return registrations.filter((item: any) => {
      const reg = item.registration || item;
      
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !reg.name.toLowerCase().includes(search) &&
          !reg.email.toLowerCase().includes(search) &&
          !(reg.company?.toLowerCase().includes(search))
        ) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== "all" && reg.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [registrations, searchTerm, statusFilter]);

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredRegistrations.length) {
      toast.error("沒有資料可匯出");
      return;
    }

    const headers = ["姓名", "Email", "電話", "公司", "職稱", "來源", "狀態", "報名時間", "活動"];
    const rows = filteredRegistrations.map((item: any) => {
      const reg = item.registration || item;
      const event = item.event;
      return [
        reg.name,
        reg.email,
        reg.phone,
        reg.company || "",
        reg.jobTitle || "",
        REFERRAL_LABELS[reg.referralSource] || reg.referralSource,
        STATUS_LABELS[reg.status]?.label || reg.status,
        format(new Date(reg.createdAt), "yyyy/MM/dd HH:mm"),
        event?.title || "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `registrations_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    link.click();

    toast.success("匯出成功");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">報名管理</h1>
          <p className="text-muted-foreground">管理所有活動報名資料</p>
        </div>
        <div className="flex gap-2">
          {selectedEventId !== "all" && (
            <>
              <Button 
                variant="outline" 
                onClick={handleSendReminders}
                disabled={sendRemindersMutation.isPending}
              >
                <Bell className="mr-2 h-4 w-4" />
                {sendRemindersMutation.isPending ? "發送中..." : "發送提醒"}
              </Button>
              <Button variant="outline" onClick={() => setShowStatsDialog(true)}>
                <BarChart3 className="mr-2 h-4 w-4" />
                數據分析
              </Button>
            </>
          )}
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            匯出 CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">篩選條件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select
                value={selectedEventId === "all" ? "all" : String(selectedEventId)}
                onValueChange={(value) => setSelectedEventId(value === "all" ? "all" : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇活動" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有活動</SelectItem>
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={String(event.id)}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="狀態篩選" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有狀態</SelectItem>
                  <SelectItem value="registered">已報名</SelectItem>
                  <SelectItem value="confirmed">已確認</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                  <SelectItem value="attended">已出席</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜尋姓名、Email、公司..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>總報名數</CardDescription>
            <CardTitle className="text-3xl">{filteredRegistrations.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已報名</CardDescription>
            <CardTitle className="text-3xl">
              {filteredRegistrations.filter((item: any) => (item.registration || item).status === "registered").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已確認</CardDescription>
            <CardTitle className="text-3xl">
              {filteredRegistrations.filter((item: any) => (item.registration || item).status === "confirmed").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>已出席</CardDescription>
            <CardTitle className="text-3xl">
              {filteredRegistrations.filter((item: any) => (item.registration || item).status === "attended").length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle>報名列表</CardTitle>
          <CardDescription>
            共 {filteredRegistrations.length} 筆報名資料
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : filteredRegistrations.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>聯絡方式</TableHead>
                    <TableHead>公司/職稱</TableHead>
                    <TableHead>來源</TableHead>
                    <TableHead>活動</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>報名時間</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((item: any) => {
                    const reg = item.registration || item;
                    const event = item.event;
                    return (
                      <TableRow key={reg.id}>
                        <TableCell className="font-medium">{reg.name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <a href={`mailto:${reg.email}`} className="hover:underline">
                                {reg.email}
                              </a>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <a href={`tel:${reg.phone}`} className="hover:underline">
                                {reg.phone}
                              </a>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(reg.company || reg.jobTitle) && (
                            <div className="flex items-center gap-1 text-sm">
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              <span>
                                {reg.company}
                                {reg.company && reg.jobTitle && " / "}
                                {reg.jobTitle}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {REFERRAL_LABELS[reg.referralSource] || reg.referralSource}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm line-clamp-1">
                            {event?.title || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={reg.status}
                            onValueChange={(value: any) =>
                              updateStatusMutation.mutate({ id: reg.id, status: value })
                            }
                          >
                            <SelectTrigger className="w-[100px]">
                              <Badge variant={STATUS_LABELS[reg.status]?.variant || "secondary"}>
                                {STATUS_LABELS[reg.status]?.label || reg.status}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="registered">已報名</SelectItem>
                              <SelectItem value="confirmed">已確認</SelectItem>
                              <SelectItem value="cancelled">已取消</SelectItem>
                              <SelectItem value="attended">已出席</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(reg.createdAt), "MM/dd HH:mm", { locale: zhTW })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteRegistrationId(reg.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "沒有符合條件的報名資料"
                : "尚無報名資料"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>數據分析</DialogTitle>
            <DialogDescription>
              {events?.find((e) => e.id === selectedEventId)?.title || "所有活動"}
            </DialogDescription>
          </DialogHeader>
          {stats && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">報名來源分布</h4>
                <div className="space-y-2">
                  {Object.entries(stats.bySource).map(([source, count]) => (
                    <div key={source} className="flex items-center justify-between">
                      <span>{REFERRAL_LABELS[source] || source}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2"
                            style={{
                              width: `${((count as number) / stats.total) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {count as number} 人
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">狀態分布</h4>
                <div className="space-y-2">
                  {Object.entries(stats.byStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <Badge variant={STATUS_LABELS[status]?.variant || "secondary"}>
                        {STATUS_LABELS[status]?.label || status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {count as number} 人 ({Math.round(((count as number) / stats.total) * 100)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowStatsDialog(false)}>關閉</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteRegistrationId !== null} onOpenChange={() => setDeleteRegistrationId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              確定要刪除此報名資料嗎？此操作無法復原。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRegistrationId(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteRegistrationId && deleteMutation.mutate({ id: deleteRegistrationId })}
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
