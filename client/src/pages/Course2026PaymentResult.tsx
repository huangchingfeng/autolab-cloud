import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowLeft, Loader2, Calendar, MapPin, Mail, Clock } from "lucide-react";

export default function Course2026PaymentResult() {
  // 直接用 window.location.search 解析 query 參數
  const [pathname] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const payment = searchParams.get("payment");
  const idParam = searchParams.get("id");

  const redirectSaysSuccess = payment === "success";
  const id = idParam ? parseInt(idParam, 10) : 0;
  const validId = Number.isFinite(id) && id > 0;

  // 取得報名資訊（不輪詢，只取一次）
  const { data: registration, isLoading } = trpc.course2026.getRegistrationById.useQuery(
    { id },
    {
      enabled: validId, // 只有 validId 為 true 時才執行 query
      refetchInterval: false, // 關閉自動輪詢
      retry: false, // 不重試
    }
  );

  // 解析選擇的課程場次
  const selectedSessions = (() => {
    try {
      const raw = registration?.selectedSessions;
      if (!raw) return [];
      return Array.isArray(raw) ? raw : JSON.parse(raw);
    } catch {
      console.error("Failed to parse selectedSessions:", registration?.selectedSessions);
      return [];
    }
  })();

  // 課程場次資訊
  const sessionInfo: Record<string, { date: string; time: string; month: string }> = {
    "0120": { date: "1/20 (一)", time: "19:00-21:30", month: "january" },
    "0122": { date: "1/22 (三)", time: "19:00-21:30", month: "january" },
    "0127": { date: "1/27 (一)", time: "19:00-21:30", month: "january" },
    "0129": { date: "1/29 (三)", time: "19:00-21:30", month: "january" },
    "0203": { date: "2/3 (一)", time: "19:00-21:30", month: "february" },
    "0205": { date: "2/5 (三)", time: "19:00-21:30", month: "february" },
    "0210": { date: "2/10 (一)", time: "19:00-21:30", month: "february" },
    "0212": { date: "2/12 (三)", time: "19:00-21:30", month: "february" },
    "0303": { date: "3/3 (一)", time: "19:00-21:30", month: "march" },
    "0305": { date: "3/5 (三)", time: "19:00-21:30", month: "march" },
    "0310": { date: "3/10 (一)", time: "19:00-21:30", month: "march" },
    "0312": { date: "3/12 (三)", time: "19:00-21:30", month: "march" },
  };

  // 方案名稱對應
  const planNames: Record<string, string> = {
    single: "單月方案",
    full: "全修方案",
    double: "雙人同行方案",
    test: "測試付款",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background py-12">
        <div className="container max-w-3xl">
          {/* 付款結果卡片 */}
          <Card className="mb-8">
            <CardHeader className="text-center pb-2">
              {redirectSaysSuccess ? (
                <>
                  <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-10 w-10 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl text-blue-600">付款確認中...</CardTitle>
                  <CardDescription className="text-base mt-2">
                    您的付款已完成，系統正在確認中
                  </CardDescription>
                  <CardDescription className="text-base mt-2 font-medium text-foreground">
                    請於您的報名信箱裡查收確認信
                  </CardDescription>
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-left">
                    <p className="text-muted-foreground">
                      📧 我們已將報名確認信寄送至您填寫的 Email 信箱
                    </p>
                    <p className="text-muted-foreground mt-2">
                      ⏱️ 若 5 分鐘內未收到信件，請檢查垃圾郵件匣，或聯繫客服
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl text-green-600">報名資訊</CardTitle>
                  <CardDescription className="text-base mt-2">
                    以下是您的報名詳細資訊
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent>
              {/* Debug 資訊（只在開發環境顯示） */}
              {import.meta.env.DEV && (
                <div className="mt-4 mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs font-mono">
                  <div className="font-bold mb-1 text-yellow-800 dark:text-yellow-200">🔍 Debug Info:</div>
                  <div className="space-y-0.5 text-yellow-700 dark:text-yellow-300">
                    <div>path={pathname}</div>
                    <div>search={window.location.search || "null"}</div>
                    <div>payment={payment ?? "null"}</div>
                    <div>id={idParam ?? "null"}</div>
                    <div>loading={String(isLoading)}</div>
                  </div>
                </div>
              )}

              {/* 報名資訊 */}
              {validId && (
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium mb-3">報名資訊</h3>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : registration ? (
                    <div className="space-y-3">
                      {/* 基本資訊 */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">報名編號</span>
                          <span className="font-mono">#{registration.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">方案</span>
                          <span>{planNames[registration.plan] || registration.plan}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">付款金額</span>
                          <span className="font-medium">NT$ {registration.planPrice?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">付款狀態</span>
                          <span className="text-blue-600">確認中</span>
                        </div>
                      </div>

                      {/* 學員資訊 */}
                      <div className="pt-3 border-t">
                        <h4 className="font-medium text-sm mb-2">學員資訊</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground min-w-[60px]">姓名</span>
                            <span>{registration.name1}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-muted-foreground min-w-[60px]">Email</span>
                            <span className="break-all">{registration.email1}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-muted-foreground min-w-[60px]">電話</span>
                            <span>{registration.phone1}</span>
                          </div>
                          {registration.industry1 && (
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground min-w-[60px]">產業</span>
                              <span>{registration.industry1}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 第二位學員資訊（雙人方案） */}
                      {registration.plan === "double" && registration.name2 && (
                        <div className="pt-3 border-t">
                          <h4 className="font-medium text-sm mb-2">第二位學員資訊</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground min-w-[60px]">姓名</span>
                              <span>{registration.name2}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <span className="text-muted-foreground min-w-[60px]">Email</span>
                              <span className="break-all">{registration.email2}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-muted-foreground min-w-[60px]">電話</span>
                              <span>{registration.phone2}</span>
                            </div>
                            {registration.industry2 && (
                              <div className="flex items-start gap-2">
                                <span className="text-muted-foreground min-w-[60px]">產業</span>
                                <span>{registration.industry2}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 選擇的課程場次 */}
                      {selectedSessions.length > 0 && (
                        <div className="pt-3 border-t">
                          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            選擇的課程場次
                          </h4>
                          <div className="space-y-2">
                            {selectedSessions.map((sessionId: string) => {
                              const info = sessionInfo[sessionId];
                              if (!info) return null;
                              return (
                                <div
                                  key={sessionId}
                                  className="flex items-center justify-between p-2 bg-background rounded border text-sm"
                                >
                                  <span className="font-medium">{info.date}</span>
                                  <span className="text-muted-foreground">{info.time}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 上課地點 */}
                      <div className="pt-3 border-t">
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          上課地點
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          台北市中山區民權東路二段 42 號 3 樓會議室
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">找不到報名資訊</p>
                  )}
                </div>
              )}

              {/* 返回按鈕 */}
              <div className="flex justify-center">
                <Button asChild variant="outline" size="lg">
                  <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    返回課程頁面
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
