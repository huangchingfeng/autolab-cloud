import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Search, DollarSign, Users, Clock, CheckCircle2, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";

export default function PaymentRecords() {
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "failed" | "all">("all");
  const [selectedRecord, setSelectedRecord] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  // Fetch payment statistics summary
  const { data: statsSummary } = trpc.course2026.getPaymentStatsSummary.useQuery();

  // Fetch course session statistics
  const { data: sessionStats } = trpc.course2026.getCourseSessionStats.useQuery();

  // Fetch payment records
  const { data: paymentRecords, isLoading } = trpc.course2026.getAllPaymentRecords.useQuery({
    limit: pageSize,
    offset: currentPage * pageSize,
    paymentStatus: paymentStatus === "all" ? undefined : paymentStatus,
    search: search || undefined,
  });

  // Fetch selected record details
  const { data: recordDetail } = trpc.course2026.getRegistrationById.useQuery(
    { id: selectedRecord! },
    { enabled: selectedRecord !== null }
  );

  const handleSearch = () => {
    setCurrentPage(0);
  };

  const handleExportCSV = () => {
    if (!paymentRecords?.records) return;

    // Prepare CSV data
    const headers = [
      "訂單編號",
      "報名日期",
      "學員姓名",
      "電話",
      "Email",
      "方案",
      "金額",
      "付款方式",
      "付款狀態",
      "選擇課程",
    ];

    const rows = paymentRecords.records.map((record) => {
      const selectedSessions = JSON.parse(record.selectedSessions);
      return [
        record.id,
        new Date(record.createdAt).toLocaleString("zh-TW"),
        record.name1,
        record.phone1,
        record.email1,
        record.plan === "single" ? "單人" : record.plan === "double" ? "雙人" : "全修",
        record.planPrice,
        record.paymentMethod === "transfer" ? "銀行匯款" : "線上刷卡",
        record.paymentStatus === "paid" ? "已付款" : record.paymentStatus === "pending" ? "待付款" : "失敗",
        selectedSessions.join(", "),
      ];
    });

    // Convert to CSV
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `payment-records-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500 text-white">已付款</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500 text-white">待付款</Badge>;
      case "failed":
        return <Badge className="bg-red-500 text-white">失敗</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case "single":
        return "單人單堂";
      case "double":
        return "雙人同行";
      case "full":
        return "全修班";
      default:
        return plan;
    }
  };

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">付款記錄管理</h1>
        <p className="text-muted-foreground mt-2">查看所有課程報名與付款記錄</p>
      </div>

      {/* Statistics Cards */}
      {statsSummary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總報名數</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsSummary.totalRegistrations}</div>
              <p className="text-xs text-muted-foreground">所有報名訂單</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已付款</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsSummary.paidRegistrations}</div>
              <p className="text-xs text-muted-foreground">
                {statsSummary.totalRegistrations > 0
                  ? `${((statsSummary.paidRegistrations / statsSummary.totalRegistrations) * 100).toFixed(1)}%`
                  : "0%"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待付款</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsSummary.pendingRegistrations}</div>
              <p className="text-xs text-muted-foreground">
                {statsSummary.totalRegistrations > 0
                  ? `${((statsSummary.pendingRegistrations / statsSummary.totalRegistrations) * 100).toFixed(1)}%`
                  : "0%"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">總營收</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">NT$ {statsSummary.paidRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">已收款項 / 總計 NT$ {statsSummary.totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Course Session Statistics */}
      {sessionStats && sessionStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>各場次報名統計</CardTitle>
            <CardDescription>每場課程的報名人數和營收統計</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>場次</TableHead>
                    <TableHead>課程名稱</TableHead>
                    <TableHead className="text-right">報名訂單</TableHead>
                    <TableHead className="text-right">已付款人數</TableHead>
                    <TableHead className="text-right">待付款人數</TableHead>
                    <TableHead className="text-right">已收營收</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionStats.map((stat) => (
                    <TableRow key={stat.sessionId}>
                      <TableCell className="font-medium">{stat.sessionDate}</TableCell>
                      <TableCell>{stat.sessionName}</TableCell>
                      <TableCell className="text-right">{stat.totalRegistrations}</TableCell>
                      <TableCell className="text-right">{stat.paidRegistrations}</TableCell>
                      <TableCell className="text-right">{stat.pendingRegistrations}</TableCell>
                      <TableCell className="text-right">NT$ {stat.paidRevenue.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>所有訂單</CardTitle>
              <CardDescription>查看和管理所有付款記錄</CardDescription>
            </div>
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              匯出 CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="搜尋姓名、Email 或電話..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} size="icon" variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select
              value={paymentStatus}
              onValueChange={(value: any) => {
                setPaymentStatus(value);
                setCurrentPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="付款狀態" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部狀態</SelectItem>
                <SelectItem value="paid">已付款</SelectItem>
                <SelectItem value="pending">待付款</SelectItem>
                <SelectItem value="failed">失敗</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : paymentRecords?.records && paymentRecords.records.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>訂單編號</TableHead>
                      <TableHead>報名日期</TableHead>
                      <TableHead>學員姓名</TableHead>
                      <TableHead>方案</TableHead>
                      <TableHead className="text-right">金額</TableHead>
                      <TableHead>付款方式</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentRecords.records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-mono">#{record.id}</TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(record.createdAt), {
                            addSuffix: true,
                            locale: zhTW,
                          })}
                        </TableCell>
                        <TableCell>{record.name1}</TableCell>
                        <TableCell>{getPlanLabel(record.plan)}</TableCell>
                        <TableCell className="text-right font-medium">NT$ {record.planPrice.toLocaleString()}</TableCell>
                        <TableCell>
                          {record.paymentMethod === "transfer" ? "銀行匯款" : "線上刷卡"}
                        </TableCell>
                        <TableCell>{getPaymentStatusBadge(record.paymentStatus)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRecord(record.id)}
                          >
                            查看詳情
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  顯示 {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, paymentRecords.total)} 筆，
                  共 {paymentRecords.total} 筆
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                  >
                    上一頁
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={(currentPage + 1) * pageSize >= paymentRecords.total}
                  >
                    下一頁
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">沒有找到符合條件的記錄</div>
          )}
        </CardContent>
      </Card>

      {/* Record Detail Dialog */}
      <Dialog open={selectedRecord !== null} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>訂單詳情 #{selectedRecord}</DialogTitle>
            <DialogDescription>完整的報名和付款資訊</DialogDescription>
          </DialogHeader>
          {recordDetail && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="font-semibold mb-2">基本資訊</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">訂單編號：</span>
                    <span className="font-mono">#{recordDetail.id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">報名日期：</span>
                    {new Date(recordDetail.createdAt).toLocaleString("zh-TW")}
                  </div>
                  <div>
                    <span className="text-muted-foreground">學員類型：</span>
                    {recordDetail.userType === "new" ? "新生" : "舊生"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">方案：</span>
                    {getPlanLabel(recordDetail.plan)}
                  </div>
                </div>
              </div>

              {/* Student 1 Info */}
              <div>
                <h3 className="font-semibold mb-2">學員資料</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">姓名：</span>
                    {recordDetail.name1}
                  </div>
                  <div>
                    <span className="text-muted-foreground">電話：</span>
                    {recordDetail.phone1}
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Email：</span>
                    {recordDetail.email1}
                  </div>
                  {recordDetail.industry1 && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">產業：</span>
                      {recordDetail.industry1}
                    </div>
                  )}
                </div>
              </div>

              {/* Student 2 Info (if double plan) */}
              {recordDetail.plan === "double" && recordDetail.name2 && (
                <div>
                  <h3 className="font-semibold mb-2">第二位學員資料</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">姓名：</span>
                      {recordDetail.name2}
                    </div>
                    <div>
                      <span className="text-muted-foreground">電話：</span>
                      {recordDetail.phone2}
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Email：</span>
                      {recordDetail.email2}
                    </div>
                    {recordDetail.industry2 && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">產業：</span>
                        {recordDetail.industry2}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Courses */}
              <div>
                <h3 className="font-semibold mb-2">選擇課程</h3>
                <div className="text-sm space-y-1">
                  {JSON.parse(recordDetail.selectedSessions).map((sessionId: string) => {
                    const session = sessionStats?.find((s) => s.sessionId === sessionId);
                    return (
                      <div key={sessionId} className="flex items-center gap-2">
                        <Badge variant="outline">{sessionId}</Badge>
                        <span>{session?.sessionName || sessionId}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="font-semibold mb-2">付款資訊</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">付款方式：</span>
                    {recordDetail.paymentMethod === "transfer" ? "銀行匯款" : "線上刷卡"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">付款狀態：</span>
                    {getPaymentStatusBadge(recordDetail.paymentStatus)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">金額：</span>
                    <span className="font-semibold">NT$ {recordDetail.planPrice.toLocaleString()}</span>
                  </div>
                  {recordDetail.transferLast5 && (
                    <div>
                      <span className="text-muted-foreground">帳號後五碼：</span>
                      {recordDetail.transferLast5}
                    </div>
                  )}
                  {recordDetail.newebpayTradeNo && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">藍新交易編號：</span>
                      <span className="font-mono text-xs">{recordDetail.newebpayTradeNo}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {recordDetail.notes && (
                <div>
                  <h3 className="font-semibold mb-2">備註</h3>
                  <p className="text-sm text-muted-foreground">{recordDetail.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
