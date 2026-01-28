import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { BNIEventRegistrationForm } from "@/components/BNIEventRegistrationForm";
import { RecommendedEvents } from "@/components/RecommendedEvents";
import { RecommendedPosts } from "@/components/RecommendedPosts";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function BNIEventPage() {
  const { slug } = useParams<{ slug: string }>();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const { data: event, isLoading, error } = trpc.events.getEventBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16">
          <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
            <div className="h-12 bg-muted rounded"></div>
            <div className="h-6 bg-muted rounded w-1/2"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container py-16">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h1 className="text-3xl font-bold">活動不存在</h1>
            <p className="text-muted-foreground">找不到您要查看的活動</p>
            <Button asChild>
              <Link href="/events">返回活動列表</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Parse highlights and targetAudience - handle both JSON array and plain text
  const parseField = (field: string | null) => {
    if (!field) return [];
    
    // Check if it looks like JSON (starts with [ or {)
    const trimmed = field.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [field];
      } catch {
        // If JSON parsing fails, fall through to plain text handling
      }
    }
    
    // Treat as plain text - split by semicolon or any newline format (\n, \r\n, \r)
    return field.split(/[;\r\n]+/).map(line => line.trim()).filter(line => line);
  };

  const highlights = parseField(event.highlights);
  const targetAudience = parseField(event.targetAudience);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-20">
          <div className="container">
            <div className="max-w-4xl mx-auto space-y-6">
              <Button variant="ghost" size="sm" asChild className="text-white hover:bg-white/20">
                <Link href="/events" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  返回活動列表
                </Link>
              </Button>

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  {event.title}
                </h1>
                {event.subtitle && (
                  <p className="text-xl md:text-2xl text-blue-100">
                    {event.subtitle}
                  </p>
                )}
              </div>

              {/* Event Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <Card className="bg-white/10 border-white/20 text-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-blue-200" />
                      <div>
                        <p className="text-sm text-blue-200">活動日期</p>
                        <p className="font-semibold">
                          {format(new Date(event.eventDate), "yyyy年MM月dd日 (E)", { locale: zhTW })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {event.eventTime && (
                  <Card className="bg-white/10 border-white/20 text-white">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-blue-200" />
                        <div>
                          <p className="text-sm text-blue-200">活動時間</p>
                          <p className="font-semibold">{event.eventTime}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-white/10 border-white/20 text-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-blue-200" />
                      <div>
                        <p className="text-sm text-blue-200">活動地點</p>
                        <p className="font-semibold">{event.location}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/10 border-white/20 text-white">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-200" />
                      <div>
                        <p className="text-sm text-blue-200">場地費用</p>
                        <p className="font-semibold">
                          {event.price === 0 ? "免費參加" : `場地費均攤 NT$ ${event.price.toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Target Audience */}
              {targetAudience.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  <span className="text-blue-200">對象：</span>
                  {targetAudience.map((audience: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-white/20 text-white border-white/30">
                      {audience}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Speaker Section */}
        {event.speakerInfo && (
          <section className="container py-16">
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">關於講師</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-lg max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: event.speakerInfo.replace(/\n/g, '<br/>') }} />
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Location Map Section */}
        <section className="container py-16">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary" />
                  活動地點
                </CardTitle>
                <CardDescription className="text-lg">
                  {event.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.locationDetails && (
                  <p className="text-muted-foreground">{event.locationDetails}</p>
                )}
                <div className="aspect-video w-full rounded-lg overflow-hidden border">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.3315!2d121.5340!3d25.0630!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDAzJzQ2LjgiTiAxMjHCsDMyJzAyLjQiRQ!5e0!3m2!1szh-TW!2stw!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="活動地點地圖"
                  ></iframe>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.locationDetails || event.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      在 Google Maps 中開啟
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Course Highlights */}
        {highlights.length > 0 && (
          <section className="bg-muted/30 py-16">
            <div className="container">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4">這堂課，我們不談空泛理論，只教你怎麼用！</h2>
                  <p className="text-lg text-muted-foreground">
                    本次課程將帶領大家深度體驗 Google Gemini 與 NotebookLM 的強大生態系，<br />
                    鎖定「業務銷售」場景，讓 AI 成為你的超級助理。
                  </p>
                </div>

                {/* Image mapping for each highlight */}
                {(() => {
                  // 圖片對應到第 1-4 項（跳過第 0 項標題）
                  const stepImages = [
                    "https://files.manuscdn.com/user_upload_by_module/session_file/95179607/tSDntSDHVhKGgNSL.png", // 1. 內容煉金術
                    "https://files.manuscdn.com/user_upload_by_module/session_file/95179607/vnxZmnzqkKWvSKTa.png", // 2. 流量誘餌製作
                    "https://files.manuscdn.com/user_upload_by_module/session_file/95179607/tcVHBEcydkWpKDEs.png", // 3. 私域流量收網
                    "https://files.manuscdn.com/user_upload_by_module/session_file/95179607/DVYqsewKjEBfgpIg.png"  // 4. 電子報信任堆疊
                  ];

                  return (
                    <div className="space-y-12">
                      {highlights.map((highlight: string, index: number) => {
                        // 第 0 項是標題，從第 1 項開始才顯示圖片
                        const imageUrl = index > 0 ? stepImages[index - 1] : null;
                        
                        return (
                          <div key={index} className="space-y-4">
                            <Card className="border-2 hover:border-primary transition-colors">
                              <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                  <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                      <Sparkles className="h-5 w-5 text-primary" />
                                    </div>
                                  </div>
                                  <p className="text-lg font-semibold">{highlight}</p>
                                </div>
                              </CardContent>
                            </Card>
                            {imageUrl && (
                              <div className="rounded-lg overflow-hidden border-2 shadow-lg">
                                <img
                                  src={imageUrl}
                                  alt={`${highlight} 示意圖`}
                                  className="w-full h-auto"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>
        )}

        {/* Why Attend Section */}
        <section className="container py-16">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl">為什麼 BNI 夥伴必須參加？</CardTitle>
                <CardDescription className="text-lg">提升你的「專業別」競爭力</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-lg">
                    在 BNI 強調「付出者收穫」的環境中，運用 AI 提升服務效率，讓你更有餘裕協助夥伴
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-lg">
                    透過 AI 工具優化你的業務簡報（Feature Presentation），讓夥伴更清楚如何引薦給你
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-lg">
                    實際案例分享：如何用 AI 解決業務開發遇到的痛點
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Registration Form Section */}
        <section id="registration" className="bg-gradient-to-br from-primary/5 to-purple-50 dark:from-primary/10 dark:to-purple-950/20 py-16">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-center">
                    {event.maxAttendees && event.registrationCount >= event.maxAttendees
                      ? "報名已額滿"
                      : "立即報名搶佔席位"
                    }
                  </CardTitle>
                  <CardDescription className="text-center">
                    {event.maxAttendees && event.registrationCount >= event.maxAttendees ? (
                      <span className="text-destructive font-semibold">
                        很抱歉，本活動已額滿，歡迎關注其他活動
                      </span>
                    ) : (
                      <>
                        填寫以下資訊完成報名，我們將透過 Email 與您聯繫
                        {event.maxAttendees && (
                          <div className="mt-2">
                            <Badge variant="secondary" className="text-sm">
                              剩餘名額：{event.maxAttendees - event.registrationCount} / {event.maxAttendees}
                            </Badge>
                          </div>
                        )}
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {event.maxAttendees && event.registrationCount >= event.maxAttendees ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        感謝您的關注，此活動已達報名人數上限。
                      </p>
                      <Button asChild>
                        <Link href="/events">查看其他活動</Link>
                      </Button>
                    </div>
                  ) : (
                    <BNIEventRegistrationForm
                      eventId={event.id}
                      onSuccess={() => setShowSuccessDialog(true)}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Recommended Events Section */}
        <section className="py-16 bg-background">
          <div className="container">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">推薦其他課程</h2>
                <p className="text-muted-foreground">探索更多 AI 實戰課程，持續提升您的技能</p>
              </div>
              <RecommendedEvents currentEventId={event.id} />
            </div>
          </div>
        </section>

        {/* Recommended Posts Section */}
        <section className="py-16 bg-muted/30">
          <div className="container">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">推薦相關文章</h2>
                <p className="text-muted-foreground">閱讀更多 AI 應用與技巧分享</p>
              </div>
              <RecommendedPosts category="AI工具" limit={3} />
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              報名成功！
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-4">
              <p>感謝您報名參加「{event.title}」！</p>
              <p>我們已將確認信發送至您的電子信箱，請留意查收。</p>
              <p>如有任何問題，歡迎隨時與我們聯繫。</p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowSuccessDialog(false)}>
              關閉
            </Button>
            <Button asChild>
              <Link href="/events">查看更多活動</Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
