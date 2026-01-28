import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Download, Eye, RefreshCw } from "lucide-react";


export default function Course2026Registrations() {

  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"all" | "pending" | "paid" | "failed">("all");
  const [selectedRegistration, setSelectedRegistration] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const limit = 20;

  // Fetch registrations
  const { data, isLoading, refetch } = trpc.course2026.getAllRegistrations.useQuery({
    limit,
    offset: page * limit,
    paymentStatus: paymentStatus === "all" ? undefined : paymentStatus,
    search: search || undefined,
  });

  // Fetch registration detail
  const { data: registrationDetail } = trpc.course2026.getRegistrationById.useQuery(
    { id: selectedRegistration! },
    { enabled: !!selectedRegistration }
  );

  // Update payment status mutation
  const updatePaymentStatusMutation = trpc.course2026.updatePaymentStatus.useMutation({
    onSuccess: () => {
      alert("付款狀態已更新");
      refetch();
    },
    onError: (error) => {
      alert(`更新失敗：${error.message}`);
    },
  });

  const handleSearch = () => {
    setPage(0);
    refetch();
  };

  const handleExportExcel = () => {
    if (!data?.registrations) return;

    const headers = [
      "報名時間",
      "姓名",
      "Email",
      "電話",
      "產業",
      "方案",
      "費用",
      "付款方式",
      "付款狀態",
      "選擇課程",
    ];

    const rows = data.registrations.map((reg) => {
      const sessions = JSON.parse(reg.selectedSessions);
      return [
        new Date(reg.createdAt).toLocaleString("zh-TW"),
        reg.name1,
        reg.email1,
        reg.phone1,
        reg.industry1 || "-",
        reg.plan,
        reg.planPrice,
        reg.paymentMethod === "transfer" ? "銀行匯款" : "線上刷卡",
        reg.paymentStatus === "paid" ? "已付款" : reg.paymentStatus === "pending" ? "待付款" : "失敗",
        sessions.join(", "),
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `2026課程報名_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert("報名資料已匯出為 CSV 檔案");
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">已付款</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">待付款</Badge>;
      case "failed":
        return <Badge variant="destructive">失敗</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanName = (plan: string) => {
    const planNames: Record<string, string> = {
      single: "單堂體驗",
      full: "全系列套票",
      double: "雙人同行",
    };
    return planNames[plan] || plan;
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">2026 AI 實戰應用課 - 報名管理</CardTitle>
          <CardDescription>查看和管理所有課程報名資料</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="搜尋姓名、Email 或電話..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select
              value={paymentStatus}
              onValueChange={(value: any) => {
                setPaymentStatus(value);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="付款狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="pending">待付款</SelectItem>
                <SelectItem value="paid">已付款</SelectItem>
                <SelectItem value="failed">失敗</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => refetch()} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleExportExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              匯出 Excel
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>總報名數</CardDescription>
                <CardTitle className="text-3xl">{data?.total || 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>已付款</CardDescription>
                <CardTitle className="text-3xl text-green-600">
                  {data?.registrations.filter((r) => r.paymentStatus === "paid").length || 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>待付款</CardDescription>
                <CardTitle className="text-3xl text-yellow-600">
                  {data?.registrations.filter((r) => r.paymentStatus === "pending").length || 0}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>總金額</CardDescription>
                <CardTitle className="text-3xl">
                  NT$ {data?.registrations.reduce((sum, r) => sum + r.planPrice, 0).toLocaleString() || 0}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>報名時間</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>方案</TableHead>
                  <TableHead>費用</TableHead>
                  <TableHead>付款方式</TableHead>
                  <TableHead>付款狀態</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      載入中...
                    </TableCell>
                  </TableRow>
                ) : data?.registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      沒有找到報名資料
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.registrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell className="text-sm">
                        {new Date(registration.createdAt).toLocaleDateString("zh-TW")}
                      </TableCell>
                      <TableCell className="font-medium">{registration.name1}</TableCell>
                      <TableCell className="text-sm">{registration.email1}</TableCell>
                      <TableCell>{getPlanName(registration.plan)}</TableCell>
                      <TableCell className="font-semibold">
                        NT$ {registration.planPrice.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {registration.paymentMethod === "transfer" ? "銀行匯款" : "線上刷卡"}
                      </TableCell>
                      <TableCell>{getPaymentStatusBadge(registration.paymentStatus)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRegistration(registration.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.total > limit && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                上一頁
              </Button>
              <span className="flex items-center px-4">
                第 {page + 1} 頁 / 共 {Math.ceil(data.total / limit)} 頁
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * limit >= data.total}
              >
                下一頁
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Registration Detail Dialog */}
      <Dialog open={!!selectedRegistration} onOpenChange={() => setSelectedRegistration(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>報名詳情</DialogTitle>
            <DialogDescription>查看完整的報名資訊</DialogDescription>
          </DialogHeader>
          {registrationDetail && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">基本資訊</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">姓名</p>
                    <p className="font-medium">{registrationDetail.name1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{registrationDetail.email1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">電話</p>
                    <p className="font-medium">{registrationDetail.phone1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">產業</p>
                    <p className="font-medium">{registrationDetail.industry1 || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Second Person (if double plan) */}
              {registrationDetail.plan === "double" && registrationDetail.name2 && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg">第二位學員</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">姓名</p>
                      <p className="font-medium">{registrationDetail.name2}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{registrationDetail.email2}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">電話</p>
                      <p className="font-medium">{registrationDetail.phone2}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">產業</p>
                      <p className="font-medium">{registrationDetail.industry2 || "-"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Course Info */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">課程資訊</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">方案</p>
                    <p className="font-medium">{getPlanName(registrationDetail.plan)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">費用</p>
                    <p className="font-medium">NT$ {registrationDetail.planPrice.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">選擇的課程</p>
                  <div className="flex flex-wrap gap-2">
                    {JSON.parse(registrationDetail.selectedSessions).map((session: string) => (
                      <Badge key={session} variant="secondary">
                        {session}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">付款資訊</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">付款方式</p>
                    <p className="font-medium">
                      {registrationDetail.paymentMethod === "transfer" ? "銀行匯款" : "線上刷卡"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">付款狀態</p>
                    <div className="mt-1">{getPaymentStatusBadge(registrationDetail.paymentStatus)}</div>
                  </div>
                  {registrationDetail.transferLast5 && (
                    <div>
                      <p className="text-sm text-muted-foreground">帳號後五碼</p>
                      <p className="font-medium">{registrationDetail.transferLast5}</p>
                    </div>
                  )}
                  {registrationDetail.newebpayTradeNo && (
                    <div>
                      <p className="text-sm text-muted-foreground">藍新交易編號</p>
                      <p className="font-medium font-mono text-xs">{registrationDetail.newebpayTradeNo}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Info */}
              {registrationDetail.needInvoice && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg">發票資訊</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">統一編號</p>
                      <p className="font-medium font-mono">{registrationDetail.taxId || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">發票抬頭</p>
                      <p className="font-medium">{registrationDetail.invoiceTitle || "-"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Update Payment Status */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">管理操作</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      updatePaymentStatusMutation.mutate({
                        id: registrationDetail.id,
                        paymentStatus: "paid",
                      });
                    }}
                    disabled={registrationDetail.paymentStatus === "paid"}
                  >
                    標記為已付款
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      updatePaymentStatusMutation.mutate({
                        id: registrationDetail.id,
                        paymentStatus: "pending",
                      });
                    }}
                    disabled={registrationDetail.paymentStatus === "pending"}
                  >
                    標記為待付款
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      updatePaymentStatusMutation.mutate({
                        id: registrationDetail.id,
                        paymentStatus: "failed",
                      });
                    }}
                    disabled={registrationDetail.paymentStatus === "failed"}
                  >
                    標記為失敗
                  </Button>
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-sm text-muted-foreground">
                <p>報名時間：{new Date(registrationDetail.createdAt).toLocaleString("zh-TW")}</p>
                <p>更新時間：{new Date(registrationDetail.updatedAt).toLocaleString("zh-TW")}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
