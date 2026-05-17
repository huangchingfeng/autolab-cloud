import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Search, Download, Trash2, Eye, ChevronLeft, ChevronRight,
  MessageSquare, Phone, Mail, Users, Clock, FileText
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  new: { label: "新申請", variant: "default" },
  contacted: { label: "已聯繫", variant: "secondary" },
  quoted: { label: "已報價", variant: "outline" },
  closed: { label: "已成交", variant: "default" },
  cancelled: { label: "已取消", variant: "destructive" },
};

const SOURCE_MAP: Record<string, string> = {
  general: "(全產業) 企業內訓",
  tech: "科技業 AI 實戰工作坊",
  manufacturing: "製造業 AI 實戰工作坊",
};

export default function CorporateInquiries() {
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const pageSize = 20;

  const { data, isLoading, refetch } = trpc.corporateInquiry.getAll.useQuery({
    limit: pageSize,
    offset: page * pageSize,
    status: statusFilter !== "all" ? statusFilter : undefined,
    sourcePage: sourceFilter !== "all" ? sourceFilter : undefined,
    search: searchTerm || undefined,
  });

  const { data: stats } = trpc.corporateInquiry.getStats.useQuery();
  const updateStatusMutation = trpc.corporateInquiry.updateStatus.useMutation();
  const deleteMutation = trpc.corporateInquiry.delete.useMutation();

  const handleSearch = () => {
    setSearchTerm(searchInput);
    setPage(0);
  };

  const handleUpdateStatus = async () => {
    if (!selectedInquiry) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: selectedInquiry.id,
        status: editStatus as any,
        adminNotes: editNotes || undefined,
      });
      toast.success("狀態已更新");
      setDetailOpen(false);
      refetch();
    } catch {
      toast.error("更新失敗");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("已刪除");
      setDeleteConfirmId(null);
      refetch();
    } catch {
      toast.error("刪除失敗");
    }
  };

  const openDetail = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setEditStatus(inquiry.status);
    setEditNotes(inquiry.adminNotes || "");
    setDetailOpen(true);
  };

  const exportCSV = () => {
    if (!data?.items?.length) return;
    const headers = ["ID", "姓名", "公司", "職稱", "Email", "電話", "預計人數", "有興趣方案", "預計時間", "其他需求", "來源", "狀態", "備註", "提交時間"];
    const rows = data.items.map((item) => [
      item.id,
      item.name,
      item.company,
      item.jobTitle,
      item.email,
      item.phone || "",
      item.headcount || "",
      item.programs ? JSON.parse(item.programs).join("; ") : "",
      item.preferredTime || "",
      item.notes || "",
      SOURCE_MAP[item.sourcePage] || item.sourcePage,
      STATUS_MAP[item.status]?.label || item.status,
      item.adminNotes || "",
      new Date(item.createdAt).toLocaleString("zh-TW"),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `企業邀課申請_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil((data?.total || 0) / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            企業邀課管理
          </h1>
          <p className="text-muted-foreground text-sm mt-1">管理來自企業內訓頁面的邀課諮詢</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={!data?.items?.length}>
          <Download className="h-4 w-4 mr-1" /> 匯出 CSV
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-xs text-muted-foreground">總申請數</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.byStatus.new}</div>
              <div className="text-xs text-muted-foreground">新申請</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.byStatus.contacted}</div>
              <div className="text-xs text-muted-foreground">已聯繫</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.byStatus.quoted}</div>
              <div className="text-xs text-muted-foreground">已報價</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.byStatus.closed}</div>
              <div className="text-xs text-muted-foreground">已成交</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Source Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold">{stats.bySource.general}</div>
              <div className="text-xs text-muted-foreground">全產業</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold">{stats.bySource.tech}</div>
              <div className="text-xs text-muted-foreground">科技業</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold">{stats.bySource.manufacturing}</div>
              <div className="text-xs text-muted-foreground">製造業</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">狀態：</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                className="px-3 py-1.5 border border-border rounded-md bg-background text-sm"
              >
                <option value="all">全部</option>
                <option value="new">新申請</option>
                <option value="contacted">已聯繫</option>
                <option value="quoted">已報價</option>
                <option value="closed">已成交</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">來源：</label>
              <select
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value); setPage(0); }}
                className="px-3 py-1.5 border border-border rounded-md bg-background text-sm"
              >
                <option value="all">全部</option>
                <option value="general">全產業</option>
                <option value="tech">科技業</option>
                <option value="manufacturing">製造業</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜尋姓名、公司、Email、電話..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-9 pr-3 py-1.5 border border-border rounded-md bg-background text-sm"
                />
              </div>
              <Button size="sm" variant="outline" onClick={handleSearch}>搜尋</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : !data?.items?.length ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>目前沒有邀課申請</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">公司</th>
                    <th className="text-left p-3 font-medium">聯絡人</th>
                    <th className="text-left p-3 font-medium">Email</th>
                    <th className="text-left p-3 font-medium">來源</th>
                    <th className="text-left p-3 font-medium">狀態</th>
                    <th className="text-left p-3 font-medium">提交時間</th>
                    <th className="text-right p-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="font-medium">{item.company}</div>
                        <div className="text-xs text-muted-foreground">{item.headcount || ""}</div>
                      </td>
                      <td className="p-3">
                        <div>{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.jobTitle}</div>
                      </td>
                      <td className="p-3">
                        <a href={`mailto:${item.email}`} className="text-primary hover:underline">{item.email}</a>
                        {item.phone && <div className="text-xs text-muted-foreground">{item.phone}</div>}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {SOURCE_MAP[item.sourcePage] || item.sourcePage}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={STATUS_MAP[item.status]?.variant || "outline"}>
                          {STATUS_MAP[item.status]?.label || item.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">
                        {new Date(item.createdAt).toLocaleDateString("zh-TW")}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openDetail(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteConfirmId(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t">
              <div className="text-sm text-muted-foreground">
                共 {data?.total || 0} 筆，第 {page + 1} / {totalPages} 頁
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>邀課詳情</DialogTitle>
            <DialogDescription>
              {selectedInquiry?.company} - {selectedInquiry?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">姓名：</span>
                  <span className="font-medium">{selectedInquiry.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">公司：</span>
                  <span className="font-medium">{selectedInquiry.company}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">職稱：</span>
                  <span>{selectedInquiry.jobTitle}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Email：</span>
                  <a href={`mailto:${selectedInquiry.email}`} className="text-primary hover:underline">{selectedInquiry.email}</a>
                </div>
                <div>
                  <span className="text-muted-foreground">電話：</span>
                  <span>{selectedInquiry.phone || "未填寫"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">預計人數：</span>
                  <span>{selectedInquiry.headcount || "未填寫"}</span>
                </div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">有興趣方案：</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedInquiry.programs ? JSON.parse(selectedInquiry.programs).map((p: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">{p}</Badge>
                  )) : <span className="text-muted-foreground">未選擇</span>}
                </div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">預計時間：</span>
                <span>{selectedInquiry.preferredTime || "未填寫"}</span>
              </div>
              {selectedInquiry.notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">其他需求：</span>
                  <p className="mt-1 p-2 bg-muted/50 rounded text-sm">{selectedInquiry.notes}</p>
                </div>
              )}
              <div className="text-sm">
                <span className="text-muted-foreground">來源：</span>
                <Badge variant="outline">{SOURCE_MAP[selectedInquiry.sourcePage]}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                提交時間：{new Date(selectedInquiry.createdAt).toLocaleString("zh-TW")}
              </div>

              <hr />

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1">更新狀態</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                  >
                    <option value="new">新申請</option>
                    <option value="contacted">已聯繫</option>
                    <option value="quoted">已報價</option>
                    <option value="closed">已成交</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">管理備註</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    placeholder="內部備註..."
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm resize-none"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>關閉</Button>
            <Button onClick={handleUpdateStatus} disabled={updateStatusMutation.isPending}>
              {updateStatusMutation.isPending ? "儲存中..." : "儲存變更"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>確定要刪除這筆邀課申請嗎？此操作無法復原。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>取消</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "刪除中..." : "確認刪除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
