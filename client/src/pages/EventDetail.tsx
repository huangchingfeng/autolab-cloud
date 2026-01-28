import { useState } from "react";
import { useParams, Link } from "wouter";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Calendar, MapPin, Users, Clock, ArrowLeft, CheckCircle2, User, Sparkles, ExternalLink } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { EventFAQ, NOTEBOOKLM_FAQS } from "@/components/EventFAQ";
import { CourseGallery, notebookLMCourseImages, studentWorksImages } from "@/components/CourseGallery";
import { PaymentForm } from "@/components/PaymentForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SeoHead } from "@/components/SeoHead";
import { JsonLdSchema } from "@/components/JsonLdSchema";
import Header from "@/components/Header";
import Footer from "@/components/Footer";



export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();
  
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: event, isLoading, error } = trpc.events.getEventBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  // Event Schema
  const eventSchema = event ? {
    type: 'Event' as const,
    name: event.title,
    description: event.description || event.title,
    startDate: new Date(event.eventDate).toISOString(),
    endDate: event.eventEndDate ? new Date(event.eventEndDate).toISOString() : undefined,
    location: event.location ? {
      '@type': event.location.includes('線上') ? 'VirtualLocation' as const : 'Place' as const,
      name: event.location,
      address: event.location.includes('線上') ? undefined : event.location,
      url: event.location.includes('線上') ? `https://ai-tw.manus.space/events/${event.slug}` : undefined,
    } : undefined,
    image: event.coverImage || undefined,
    organizer: {
      '@type': 'Person' as const,
      name: '黃敬峰',
      url: 'https://ai-tw.manus.space',
    },
    offers: event.price ? {
      '@type': 'Offer' as const,
      price: event.price.toString(),
      priceCurrency: 'TWD',
      availability: 'https://schema.org/InStock',
      url: `https://ai-tw.manus.space/events/${event.slug}`,
    } : undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: event.location?.includes('線上') ? 'https://schema.org/OnlineEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode',
  } : null;

  const registerMutation = trpc.events.register.useMutation({
    onSuccess: () => {
      setShowSuccessDialog(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        jobTitle: "",
        referralSource: "",
        bniChapter: "",
      });
    },
    onError: (error) => {
      toast.error(`報名失敗：${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    referralSource: "",
    bniChapter: "",
  });

  const formatDate = (date: Date | string) => {
    // Handle both Date objects and string dates from database
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '日期格式錯誤';
    }
    
    // Use UTC to avoid timezone conversion issues
    // Database stores Taiwan time (UTC+8) as UTC, so we need to display it correctly
    return dateObj.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      timeZone: 'Asia/Taipei',
    });
  };

  const isUpcoming = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return false;
    }
    
    // If event has eventTime, calculate the end time
    if (event?.eventTime) {
      try {
        // Parse eventTime format: "19:30-21:00" or "19:30 - 21:00"
        const timeMatch = event.eventTime.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const [, , , endHour, endMin] = timeMatch;
          
          // Create end time using event date + end time
          const year = dateObj.getFullYear();
          const month = dateObj.getMonth();
          const day = dateObj.getDate();
          const endTime = new Date(year, month, day, parseInt(endHour), parseInt(endMin), 0);
          
          // Event is upcoming if end time is in the future
          return endTime > new Date();
        }
      } catch (error) {
        console.error('Error parsing eventTime:', error);
      }
    }
    
    // Fallback: compare event date
    return dateObj > new Date();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!event) return;

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("請填寫必填欄位：姓名、Email、電話");
      return;
    }

    if (!formData.company || !formData.jobTitle) {
      toast.error("請填寫必填欄位：公司與職稱");
      return;
    }

    registerMutation.mutate({
      eventId: event.id,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      jobTitle: formData.jobTitle,
      referralSource: formData.referralSource || undefined,
      bniChapter: formData.bniChapter || undefined,
    });
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-4xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-64 w-full rounded-lg mb-8" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-4xl text-center">
          <div className="text-6xl mb-4">😢</div>
          <h1 className="text-2xl font-bold mb-4">找不到此活動</h1>
          <p className="text-muted-foreground mb-6">活動可能已結束或連結錯誤</p>
          <Link href="/events">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回活動列表
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Safe parse function - handle both JSON array and plain text
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
    
    // Treat as plain text - split by semicolon or newline
    return field.split(/[;\n]/).map(line => line.trim()).filter(line => line);
  };

  const highlights = parseField(event.highlights);
  const targetAudience = parseField(event.targetAudience);
  const images = parseField(event.images);

  return (
    <>
      {event && (
        <>
          <SeoHead
            title={`${event.title} | AI峰哥`}
            description={event.description || event.title}
            ogImage={event.coverImage || undefined}
            canonicalUrl={`https://ai-tw.manus.space/events/${event.slug}`}
          />
          {eventSchema && <JsonLdSchema data={eventSchema} />}
        </>
      )}
      <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="container pt-6">
        <Link href="/events">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回活動列表
          </Button>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="py-8">
        <div className="container max-w-4xl">
          {event.coverImage && (
            <div className="relative rounded-xl overflow-hidden mb-8 aspect-video">
              <img
                src={event.coverImage}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                {isUpcoming(event.eventDate) ? (
                  <Badge className="bg-green-500 hover:bg-green-600 mb-2">即將舉行</Badge>
                ) : (
                  <Badge variant="secondary" className="mb-2">已結束</Badge>
                )}
                {event.price === 0 && (
                  <Badge variant="destructive" className="ml-2 mb-2">免費</Badge>
                )}
              </div>
            </div>
          )}

          <h1 className="text-3xl md:text-4xl font-bold mb-4">{event.title}</h1>
          {event.subtitle && (
            <p className="text-xl text-muted-foreground mb-6">{event.subtitle}</p>
          )}
          
          {/* 標籤顯示 */}
          {event.tags && (() => {
            try {
              const tags = JSON.parse(event.tags as string);
              if (Array.isArray(tags) && tags.length > 0) {
                return (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                );
              }
            } catch (e) {
              // 如果解析失敗，不顯示標籤
            }
            return null;
          })()}

          {/* Countdown Timer for all upcoming events */}
          {isUpcoming(event.eventDate) && (
            <div className="mb-8">
              <CountdownTimer targetDate={event.eventDate} title="距離活動開始" />
            </div>
          )}

          {/* Event Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <span className="text-xs text-muted-foreground block">日期</span>
                  <span className="font-medium text-sm block">{formatDate(event.eventDate)}</span>
                </div>
              </CardContent>
            </Card>
            {event.eventTime && (
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <span className="text-xs text-muted-foreground block">時間</span>
                    <span className="font-medium text-sm block">{event.eventTime}</span>
                  </div>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <span className="text-xs text-muted-foreground block">地點</span>
                  <span className="font-medium text-sm block">{event.location}</span>
                </div>
              </CardContent>
            </Card>
            {event.registrationCount > 20 && (
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <span className="text-xs text-muted-foreground block">已報名</span>
                  <span className="font-medium text-sm block">{event.registrationCount} 人</span>
                </div>
              </CardContent>
            </Card>
            )}
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-8">
        <div className="container max-w-4xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* YouTube Video */}
              {event.videoUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle>活動影片</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src={event.videoUrl}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>活動簡介</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {event.description}
                  </div>
                </CardContent>
              </Card>

              {/* Image Gallery */}
              {images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>活動精選圖片</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {images.map((imageUrl: string, index: number) => (
                        <div 
                          key={index} 
                          className="aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer group relative"
                          onClick={() => {
                            setCurrentImageIndex(index);
                            setLightboxOpen(true);
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt={`活動圖片 ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">點擊放大</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Highlights */}
              {highlights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      精彩亮點
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {highlights.map((highlight: string, index: number) => {
                        // BNI 活動的圖片穿插邏輯：第 0 項是標題，從第 1 項開始才顯示圖片
                        const isBNIEvent = event.slug?.includes('bni');
                        const stepImages = [
                          "https://files.manuscdn.com/user_upload_by_module/session_file/95179607/tSDntSDHVhKGgNSL.png", // 1. 內容煉金術
                          "https://files.manuscdn.com/user_upload_by_module/session_file/95179607/vnxZmnzqkKWvSKTa.png", // 2. 流量誘餌製作
                          "https://files.manuscdn.com/user_upload_by_module/session_file/95179607/tcVHBEcydkWpKDEs.png", // 3. 私域流量收網
                          "https://files.manuscdn.com/user_upload_by_module/session_file/95179607/DVYqsewKjEBfgpIg.png"  // 4. 電子報信任堆疊
                        ];
                        const imageUrl = isBNIEvent && index > 0 ? stepImages[index - 1] : null;

                        return (
                          <div key={index} className="space-y-3">
                            <div className="flex items-start gap-3">
                              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{highlight}</span>
                            </div>
                            {imageUrl && (
                              <div className="rounded-lg overflow-hidden border-2 shadow-lg ml-8">
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
                  </CardContent>
                </Card>
              )}

              {/* Target Audience */}
              {targetAudience.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      適合對象
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {targetAudience.map((audience: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span>{audience}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Speaker Info */}
              {event.speakerInfo && (
                <Card>
                  <CardHeader>
                    <CardTitle>講師介紹</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {event.speakerInfo}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Registration Invitation - Conditional based on event */}
              {event.slug.includes('notebooklm') ? (
                <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5 text-blue-600" />
                      參加課程前先註冊 NotebookLM
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      本課程將實戰示範 Google NotebookLM 的強大功能！建議您先註冊帳號，以便在課程中同步操作練習。
                    </p>
                    <div className="bg-background/80 p-4 rounded-lg border border-blue-500/20">
                      <p className="text-sm font-medium text-blue-600 mb-2">📝 NotebookLM 是免費使用的！</p>
                      <p className="text-xs text-muted-foreground">只需要 Google 帳號即可註冊，無需付費。</p>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                      <a
                        href="https://notebooklm.google/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        前往註冊 NotebookLM →
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      參加活動前先註冊 Manus
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      本次活動將實戰示範 Manus AI 的強大功能！建議您先註冊帳號，以便在活動中同步體驗。
                    </p>
                    <div className="bg-background/80 p-4 rounded-lg border border-primary/20">
                      <p className="text-sm font-medium text-primary mb-2">🎁 透過阿峰老師的連結註冊，可額外獲得 500 點！</p>
                      <p className="text-xs text-muted-foreground">這些點數可用於 Manus AI 的各項功能，讓您更快上手。</p>
                    </div>
                    <Button className="w-full" asChild>
                      <a
                        href="https://manus.im/invitation/QNJFK5RPPE9B"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        立即註冊 Manus →
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Course Gallery for NotebookLM course */}
              {event.slug.includes('notebooklm') && (
                <div className="-mx-4 md:-mx-8 lg:-mx-12">
                  <CourseGallery 
                    images={notebookLMCourseImages} 
                    title="課程內容預覽" 
                  />
                </div>
              )}

              {/* Student Works Gallery for NotebookLM course */}
              {event.slug.includes('notebooklm') && (
                <div className="-mx-4 md:-mx-8 lg:-mx-12">
                  <CourseGallery 
                    images={studentWorksImages} 
                    title="🏆 學員成果展示" 
                  />
                </div>
              )}

              {/* FAQ Section for NotebookLM course */}
              {event.slug.includes('notebooklm') && (
                <EventFAQ faqs={NOTEBOOKLM_FAQS} title="常見問題" />
              )}
            </div>

            {/* Registration Form */}
            <div className="lg:col-span-1">
              {/* 如果有外部報名連結，顯示導向按鈕 */}
              {event.externalRegistrationUrl ? (
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle>立即報名</CardTitle>
                    <CardDescription>
                      {event.price === 0 ? "免費活動" : `費用：NT$ ${event.price.toLocaleString()}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        本課程透過 Accupass 活動通報名，點擊下方按鈕前往報名頁面。
                      </p>
                      <Button
                        className="w-full"
                        size="lg"
                        asChild
                      >
                        <a
                          href={event.externalRegistrationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          🎟️ 前往 Accupass 報名
                        </a>
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        將在新視窗開啟 Accupass 報名頁面
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : event.price > 0 && isUpcoming(event.eventDate) ? (
                /* 付費課程使用 PaymentForm */
                <PaymentForm
                  eventId={event.id}
                  eventTitle={event.title}
                  eventSlug={event.slug}
                  originalPrice={event.price}
                />
              ) : (
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle>立即報名</CardTitle>
                    <CardDescription>
                      {event.price === 0 ? "免費活動" : `費用：NT$ ${event.price.toLocaleString()}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* 檢查報名開放狀態、報名截止日期和活動時間 */}
                    {event.registrationEnabled !== false && 
                     (!event.registrationDeadline || new Date(event.registrationDeadline) > new Date()) &&
                     isUpcoming(event.eventDate) ? (
                    <>
                      {/* BNI 夥伴限定說明 */}
                      {event.slug === 'bni-ai-workshop-2026-01' && (
                        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                          <p className="text-sm text-amber-900 dark:text-amber-100">
                            <strong>⚠️ 報名限制：</strong>本課程僅限 BNI 夥伴報名，阿峰老師保有課程最終解釋權。
                          </p>
                        </div>
                      )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">姓名 *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="請輸入您的姓名"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="請輸入您的 Email"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">電話 *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="請輸入您的電話"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company">公司 *</Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder="請輸入您的公司名稱"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">職稱 *</Label>
                        <Input
                          id="jobTitle"
                          value={formData.jobTitle}
                          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                          placeholder="請輸入您的職稱"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="referralSource">如何得知此活動</Label>
                        <Input
                          id="referralSource"
                          value={formData.referralSource}
                          onChange={(e) => setFormData({ ...formData, referralSource: e.target.value })}
                          placeholder="例：阿峰老師、朋友推薦、Facebook 等"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bniChapter">BNI 分會</Label>
                        <Input
                          id="bniChapter"
                          value={formData.bniChapter}
                          onChange={(e) => setFormData({ ...formData, bniChapter: e.target.value })}
                          placeholder="例：台北中山分會、新北板橋分會等"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "報名中..." : "確認報名"}
                      </Button>
                    </form>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground mb-4">
                        {event.registrationEnabled === false 
                          ? "報名已關閉" 
                          : event.registrationDeadline && new Date(event.registrationDeadline) <= new Date()
                          ? "報名已截止"
                          : "此活動已結束"}
                      </p>
                      {event.registrationInfo && (
                        <div className="mb-4 p-3 bg-muted rounded-lg text-sm text-left">
                          <p className="whitespace-pre-wrap">{event.registrationInfo}</p>
                        </div>
                      )}
                      <Link href="/events">
                        <Button variant="outline" className="w-full">
                          查看其他活動
                        </Button>
                      </Link>
                    </div>
                  )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              報名成功！
            </DialogTitle>
            <DialogDescription asChild>
              <div className="pt-4 space-y-4">
                <p>
                  感謝您報名「{event.title}」！我們已經將確認信寄到您的信箱，請查收。
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="font-medium">活動資訊</p>
                  <p className="text-sm">📅 日期：{formatDate(event.eventDate)}</p>
                  {event.eventTime && <p className="text-sm">⏰ 時間：{event.eventTime}</p>}
                  {event.meetingUrl ? (
                    <p className="text-sm">📍 地點：<a href={event.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{event.meetingUrl}</a></p>
                  ) : (
                    <p className="text-sm">📍 地點：{event.location}</p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  請將活動加入您的行事曆，以免錯過！
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            {/* Manus Registration */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-3 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-primary mb-1">🎁 參加活動前先註冊 Manus，可額外獲得 500 點！</p>
              <p className="text-xs text-muted-foreground mb-2">透過阿峰老師的連結註冊，讓您在活動中同步體驗。</p>
              <Button className="w-full" size="sm" asChild>
                <a
                  href="https://manus.im/invitation/QNJFK5RPPE9B"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  立即註冊 Manus →
                </a>
              </Button>
            </div>
            <Button
              className="w-full"
              variant="outline"
              asChild
            >
              <a
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${(() => {
                  try {
                    // 從資料庫取得的 eventDate 是字串或 Date 物件
                    const eventDate = new Date(event.eventDate);
                    
                    // 檢查日期是否有效
                    if (isNaN(eventDate.getTime())) {
                      console.error('Invalid event date:', event.eventDate);
                      return '20260101T120000Z/20260101T130000Z'; // 預設值
                    }
                    
                    // 從 eventTime 取得台北時間的小時分鐘
                    // 預期格式："19:30 - 21:00" 或 "19:30-21:00"
                    const timeStr = event.eventTime || '19:30 - 21:00';
                    const timeParts = timeStr.split(/\s*-\s*/);
                    
                    if (timeParts.length !== 2) {
                      console.error('Invalid eventTime format:', event.eventTime);
                      return '20260101T120000Z/20260101T130000Z'; // 預設值
                    }
                    
                    const startTimeParts = timeParts[0].split(':').map(Number);
                    const endTimeParts = timeParts[1].split(':').map(Number);
                    
                    // 驗證時間部分是否為有效數字
                    if (startTimeParts.length !== 2 || endTimeParts.length !== 2 ||
                        startTimeParts.some(isNaN) || endTimeParts.some(isNaN)) {
                      console.error('Invalid time parts:', { startTimeParts, endTimeParts });
                      return '20260101T120000Z/20260101T130000Z'; // 預設值
                    }
                    
                    const [startHour, startMin] = startTimeParts;
                    const [endHour, endMin] = endTimeParts;
                    
                    // 建立台北時間的開始與結束時間
                    // 使用 eventDate 的年月日 + eventTime 的時分
                    const year = eventDate.getFullYear();
                    const month = eventDate.getMonth();
                    const day = eventDate.getDate();
                    
                    // 建立台北時間（CST = UTC+8）
                    const startLocal = new Date(year, month, day, startHour, startMin, 0);
                    const endLocal = new Date(year, month, day, endHour, endMin, 0);
                    
                    // 驗證建立的本地時間是否有效
                    if (isNaN(startLocal.getTime()) || isNaN(endLocal.getTime())) {
                      console.error('Invalid local time:', { startLocal, endLocal, year, month, day, startHour, startMin, endHour, endMin });
                      return '20260101T120000Z/20260101T130000Z'; // 預設值
                    }
                    
                    // 轉換為 UTC 時間（減 8 小時）
                    const startUTC = new Date(startLocal.getTime() - 8 * 60 * 60 * 1000);
                    const endUTC = new Date(endLocal.getTime() - 8 * 60 * 60 * 1000);
                    
                    // 檢查生成的 UTC 時間是否有效
                    if (isNaN(startUTC.getTime()) || isNaN(endUTC.getTime())) {
                      console.error('Invalid UTC time calculation:', { startUTC, endUTC });
                      return '20260101T120000Z/20260101T130000Z'; // 預設值
                    }
                    
                    // 格式化為 Google Calendar 需要的格式: YYYYMMDDTHHmmssZ
                    const formatGoogleDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
                    return formatGoogleDate(startUTC) + '/' + formatGoogleDate(endUTC);
                  } catch (error) {
                    console.error('Error generating Google Calendar URL:', error);
                    return '20260101T120000Z/20260101T130000Z'; // 預設值
                  }
                })()}&details=${encodeURIComponent(event.subtitle || '')}&location=${encodeURIComponent(event.meetingUrl || event.location)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                📅 加入 Google 行事曆
              </a>
            </Button>
            {/* LINE 分享按鈕 */}
            <Button
              variant="default"
              className="w-full bg-[#06C755] hover:bg-[#05B04C] text-white"
              onClick={() => {
                const shareUrl = `https://line.me/R/share?text=${encodeURIComponent(`我剛剛報名了「${event.title}」！\n\n${event.subtitle || ''}\n\n一起來參加吧！`)}%0A${encodeURIComponent(window.location.href)}`;
                window.open(shareUrl, '_blank');
              }}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              分享活動到 LINE
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowSuccessDialog(false)}
              >
                關閉
              </Button>
              <Button
                className="flex-1"
                asChild
              >
                <a
                  href="https://line.me/ti/g2/o6oRaGIHTzZ1nEofxnT9Rbv7_ZHAX-rylbJfKA"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  加入 AI 學員社群
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      {images.length > 0 && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
            <DialogTitle className="sr-only">活動圖片瀏覽</DialogTitle>
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>

              {/* Previous Button */}
              {images.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                  onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}

              {/* Image */}
              <div className="w-full h-full flex items-center justify-center p-8">
                <img
                  src={images[currentImageIndex]}
                  alt={`活動圖片 ${currentImageIndex + 1}`}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </div>

              {/* Next Button */}
              {images.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20"
                  onClick={() => setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>
    </>
  );
}
