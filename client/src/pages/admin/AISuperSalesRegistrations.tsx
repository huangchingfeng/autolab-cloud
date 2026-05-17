import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search, Download, Mail, Phone, Building2, User, Plus,
  Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown,
  Users, CalendarDays, BarChart3,
} from "lucide-react";
import { format } from "date-fns/format";
import { zhTW } from "date-fns/locale/zh-TW";

// Constants
const SESSION_MAP: Record<string, string> = {
  session1: "第一場(2/20)",
  session2: "第二場(3/6)",
  session3: "第三場(3/20)",
  session4: "第四場(4/10)",
};

const SESSION_FULL_MAP: Record<string, string> = {
  session1: "第一場：2/20 (四) 19:00-21:30",
  session2: "第二場：3/6 (四) 19:00-21:30",
  session3: "第三場：3/20 (四) 19:00-21:30",
  session4: "第四場：4/10 (四) 19:00-21:30",
};

const REFERRAL_SOURCE_MAP: Record<string, string> = {
  teacher: "阿峰老師",
  line_community: "LINE社群",
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  other: "其他",
};

const REFERRAL_SOURCE_OPTIONS = [
  { value: "teacher", label: "阿峰老師" },
  { value: "line_community", label: "阿峰老師LINE社群" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "other", label: "其他" },
];

const SESSION_OPTIONS = [
  { value: "session1", label: "第一場：2/20 (四)" },
  { value: "session2", label: "第二場：3/6 (四)" },
  { value: "session3", label: "第三場：3/20 (四)" },
  { value: "session4", label: "第四場：4/10 (四)" },
];

function formatSessions(selectedSessions: unknown): string {
  const sessions = Array.isArray(selectedSessions) ? selectedSessions : [];
  if (sessions.includes("all")) return "四場全報";
  return sessions.map((s: string) => SESSION_MAP[s] || s).join(", ");
}

function formatSessionsFull(selectedSessions: unknown): string {
  const sessions = Array.isArray(selectedSessions) ? selectedSessions : [];
  if (sessions.includes("all")) return "四場全報";
  return sessions.map((s: string) => SESSION_FULL_MAP[s] || s).join("\n");
}

function formatReferralSource(source: string): string {
  return REFERRAL_SOURCE_MAP[source] || source;
}

type SortField = "name" | "email" | "createdAt" | "referralSource" | "sessions";
type SortDirection = "asc" | "desc";

// Registration form for create/edit
function RegistrationForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [company, setCompany] = useState(initialData?.company || "");
  const [jobTitle, setJobTitle] = useState(initialData?.jobTitle || "");
  const [referralSource, setReferralSource] = useState(initialData?.referralSource || "teacher");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(initialData?.subscribeNewsletter || false);

  // Session selection
  const existingSessions = initialData?.selectedSessions
    ? (Array.isArray(initialData.selectedSessions) ? initialData.selectedSessions : [])
    : [];
  const [selectAll, setSelectAll] = useState(existingSessions.includes("all"));
  const [selectedSessions, setSelectedSessions] = useState<string[]>(
    existingSessions.includes("all")
      ? ["session1", "session2", "session3", "session4"]
      : existingSessions
  );

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedSessions(["session1", "session2", "session3", "session4"]);
    }
  };

  const handleSessionToggle = (session: string, checked: boolean) => {
    if (checked) {
      const newSessions = [...selectedSessions, session];
      setSelectedSessions(newSessions);
      if (newSessions.length === 4) setSelectAll(true);
    } else {
      setSelectedSessions(selectedSessions.filter(s => s !== session));
      setSelectAll(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      toast.error("請填寫必填欄位");
      return;
    }
    if (selectedSessions.length === 0) {
      toast.error("請選擇至少一個場次");
      return;
    }
    onSubmit({
      name,
      email,
      phone,
      company: company || undefined,
      jobTitle: jobTitle || undefined,
      selectedSessions: selectAll ? ["all"] : selectedSessions,
      referralSource,
      subscribeNewsletter,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">姓名 *</Label>
          <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">電話 *</Label>
          <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">公司</Label>
          <Input id="company" value={company} onChange={e => setCompany(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jobTitle">職稱</Label>
          <Input id="jobTitle" value={jobTitle} onChange={e => setJobTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="referralSource">資訊來源 *</Label>
          <Select value={referralSource} onValueChange={setReferralSource}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REFERRAL_SOURCE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>報名場次 *</Label>
        <div className="space-y-2 border rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="selectAll"
              checked={selectAll}
              onCheckedChange={(checked) => handleSelectAll(!!checked)}
            />
            <label htmlFor="selectAll" className="text-sm font-medium cursor-pointer">四場全報</label>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {SESSION_OPTIONS.map(opt => (
              <div key={opt.value} className="flex items-center space-x-2">
                <Checkbox
                  id={opt.value}
                  checked={selectedSessions.includes(opt.value)}
                  onCheckedChange={(checked) => handleSessionToggle(opt.value, !!checked)}
                  disabled={selectAll}
                />
                <label htmlFor={opt.value} className="text-sm cursor-pointer">{opt.label}</label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">備註</Label>
        <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="subscribeNewsletter"
          checked={subscribeNewsletter}
          onCheckedChange={(checked) => setSubscribeNewsletter(!!checked)}
        />
        <label htmlFor="subscribeNewsletter" className="text-sm cursor-pointer">訂閱電子報</label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>取消</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "處理中..." : (initialData ? "儲存變更" : "新增報名")}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function AISuperSalesRegistrations() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Dialog states
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [editRegistration, setEditRegistration] = useState<any>(null);
  const [deleteRegistration, setDeleteRegistration] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const utils = trpc.useUtils();
  const { data: registrations, isLoading } = trpc.aiSuperSales.getAllRegistrations.useQuery();
  const { data: sessionStats } = trpc.aiSuperSales.getSessionStats.useQuery();

  const createMutation = trpc.aiSuperSales.adminCreateRegistration.useMutation({
    onSuccess: () => {
      toast.success("報名已新增");
      setShowCreateDialog(false);
      utils.aiSuperSales.getAllRegistrations.invalidate();
      utils.aiSuperSales.getSessionStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.aiSuperSales.updateRegistration.useMutation({
    onSuccess: () => {
      toast.success("報名已更新");
      setEditRegistration(null);
      utils.aiSuperSales.getAllRegistrations.invalidate();
      utils.aiSuperSales.getSessionStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.aiSuperSales.deleteRegistration.useMutation({
    onSuccess: () => {
      toast.success("報名已刪除");
      setDeleteRegistration(null);
      utils.aiSuperSales.getAllRegistrations.invalidate();
      utils.aiSuperSales.getSessionStats.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Filter + sort registrations
  const filteredRegistrations = useMemo(() => {
    if (!registrations) return [];

    let filtered = registrations.filter((reg) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (
          !reg.name.toLowerCase().includes(search) &&
          !reg.email.toLowerCase().includes(search) &&
          !reg.phone.toLowerCase().includes(search) &&
          !(reg.company?.toLowerCase().includes(search))
        ) {
          return false;
        }
      }
      // Session filter
      if (sessionFilter !== "all") {
        const sessions = Array.isArray(reg.selectedSessions) ? reg.selectedSessions : [];
        if (sessionFilter === "allSessions") {
          if (!sessions.includes("all")) return false;
        } else {
          if (!sessions.includes(sessionFilter) && !sessions.includes("all")) return false;
        }
      }
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "name":
          cmp = a.name.localeCompare(b.name, "zh-TW");
          break;
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "referralSource":
          cmp = (a.referralSource || "").localeCompare(b.referralSource || "");
          break;
        case "sessions": {
          const aCount = Array.isArray(a.selectedSessions)
            ? (a.selectedSessions as string[]).includes("all") ? 4 : (a.selectedSessions as string[]).length
            : 0;
          const bCount = Array.isArray(b.selectedSessions)
            ? (b.selectedSessions as string[]).includes("all") ? 4 : (b.selectedSessions as string[]).length
            : 0;
          cmp = aCount - bCount;
          break;
        }
        case "createdAt":
        default:
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [registrations, searchTerm, sessionFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />;
    return sortDirection === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1 text-primary" />
      : <ArrowDown className="h-3 w-3 ml-1 text-primary" />;
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredRegistrations.length) {
      toast.error("沒有資料可匯出");
      return;
    }

    const headers = ["姓名", "Email", "電話", "公司", "職稱", "報名場次", "資訊來源", "訂閱電子報", "備註", "報名時間"];
    const rows = filteredRegistrations.map((reg) => [
      reg.name,
      reg.email,
      reg.phone,
      reg.company || "-",
      reg.jobTitle || "-",
      formatSessions(reg.selectedSessions),
      formatReferralSource(reg.referralSource),
      reg.subscribeNewsletter ? "是" : "否",
      reg.notes || "-",
      format(new Date(reg.createdAt), "yyyy-MM-dd HH:mm", { locale: zhTW }),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ai-super-sales-registrations-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("CSV 檔案已下載");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">載入中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI 超級業務實戰班報名管理</h1>
          <p className="text-muted-foreground mt-2">管理課程報名資料</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          新增報名
        </Button>
      </div>

      {/* Session Stats Cards */}
      {sessionStats && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card className={`cursor-pointer transition-all ${sessionFilter === "all" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setSessionFilter("all")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總報名</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats.total}</div>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-all ${sessionFilter === "session1" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setSessionFilter(sessionFilter === "session1" ? "all" : "session1")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">第一場</CardTitle>
              <CalendarDays className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats.session1}</div>
              <p className="text-xs text-muted-foreground">2/20 (四)</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-all ${sessionFilter === "session2" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setSessionFilter(sessionFilter === "session2" ? "all" : "session2")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">第二場</CardTitle>
              <CalendarDays className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats.session2}</div>
              <p className="text-xs text-muted-foreground">3/6 (四)</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-all ${sessionFilter === "session3" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setSessionFilter(sessionFilter === "session3" ? "all" : "session3")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">第三場</CardTitle>
              <CalendarDays className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats.session3}</div>
              <p className="text-xs text-muted-foreground">3/20 (四)</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-all ${sessionFilter === "session4" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setSessionFilter(sessionFilter === "session4" ? "all" : "session4")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">第四場</CardTitle>
              <CalendarDays className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats.session4}</div>
              <p className="text-xs text-muted-foreground">4/10 (四)</p>
            </CardContent>
          </Card>
          <Card className={`cursor-pointer transition-all ${sessionFilter === "allSessions" ? "ring-2 ring-primary" : "hover:shadow-md"}`}
            onClick={() => setSessionFilter(sessionFilter === "allSessions" ? "all" : "allSessions")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">四場全報</CardTitle>
              <BarChart3 className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionStats.allSessions}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Referral Source Stats */}
      {sessionStats?.byReferralSource && Object.keys(sessionStats.byReferralSource).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">資訊來源分布</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(sessionStats.byReferralSource).map(([source, count]) => (
                <Badge key={source} variant="secondary" className="text-sm py-1 px-3">
                  {formatReferralSource(source)}: {count as number} 人
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search, Filter, Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>報名名單</CardTitle>
              <CardDescription>
                {sessionFilter !== "all"
                  ? `篩選：${sessionFilter === "allSessions" ? "四場全報" : SESSION_MAP[sessionFilter] || sessionFilter} — 共 ${filteredRegistrations.length} 筆`
                  : `共 ${filteredRegistrations.length} 筆報名資料`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋姓名、Email、電話或公司..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sessionFilter} onValueChange={setSessionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="篩選場次" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部場次</SelectItem>
                <SelectItem value="session1">第一場 (2/20)</SelectItem>
                <SelectItem value="session2">第二場 (3/6)</SelectItem>
                <SelectItem value="session3">第三場 (3/20)</SelectItem>
                <SelectItem value="session4">第四場 (4/10)</SelectItem>
                <SelectItem value="allSessions">四場全報</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              匯出 CSV
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("name")}>
                    <div className="flex items-center">姓名<SortIcon field="name" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("email")}>
                    <div className="flex items-center">Email<SortIcon field="email" /></div>
                  </TableHead>
                  <TableHead>電話</TableHead>
                  <TableHead>公司</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("sessions")}>
                    <div className="flex items-center">報名場次<SortIcon field="sessions" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("referralSource")}>
                    <div className="flex items-center">資訊來源<SortIcon field="referralSource" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("createdAt")}>
                    <div className="flex items-center">報名時間<SortIcon field="createdAt" /></div>
                  </TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {searchTerm || sessionFilter !== "all" ? "找不到符合的報名資料" : "尚無報名資料"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">{reg.name}</TableCell>
                      <TableCell className="text-sm">{reg.email}</TableCell>
                      <TableCell className="text-sm">{reg.phone}</TableCell>
                      <TableCell className="text-sm">{reg.company || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            const sessions = Array.isArray(reg.selectedSessions) ? reg.selectedSessions : [];
                            if (sessions.includes("all")) {
                              return <Badge variant="default" className="text-xs">四場全報</Badge>;
                            }
                            return sessions.map((s: string) => (
                              <Badge key={s} variant="outline" className="text-xs">
                                {SESSION_MAP[s] || s}
                              </Badge>
                            ));
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatReferralSource(reg.referralSource)}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(reg.createdAt), "MM/dd HH:mm", { locale: zhTW })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedRegistration(reg)} title="查看詳情">
                            <User className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditRegistration(reg)} title="編輯">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteRegistration(reg)} title="刪除"
                            className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Detail Dialog */}
      <Dialog open={!!selectedRegistration} onOpenChange={() => setSelectedRegistration(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>報名詳情</DialogTitle>
            <DialogDescription>報名編號：{selectedRegistration?.id}</DialogDescription>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><User className="h-4 w-4" />姓名</div>
                  <div className="font-medium">{selectedRegistration.name}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Mail className="h-4 w-4" />Email</div>
                  <div className="font-medium">{selectedRegistration.email}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Phone className="h-4 w-4" />電話</div>
                  <div className="font-medium">{selectedRegistration.phone}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Building2 className="h-4 w-4" />公司</div>
                  <div className="font-medium">{selectedRegistration.company || "-"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">職稱</div>
                  <div className="font-medium">{selectedRegistration.jobTitle || "-"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">資訊來源</div>
                  <div className="font-medium">{formatReferralSource(selectedRegistration.referralSource)}</div>
                </div>
                <div className="space-y-1 col-span-2">
                  <div className="text-sm text-muted-foreground">報名場次</div>
                  <div className="font-medium whitespace-pre-line">{formatSessionsFull(selectedRegistration.selectedSessions)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">訂閱電子報</div>
                  <div className="font-medium">{selectedRegistration.subscribeNewsletter ? "是" : "否"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">報名時間</div>
                  <div className="font-medium">
                    {format(new Date(selectedRegistration.createdAt), "yyyy年MM月dd日 HH:mm", { locale: zhTW })}
                  </div>
                </div>
                {selectedRegistration.notes && (
                  <div className="space-y-1 col-span-2">
                    <div className="text-sm text-muted-foreground">備註</div>
                    <div className="font-medium bg-muted/50 rounded p-2">{selectedRegistration.notes}</div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setSelectedRegistration(null);
                  setEditRegistration(selectedRegistration);
                }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  編輯
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增報名</DialogTitle>
            <DialogDescription>手動新增一筆報名記錄</DialogDescription>
          </DialogHeader>
          <RegistrationForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setShowCreateDialog(false)}
            isSubmitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editRegistration} onOpenChange={() => setEditRegistration(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>編輯報名</DialogTitle>
            <DialogDescription>修改報名編號 {editRegistration?.id} 的資料</DialogDescription>
          </DialogHeader>
          {editRegistration && (
            <RegistrationForm
              initialData={editRegistration}
              onSubmit={(data) => updateMutation.mutate({ id: editRegistration.id, ...data })}
              onCancel={() => setEditRegistration(null)}
              isSubmitting={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteRegistration} onOpenChange={() => setDeleteRegistration(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              確定要刪除 <strong>{deleteRegistration?.name}</strong>（{deleteRegistration?.email}）的報名記錄嗎？此操作無法復原。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRegistration(null)}>取消</Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate({ id: deleteRegistration.id })}
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
