import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Users, Download, RefreshCw, CheckCircle, Clock, User2, UserCheck, ArrowRightLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function Course2026SessionRoster() {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  
  // Transfer dialog state
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferData, setTransferData] = useState<{
    registrationId: number;
    attendeeEmail: string;
    attendeeName: string;
    fromSessionId: string;
    fromSessionName: string;
  } | null>(null);
  const [selectedTargetSession, setSelectedTargetSession] = useState<string>("");
  const [transferReason, setTransferReason] = useState<string>("");
  
  // Fetch sessions with registrations
  const { data: sessions, isLoading, refetch } = trpc.course2026.getSessionsWithRegistrations.useQuery();
  
  // Attendance mutation
  const updateAttendanceMutation = trpc.course2026.updateAttendance.useMutation({
    onSuccess: () => {
      toast.success("出席狀態已更新");
      refetch();
    },
    onError: (error) => {
      toast.error(`更新失敗: ${error.message}`);
    },
  });

  // Transfer queries and mutations
  const { data: availableTransferSessions, isLoading: isLoadingTransferSessions } = 
    trpc.course2026.getAvailableTransferSessions.useQuery(
      {
        currentSessionId: transferData?.fromSessionId || "",
        registrationId: transferData?.registrationId || 0,
      },
      {
        enabled: transferDialogOpen && !!transferData,
      }
    );

  const executeTransferMutation = trpc.course2026.executeCourseTransfer.useMutation({
    onSuccess: () => {
      toast.success("調課成功");
      setTransferDialogOpen(false);
      setTransferData(null);
      setSelectedTargetSession("");
      setTransferReason("");
      refetch();
    },
    onError: (error) => {
      toast.error(`調課失敗: ${error.message}`);
    },
  });

  // Handle transfer button click
  const handleTransferClick = (
    registrationId: number,
    attendeeEmail: string,
    attendeeName: string,
    fromSessionId: string,
    fromSessionName: string
  ) => {
    setTransferData({
      registrationId,
      attendeeEmail,
      attendeeName,
      fromSessionId,
      fromSessionName,
    });
    setTransferDialogOpen(true);
  };

  // Handle transfer submit
  const handleTransferSubmit = () => {
    if (!transferData || !selectedTargetSession) {
      toast.error("請選擇目標場次");
      return;
    }

    // Find the target session details
    const targetSession = availableTransferSessions?.find(s => s.sessionId === selectedTargetSession);
    if (!targetSession) {
      toast.error("找不到目標場次資訊");
      return;
    }

    // Find the current session details
    const currentSession = sessions?.find(s => s.sessionId === transferData.fromSessionId);

    executeTransferMutation.mutate({
      registrationId: transferData.registrationId,
      attendeeEmail: transferData.attendeeEmail,
      attendeeName: transferData.attendeeName,
      fromSessionId: transferData.fromSessionId,
      fromSessionName: transferData.fromSessionName,
      fromSessionDate: currentSession?.sessionDate || '',
      fromSessionTime: currentSession?.sessionTime || '',
      toSessionId: selectedTargetSession,
      toSessionName: targetSession.name,
      toSessionDate: targetSession.date,
      toSessionTime: targetSession.time,
      location: targetSession.location || '台北',
      reason: transferReason || undefined,
    });
  };

  // Filter sessions by month
  const filteredSessions = sessions?.filter(session => {
    if (selectedMonth === "all") return true;
    return session.sessionDate.startsWith(`2026-${selectedMonth}`);
  });

  // Export session roster to CSV
  const handleExportSession = (session: NonNullable<typeof sessions>[0]) => {
    const headers = ["姓名", "Email", "電話", "產業", "方案", "付款狀態", "出席狀態", "是否同行者"];
    
    const rows: string[][] = [];
    session.registrations.forEach(reg => {
      rows.push([
        reg.name,
        reg.email,
        reg.phone,
        reg.industry || "-",
        reg.plan === "double" ? "雙人同行" : reg.plan === "full" ? "全系列套票" : "單堂",
        reg.paymentStatus === "paid" ? "已付款" : reg.paymentStatus === "pending" ? "待付款" : "失敗",
        reg.attended ? "已出席" : "未出席",
        reg.isSecondPerson ? "是" : "否",
      ]);
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${session.sessionDate}_${session.sessionName}_報名名單.csv`;
    link.click();
  };

  // Export all sessions to CSV
  const handleExportAll = () => {
    if (!filteredSessions) return;

    const headers = ["課程日期", "課程名稱", "姓名", "Email", "電話", "產業", "方案", "付款狀態", "出席狀態", "是否同行者"];
    
    const rows: string[][] = [];
    filteredSessions.forEach(session => {
      session.registrations.forEach(reg => {
        rows.push([
          session.sessionDate,
          session.sessionName,
          reg.name,
          reg.email,
          reg.phone,
          reg.industry || "-",
          reg.plan === "double" ? "雙人同行" : reg.plan === "full" ? "全系列套票" : "單堂",
          reg.paymentStatus === "paid" ? "已付款" : reg.paymentStatus === "pending" ? "待付款" : "失敗",
          reg.attended ? "已出席" : "未出席",
          reg.isSecondPerson ? "是" : "否",
        ]);
      });
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `2026_AI實戰應用課_全部報名名單.csv`;
    link.click();
  };

  // Handle attendance toggle
  const handleAttendanceToggle = (sessionId: string, registrationId: number, isSecondPerson: boolean, currentAttended: boolean) => {
    updateAttendanceMutation.mutate({
      sessionId,
      registrationId,
      isSecondPerson,
      attended: !currentAttended,
    });
  };

  // Calculate totals
  const totalPaid = filteredSessions?.reduce((sum, s) => sum + s.paidCount, 0) || 0;
  const totalPending = filteredSessions?.reduce((sum, s) => sum + s.pendingCount, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">每日課程報名名單</h1>
          <p className="text-muted-foreground">查看每一堂課的報名學員名單，並記錄出席狀況</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="選擇月份" />
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
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleExportAll}>
            <Download className="mr-2 h-4 w-4" />
            匯出全部
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總課程數</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{filteredSessions?.length || 0}</div>
            <p className="text-xs text-muted-foreground">堂課程</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已付款學員</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalPaid}</div>
            <p className="text-xs text-muted-foreground">人次</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待付款學員</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalPending}</div>
            <p className="text-xs text-muted-foreground">人次</p>
          </CardContent>
        </Card>
      </div>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>課程報名名單</CardTitle>
          <CardDescription>點擊展開查看每堂課的報名學員，勾選記錄出席狀況</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredSessions && filteredSessions.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredSessions.map((session) => (
                <AccordionItem key={session.sessionId} value={session.sessionId}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex w-full items-center justify-between pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{session.sessionName}</div>
                          <div className="text-sm text-muted-foreground">
                            {session.sessionDate} ({session.dayOfWeek}) {session.sessionTime}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          已付款 {session.paidCount}
                        </Badge>
                        {session.pendingCount > 0 && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Clock className="mr-1 h-3 w-3" />
                            待付款 {session.pendingCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4">
                      {session.registrations.length > 0 ? (
                        <>
                          <div className="mb-4 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleExportSession(session)}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              匯出此課程名單
                            </Button>
                          </div>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[60px]">出席</TableHead>
                                <TableHead>姓名</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>電話</TableHead>
                                <TableHead>方案</TableHead>
                                <TableHead>付款狀態</TableHead>
                                <TableHead className="w-[80px]">操作</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {session.registrations.map((reg) => (
                                <TableRow key={`${reg.id}-${reg.isSecondPerson ? '2' : '1'}`}>
                                  <TableCell>
                                    <Checkbox
                                      checked={reg.attended || false}
                                      onCheckedChange={() => handleAttendanceToggle(
                                        session.sessionId,
                                        reg.id,
                                        reg.isSecondPerson,
                                        reg.attended || false
                                      )}
                                      disabled={updateAttendanceMutation.isPending}
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      {reg.attended ? (
                                        <UserCheck className="h-4 w-4 text-green-500" />
                                      ) : (
                                        <User2 className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      {reg.name}
                                      {reg.isSecondPerson && (
                                        <Badge variant="outline" className="text-xs">同行者</Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>{reg.email}</TableCell>
                                  <TableCell>{reg.phone}</TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">
                                      {reg.plan === "double" ? "雙人同行" : reg.plan === "full" ? "全系列" : "單堂"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={reg.paymentStatus === "paid" ? "default" : "outline"}
                                      className={
                                        reg.paymentStatus === "paid"
                                          ? "bg-green-500"
                                          : reg.paymentStatus === "pending"
                                          ? "border-yellow-500 text-yellow-600"
                                          : "border-red-500 text-red-600"
                                      }
                                    >
                                      {reg.paymentStatus === "paid"
                                        ? "已付款"
                                        : reg.paymentStatus === "pending"
                                        ? "待付款"
                                        : "失敗"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleTransferClick(
                                        reg.id,
                                        reg.email,
                                        reg.name,
                                        session.sessionId,
                                        session.sessionName
                                      )}
                                      disabled={reg.paymentStatus !== "paid"}
                                      title="調課"
                                    >
                                      <ArrowRightLeft className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </>
                      ) : (
                        <div className="py-8 text-center text-muted-foreground">
                          <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
                          <p>尚無報名學員</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <Calendar className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>沒有符合條件的課程</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>調課</DialogTitle>
            <DialogDescription>
              將 {transferData?.attendeeName} 從「{transferData?.fromSessionName}」調整到其他場次
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>目標場次</Label>
              {isLoadingTransferSessions ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : availableTransferSessions && availableTransferSessions.length > 0 ? (
                <Select value={selectedTargetSession} onValueChange={setSelectedTargetSession}>
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇目標場次" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTransferSessions.map((session) => (
                      <SelectItem key={session.sessionId} value={session.sessionId}>
                        {session.date} ({session.dayOfWeek}) {session.time} - {session.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">沒有可調課的場次（同一課程的其他日期）</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>調課原因（選填）</Label>
              <Textarea
                placeholder="請輸入調課原因..."
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleTransferSubmit}
              disabled={!selectedTargetSession || executeTransferMutation.isPending}
            >
              {executeTransferMutation.isPending ? "處理中..." : "確認調課"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
