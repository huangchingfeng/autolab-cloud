import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Calendar, MapPin, Users, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SeoHead } from "@/components/SeoHead";
import { JsonLdSchema } from "@/components/JsonLdSchema";

export default function Events() {
  const { data: events, isLoading, error } = trpc.events.getPublishedEvents.useQuery();

  const seoTitle = "活動課程 - AI 實戰培訓、ChatGPT 與 Gemini 公開講座 | 黃敬峰 AI峰哥";
  const seoDescription = "查看 AI峰哥（黃敬峰）的最新 AI 實戰課程與公開講座，包含 ChatGPT、Gemini、Midjourney 等工具教學，從基礎入門到進階應用，帶你快速掌握 AI 技能。";
  const seoKeywords = "AI課程, ChatGPT, Gemini, AI培訓, 公開講座, AI峰哥";

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
      timeZone: 'Asia/Taipei',
    });
  };

  const isUpcoming = (date: Date, eventTime?: string | null) => {
    const eventDate = new Date(date);
    
    // If event has eventTime, calculate the end time
    if (eventTime) {
      try {
        const timeMatch = eventTime.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
        if (timeMatch) {
          const [, , , endHour, endMin] = timeMatch;
          const year = eventDate.getFullYear();
          const month = eventDate.getMonth();
          const day = eventDate.getDate();
          const endTime = new Date(year, month, day, parseInt(endHour), parseInt(endMin), 0);
          return endTime > new Date();
        }
      } catch (error) {
        console.error('Error parsing eventTime:', error);
      }
    }
    
    // Fallback: compare event date
    return eventDate > new Date();
  };

  return (
    <>
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl="https://ai-tw.manus.space/events"
      />
      <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              🎯 活動與課程
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              阿峰老師的 AI 實戰課程
            </h1>
            <p className="text-xl text-muted-foreground">
              從理論到實戰，帶你掌握最新 AI 工具，提升職場競爭力
            </p>
          </div>
        </div>
      </section>

      {/* Events List */}
      <section className="py-16">
        <div className="container">
          {error ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-semibold mb-2 text-destructive">載入活動時發生錯誤</h3>
              <p className="text-muted-foreground mb-6">
                無法連線到資料庫，請稍後再試。如果問題持續，請聯繫我們。
              </p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => window.location.reload()} variant="outline">
                  重新整理頁面
                </Button>
                <Link href="/contact">
                  <Button>
                    聯絡我們
                  </Button>
                </Link>
              </div>
            </div>
          ) : isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                  {/* Cover Image */}
                  {event.coverImage && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={event.coverImage}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {isUpcoming(event.eventDate, event.eventTime) ? (
                        <Badge className="absolute top-4 left-4 bg-green-500 hover:bg-green-600">
                          即將舉行
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="absolute top-4 left-4">
                          已結束
                        </Badge>
                      )}
                      {event.price === 0 && (
                        <Badge variant="destructive" className="absolute top-4 right-4">
                          免費
                        </Badge>
                      )}
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </CardTitle>
                    {event.subtitle && (
                      <CardDescription className="line-clamp-2">
                        {event.subtitle}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(event.eventDate)}</span>
                    </div>
                    {event.eventTime && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{event.eventTime}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{event.location}</span>
                    </div>
                    {event.registrationCount > 20 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>已有 {event.registrationCount} 人報名</span>
                    </div>
                    )}
                  </CardContent>

                  <CardFooter>
                    <Link href={`/events/${event.slug}`} className="w-full">
                      <Button className="w-full group/btn">
                        {isUpcoming(event.eventDate) ? "立即報名" : "查看詳情"}
                        <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-semibold mb-2">目前沒有活動</h3>
              <p className="text-muted-foreground mb-6">
                請稍後再來查看，或加入我們的社群獲取最新活動通知
              </p>
              <Button asChild>
                <a
                  href="https://line.me/ti/g2/o6oRaGIHTzZ1nEofxnT9Rbv7_ZHAX-rylbJfKA"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  加入 AI 學員社群
                </a>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">想要客製化企業培訓？</h2>
            <p className="text-muted-foreground mb-6">
              阿峰老師提供企業內訓、1對1教學等客製化服務，歡迎聯繫我們討論您的需求
            </p>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                聯絡我們
              </Button>
            </Link>
          </div>
        </div>
      </section>
      </main>
      <Footer />
      </div>
    </>
  );
}
