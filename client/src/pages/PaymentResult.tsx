import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, ArrowLeft, Calendar, Loader2, CalendarPlus } from "lucide-react";

export default function PaymentResult() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const paymentStatus = searchParams.get("payment");
  const orderNo = searchParams.get("order");

  const isSuccess = paymentStatus === "success";

  // 取得訂單資訊
  const { data: orderData, isLoading: orderLoading } = trpc.payment.getOrderByNo.useQuery(
    { orderNo: orderNo || "" },
    { enabled: !!orderNo }
  );

  // 生成 Google 行事曆連結
  const generateGoogleCalendarUrl = () => {
    if (!orderData?.event) return null;
    
    const event = orderData.event;
    const eventDate = event.eventDate ? new Date(event.eventDate) : null;
    
    if (!eventDate || isNaN(eventDate.getTime())) {
      console.error('Invalid event date:', event.eventDate);
      return null;
    }
    
    // 從 eventTime 取得台北時間的小時分鐘
    // @ts-ignore - eventTime 存在於 schema 但型別推導可能缺失
    const eventTime = (event as any).eventTime;
    const [startHour, startMin] = (eventTime?.split(' - ')[0] || '19:30').split(':').map(Number);
    const [endHour, endMin] = (eventTime?.split(' - ')[1] || '21:00').split(':').map(Number);
    
    // 建立台北時間的開始與結束時間
    const year = eventDate.getFullYear();
    const month = eventDate.getMonth();
    const day = eventDate.getDate();
    
    // 建立台北時間（CST = UTC+8）
    const startLocal = new Date(year, month, day, startHour, startMin, 0);
    const endLocal = new Date(year, month, day, endHour, endMin, 0);
    
    // 轉換為 UTC 時間（減 8 小時）
    const startUTC = new Date(startLocal.getTime() - 8 * 60 * 60 * 1000);
    const endUTC = new Date(endLocal.getTime() - 8 * 60 * 60 * 1000);
    
    // 格式化為 Google Calendar 需要的格式: YYYYMMDDTHHmmssZ
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const title = encodeURIComponent(event.title);
    const details = encodeURIComponent(`您已成功報名此活動\n\n訂單編號：${orderData.orderNo}\n\n活動連結：https://ai-tw.manus.space/events/${event.slug}`);
    const location = encodeURIComponent(event.location || '線上活動');
    const dates = `${formatDate(startUTC)}/${formatDate(endUTC)}`;
    
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  const calendarUrl = generateGoogleCalendarUrl();

  // 取得推薦活動
  const { data: recommendedEvents, isLoading: eventsLoading } = trpc.events.getPublishedEvents.useQuery(
    { limit: 3 },
    { enabled: isSuccess }
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background py-12">
        <div className="container max-w-3xl">
          {/* 付款結果卡片 */}
          <Card className="mb-8">
            <CardHeader className="text-center pb-2">
              {isSuccess ? (
                <>
                  <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <CardTitle className="text-2xl text-green-600">付款成功！</CardTitle>
                  <CardDescription className="text-base mt-2">
                    感謝您的購買，我們已將確認信寄送至您的信箱
                  </CardDescription>
                </>
              ) : (
                <>
                  <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="h-10 w-10 text-red-600" />
                  </div>
                  <CardTitle className="text-2xl text-red-600">付款失敗</CardTitle>
                  <CardDescription className="text-base mt-2">
                    很抱歉，付款過程中發生問題，請稍後再試
                  </CardDescription>
                </>
              )}
            </CardHeader>
            <CardContent>
              {/* 訂單資訊 */}
              {orderNo && (
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <h3 className="font-medium mb-3">訂單資訊</h3>
                  {orderLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : orderData ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">訂單編號</span>
                        <span className="font-mono">{orderData.orderNo}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">課程名稱</span>
                        <span>{orderData.event?.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">付款金額</span>
                        <span className="font-medium">NT$ {orderData.finalAmount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">付款狀態</span>
                        <span className={isSuccess ? "text-green-600" : "text-red-600"}>
                          {isSuccess ? "已付款" : "付款失敗"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">訂單編號：{orderNo}</p>
                  )}
                </div>
              )}

              {/* 加入行事曆按鈕 */}
              {isSuccess && calendarUrl && (
                <div className="mb-6">
                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700">
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      加入 Google 行事曆
                    </Button>
                  </a>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    點擊上方按鈕，將活動加入您的 Google 行事曆
                  </p>
                </div>
              )}

              {/* 操作按鈕 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/events" className="flex-1">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    返回活動列表
                  </Button>
                </Link>
                {isSuccess && orderData?.event?.slug && (
                  <Link href={`/events/${orderData.event.slug}`} className="flex-1">
                    <Button className="w-full">
                      查看課程詳情
                    </Button>
                  </Link>
                )}
                {!isSuccess && (
                  <Link href={orderData?.event?.slug ? `/events/${orderData.event.slug}` : "/events"} className="flex-1">
                    <Button className="w-full">
                      重新購買
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 推薦活動 */}
          {isSuccess && recommendedEvents && recommendedEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">您可能也會喜歡</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recommendedEvents
                  .filter(event => event.slug !== orderData?.event?.slug)
                  .slice(0, 3)
                  .map((event) => (
                    <Link key={event.id} href={`/events/${event.slug}`}>
                      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                        {event.coverImage && (
                          <div className="aspect-video overflow-hidden rounded-t-lg">
                            <img
                              src={event.coverImage}
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base line-clamp-2">{event.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {event.eventDate
                                ? new Date(event.eventDate).toLocaleDateString("zh-TW")
                                : "日期待定"}
                            </span>
                          </div>
                          <div className="mt-2 font-medium text-primary">
                            NT$ {event.price?.toLocaleString()}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
