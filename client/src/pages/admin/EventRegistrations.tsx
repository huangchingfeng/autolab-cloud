import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Search, Download, Edit, Trash2, Users, Calendar, Mail, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function EventRegistrations() {

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<number | undefined>(undefined);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBatchUpdateDialogOpen, setIsBatchUpdateDialogOpen] = useState(false);
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [batchStatus, setBatchStatus] = useState<"registered" | "confirmed" | "cancelled" | "attended">("confirmed");

  // Queries
  const { data: statsData } = trpc.events.getEventRegistrationStats.useQuery();
  const { data: eventsData } = trpc.events.getAllEvents.useQuery();
  const { data: registrationsData, refetch } = trpc.events.getAllEventRegistrations.useQuery({
    eventId: selectedEventId,
    searchTerm: searchTerm || undefined,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  });

  // Mutations
  const createMutation = trpc.events.createEventRegistration.useMutation({
    onSuccess: () => {
      toast.success("報名記錄已建立");
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`新增失敗：${error.message}`);
    },
  });

  const updateMutation = trpc.events.updateEventRegistration.useMutation({
    onSuccess: () => {
      toast.success("報名記錄已更新");
      setIsEditDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  const deleteMutation = trpc.events.deleteEventRegistration.useMutation({
    onSuccess: () => {
      toast.success("報名記錄已刪除");
      setIsDeleteDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  const batchUpdateMutation = trpc.events.batchUpdateRegistrationStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`已更新 ${data.count} 筆報名狀態`);
      setIsBatchUpdateDialogOpen(false);
      setSelectedIds([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`批次更新失敗：${error.message}`);
    },
  });

  const batchDeleteMutation = trpc.events.batchDeleteRegistrations.useMutation({
    onSuccess: (data) => {
      toast.success(`已刪除 ${data.count} 筆報名記錄`);
      setIsBatchDeleteDialogOpen(false);
      setSelectedIds([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`批次刪除失敗：${error.message}`);
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      eventId: Number(formData.get("eventId")),
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      company: (formData.get("company") as string) || undefined,
      jobTitle: (formData.get("jobTitle") as string) || undefined,
      referralSource: (formData.get("referralSource") as string) || undefined,
      status: (formData.get("status") as any) || "registered",
      notes: (formData.get("notes") as string) || undefined,
    });
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRegistration) return;
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      id: selectedRegistration.registration.id,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      company: (formData.get("company") as string) || undefined,
      jobTitle: (formData.get("jobTitle") as string) || undefined,
      referralSource: (formData.get("referralSource") as string) || undefined,
      status: formData.get("status") as any,
      notes: (formData.get("notes") as string) || undefined,
    });
  };

  const handleDelete = () => {
    if (!selectedRegistration) return;
    deleteMutation.mutate({ id: selectedRegistration.registration.id });
  };

  const handleBatchUpdate = () => {
    if (selectedIds.length === 0) {
      toast.error("請選擇至少一筆報名記錄");
      return;
    }
    batchUpdateMutation.mutate({ ids: selectedIds, status: batchStatus });
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      toast.error("請選擇至少一筆報名記錄");
      return;
    }
    batchDeleteMutation.mutate({ ids: selectedIds });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === registrationsData?.registrations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(registrationsData?.registrations.map((r: any) => r.registration.id) || []);
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const utils = trpc.useUtils();

  const exportToCSV = async () => {
    try {
      toast.info("正在匯出所有報名資料...");
      
      // 取得所有報名資料（不限制 limit）
      const allData = await utils.events.getAllEventRegistrations.fetch({
        eventId: selectedEventId,
        searchTerm: searchTerm || undefined,
        // 不傳遞 limit 和 offset，取得所有資料
      });

      if (!allData?.registrations || allData.registrations.length === 0) {
        toast.error("無資料可匯出");
        return;
      }

      const headers = ["活動名稱", "姓名", "Email", "電話", "公司", "職稱", "報名來源", "狀態", "報名時間", "備註"];
      const rows = allData.registrations.map((item: any) => [
        item.event?.title || "",
        item.registration.name,
        item.registration.email,
        item.registration.phone,
        item.registration.company || "",
        item.registration.jobTitle || "",
        item.registration.referralSource || "",
        item.registration.status,
        new Date(item.registration.createdAt).toLocaleString("zh-TW"),
        item.registration.notes || "",
      ]);

      const csvContent = [headers, ...rows].map((row: any) => row.map((cell: any) => `"${cell}"`).join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `活動報名記錄_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      
      toast.success(`成功匯出 ${allData.registrations.length} 筆報名資料`);
    } catch (error) {
      toast.error("匯出失敗，請稍後再試");
      console.error("Export error:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      registered: { label: "已報名", variant: "default" },
      confirmed: { label: "已確認", variant: "secondary" },
      cancelled: { label: "已取消", variant: "destructive" },
      attended: { label: "已出席", variant: "outline" },
    };
    const config = statusMap[status] || { label: status, variant: "default" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const totalRegistrations = statsData?.reduce((sum, stat) => sum + stat.registrationCount, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">活動報名管理</h1>
          <p className="text-muted-foreground mt-1">查看、新增、編輯、刪除活動報名記錄</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            匯出 CSV
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新增報名
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新增報名記錄</DialogTitle>
                <DialogDescription>手動建立活動報名記錄</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="create-eventId">活動 *</Label>
                    <Select name="eventId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇活動" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventsData?.map((event) => (
                          <SelectItem key={event.id} value={event.id.toString()}>
                            {event.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="create-name">姓名 *</Label>
                    <Input id="create-name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="create-email">Email *</Label>
                    <Input id="create-email" name="email" type="email" required />
                  </div>
                  <div>
                    <Label htmlFor="create-phone">電話 *</Label>
                    <Input id="create-phone" name="phone" required />
                  </div>
                  <div>
                    <Label htmlFor="create-status">狀態</Label>
                    <Select name="status" defaultValue="registered">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="registered">已報名</SelectItem>
                        <SelectItem value="confirmed">已確認</SelectItem>
                        <SelectItem value="cancelled">已取消</SelectItem>
                        <SelectItem value="attended">已出席</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="create-company">公司</Label>
                    <Input id="create-company" name="company" />
                  </div>
                  <div>
                    <Label htmlFor="create-jobTitle">職稱</Label>
                    <Input id="create-jobTitle" name="jobTitle" />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="create-referralSource">報名來源</Label>
                    <Input id="create-referralSource" name="referralSource" placeholder="例如：Facebook、朋友推薦" />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="create-notes">備註</Label>
                    <Textarea id="create-notes" name="notes" rows={3} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "建立中..." : "建立"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總報名數</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
          </CardContent>
        </Card>
        {statsData?.slice(0, 3).map((stat) => (
          <Card key={stat.eventId}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium truncate">{stat.eventTitle}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.registrationCount}</div>
              <p className="text-xs text-muted-foreground">{new Date(stat.eventDate).toLocaleDateString("zh-TW")}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>篩選條件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">搜尋（姓名、Email、電話）</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="輸入關鍵字搜尋..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-64">
              <Label htmlFor="event-filter">活動篩選</Label>
              <Select
                value={selectedEventId?.toString() || "all"}
                onValueChange={(value) => {
                  setSelectedEventId(value === "all" ? undefined : Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="所有活動" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有活動</SelectItem>
                  {eventsData?.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Label htmlFor="page-size">每頁顯示筆數</Label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 筆</SelectItem>
                  <SelectItem value="50">50 筆</SelectItem>
                  <SelectItem value="100">100 筆</SelectItem>
                  <SelectItem value="1000">1000 筆</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>報名列表</CardTitle>
              <CardDescription>
                共 {registrationsData?.total || 0} 筆報名記錄
                {selectedIds.length > 0 && (
                  <span className="ml-2 text-primary font-medium">（已選擇 {selectedIds.length} 筆）</span>
                )}
              </CardDescription>
            </div>
            {selectedIds.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBatchUpdateDialogOpen(true)}
                >
                  批次更新狀態
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBatchDeleteDialogOpen(true)}
                >
                  批次刪除
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === registrationsData?.registrations.length && registrationsData?.registrations.length > 0}
                    onChange={handleSelectAll}
                    className="cursor-pointer"
                  />
                </TableHead>
                <TableHead>活動名稱</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>電話</TableHead>
                <TableHead>公司/職稱</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>報名時間</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrationsData?.registrations && registrationsData.registrations.length > 0 ? (
                registrationsData.registrations.map((item) => (
                  <TableRow key={item.registration.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.registration.id)}
                        onChange={() => handleSelectOne(item.registration.id)}
                        className="cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.event?.title || "未知活動"}</TableCell>
                    <TableCell>{item.registration.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{item.registration.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{item.registration.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.registration.company && <div>{item.registration.company}</div>}
                        {item.registration.jobTitle && <div className="text-muted-foreground">{item.registration.jobTitle}</div>}
                        {!item.registration.company && !item.registration.jobTitle && <span className="text-muted-foreground">-</span>}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.registration.status)}</TableCell>
                    <TableCell>{new Date(item.registration.createdAt).toLocaleString("zh-TW")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRegistration(item);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRegistration(item);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    暫無報名記錄
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {registrationsData && registrationsData.total > pageSize && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                顯示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, registrationsData.total)} 筆，共 {registrationsData.total} 筆
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  上一頁
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={currentPage * pageSize >= registrationsData.total}
                >
                  下一頁
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>編輯報名記錄</DialogTitle>
            <DialogDescription>修改報名資訊</DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">姓名 *</Label>
                  <Input id="edit-name" name="name" defaultValue={selectedRegistration.registration.name} required />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input id="edit-email" name="email" type="email" defaultValue={selectedRegistration.registration.email} required />
                </div>
                <div>
                  <Label htmlFor="edit-phone">電話 *</Label>
                  <Input id="edit-phone" name="phone" defaultValue={selectedRegistration.registration.phone} required />
                </div>
                <div>
                  <Label htmlFor="edit-status">狀態</Label>
                  <Select name="status" defaultValue={selectedRegistration.registration.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="registered">已報名</SelectItem>
                      <SelectItem value="confirmed">已確認</SelectItem>
                      <SelectItem value="cancelled">已取消</SelectItem>
                      <SelectItem value="attended">已出席</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-company">公司</Label>
                  <Input id="edit-company" name="company" defaultValue={selectedRegistration.registration.company || ""} />
                </div>
                <div>
                  <Label htmlFor="edit-jobTitle">職稱</Label>
                  <Input id="edit-jobTitle" name="jobTitle" defaultValue={selectedRegistration.registration.jobTitle || ""} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-referralSource">報名來源</Label>
                  <Input id="edit-referralSource" name="referralSource" defaultValue={selectedRegistration.registration.referralSource || ""} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-notes">備註</Label>
                  <Textarea id="edit-notes" name="notes" rows={3} defaultValue={selectedRegistration.registration.notes || ""} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "更新中..." : "更新"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除 {selectedRegistration?.registration.name} 的報名記錄嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "刪除中..." : "確認刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Update Status Dialog */}
      <Dialog open={isBatchUpdateDialogOpen} onOpenChange={setIsBatchUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批次更新報名狀態</DialogTitle>
            <DialogDescription>
              將選中的 {selectedIds.length} 筆報名記錄更新為指定狀態
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="batch-status">選擇狀態</Label>
              <Select value={batchStatus} onValueChange={(value: any) => setBatchStatus(value)}>
                <SelectTrigger id="batch-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registered">已報名</SelectItem>
                  <SelectItem value="confirmed">已確認</SelectItem>
                  <SelectItem value="attended">已出席</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsBatchUpdateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleBatchUpdate} disabled={batchUpdateMutation.isPending}>
              {batchUpdateMutation.isPending ? "更新中..." : "確認更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Delete Confirmation Dialog */}
      <AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認批次刪除</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除選中的 {selectedIds.length} 筆報名記錄嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} disabled={batchDeleteMutation.isPending}>
              {batchDeleteMutation.isPending ? "刪除中..." : "確認刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
