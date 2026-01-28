import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Star, Users, Clock, PlayCircle, CheckCircle, ChevronDown, ChevronUp, Tag, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [promoCode, setPromoCode] = useState("");
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: course, isLoading } = trpc.videoCourses.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  const { data: reviews } = trpc.videoCourses.getReviews.useQuery(
    { courseId: course?.id || 0 },
    { enabled: !!course?.id }
  );

  const { data: hasPurchased } = trpc.videoCourses.checkPurchase.useQuery(
    { courseId: course?.id || 0 },
    { enabled: !!course?.id && !!user }
  );

  const createPurchaseMutation = trpc.videoCourses.createPurchase.useMutation({
    onSuccess: (data) => {
      // Redirect to payment page
      toast.success("訂單建立成功，正在跳轉至付款頁面...");
      // TODO: Integrate with Newebpay
      navigate(`/payment/video-course/${data.orderNo}`);
    },
    onError: (error) => {
      toast.error(error.message);
      setIsProcessing(false);
    },
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} 小時 ${minutes} 分鐘`;
    }
    return `${minutes} 分鐘`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatRating = (rating: number) => {
    return (rating / 10).toFixed(1);
  };

  const handlePurchase = async () => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }

    if (!course) return;

    setIsProcessing(true);
    createPurchaseMutation.mutate({
      courseId: course.id,
      promoCode: promoCode || undefined,
    });
  };

  const handleGoToLearning = () => {
    if (course) {
      navigate(`/learning/${course.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-background py-8">
          <div className="container">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="aspect-video w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
              <div>
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">找不到課程</h1>
            <Link href="/courses">
              <Button>返回課程列表</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const highlights = course.highlights ? JSON.parse(course.highlights) : [];
  const targetAudience = course.targetAudience ? JSON.parse(course.targetAudience) : [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-12">
          <div className="container">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <Badge variant="secondary" className="mb-2">
                  🎬 錄播課程
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold">{course.title}</h1>
                {course.subtitle && (
                  <p className="text-lg text-slate-300">{course.subtitle}</p>
                )}
                
                {/* Stats */}
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {course.reviewCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{formatRating(course.rating)}</span>
                      <span className="text-slate-400">({course.reviewCount} 則評價)</span>
                    </div>
                  )}
                  {course.studentCount > 0 && (
                    <div className="flex items-center gap-1 text-slate-300">
                      <Users className="h-4 w-4" />
                      <span>{course.studentCount} 位學員</span>
                    </div>
                  )}
                  {course.videoDuration && (
                    <div className="flex items-center gap-1 text-slate-300">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(course.videoDuration)}</span>
                    </div>
                  )}
                </div>

                {/* Instructor */}
                <div className="flex items-center gap-3 pt-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary text-primary-foreground">峰</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">黃敬峰（阿峰老師）</p>
                    <p className="text-sm text-slate-400">台灣企業 AI 職場實戰專家</p>
                  </div>
                </div>
              </div>

              {/* Preview Video or Cover */}
              <div className="lg:col-span-1">
                {course.previewVideoUrl ? (
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <iframe
                      src={course.previewVideoUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : course.coverImage ? (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img
                      src={course.coverImage}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-slate-700 flex items-center justify-center">
                    <PlayCircle className="h-16 w-16 text-slate-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="container">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left: Course Details */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle>課程介紹</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-slate max-w-none">
                      <p className="whitespace-pre-wrap">{course.description}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Highlights */}
                {highlights.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>你將學到</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-3">
                        {highlights.map((item: string, index: number) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Target Audience */}
                {targetAudience.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>適合對象</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {targetAudience.map((item: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Instructor */}
                <Card>
                  <CardHeader>
                    <CardTitle>講師介紹</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xl">峰</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold">黃敬峰（阿峰老師）</h3>
                        <p className="text-muted-foreground mb-3">台灣企業 AI 職場實戰專家</p>
                        <p className="text-sm">
                          專注於企業 AI 職場實戰培訓，協助團隊建立可複用的 AI 工作流，
                          提升工作效率與競爭力。累積超過 100 場企業內訓經驗，
                          服務客戶涵蓋科技、金融、製造等多元產業。
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews */}
                {reviews && reviews.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        學員評價
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {reviews.map((item) => (
                        <div key={item.review.id} className="border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {item.user?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{item.user?.name || "匿名用戶"}</p>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${
                                      star <= item.review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          {item.review.content && (
                            <p className="text-sm text-muted-foreground">{item.review.content}</p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* FAQ */}
                <Card>
                  <CardHeader>
                    <CardTitle>常見問題</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>購買後可以觀看多久？</AccordionTrigger>
                        <AccordionContent>
                          購買後即可永久觀看，沒有時間限制，可以無限次數複習。
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger>課程有提供講義嗎？</AccordionTrigger>
                        <AccordionContent>
                          有的，課程內含簡報講義，可以在課程觀看頁面中檢視（不提供下載）。
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                        <AccordionTrigger>可以在手機上觀看嗎？</AccordionTrigger>
                        <AccordionContent>
                          可以，課程支援電腦、平板、手機等各種裝置觀看。
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-4">
                        <AccordionTrigger>有問題可以詢問老師嗎？</AccordionTrigger>
                        <AccordionContent>
                          購買課程後可以加入專屬學員群組，在群組中提問，老師會親自解答。
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-5">
                        <AccordionTrigger>可以退款嗎？</AccordionTrigger>
                        <AccordionContent>
                          由於數位商品的特性，購買後恕不退款，請確認課程內容符合您的需求後再購買。
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Purchase Card (Sticky) */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <Card className="shadow-lg">
                    <CardContent className="p-6 space-y-4">
                      {/* Price */}
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-primary">
                            {formatPrice(course.price)}
                          </span>
                          {course.originalPrice && course.originalPrice > course.price && (
                            <span className="text-lg text-muted-foreground line-through">
                              {formatPrice(course.originalPrice)}
                            </span>
                          )}
                        </div>
                        {course.originalPrice && course.originalPrice > course.price && (
                          <Badge variant="destructive">
                            省下 {formatPrice(course.originalPrice - course.price)}
                          </Badge>
                        )}
                      </div>

                      <Separator />

                      {/* Promo Code */}
                      {!hasPurchased && (
                        <div className="space-y-2">
                          {!showPromoInput ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-muted-foreground"
                              onClick={() => setShowPromoInput(true)}
                            >
                              <Tag className="h-4 w-4 mr-2" />
                              輸入優惠代碼
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Input
                                placeholder="優惠代碼"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                className="flex-1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setShowPromoInput(false);
                                  setPromoCode("");
                                }}
                              >
                                取消
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Purchase Button */}
                      {hasPurchased ? (
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={handleGoToLearning}
                        >
                          <PlayCircle className="mr-2 h-5 w-5" />
                          開始學習
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          size="lg"
                          onClick={handlePurchase}
                          disabled={isProcessing}
                        >
                          {isProcessing ? "處理中..." : user ? "立即購買" : "登入後購買"}
                        </Button>
                      )}

                      {/* Features */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>永久觀看權限</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>內含簡報講義</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>加入學員專屬群組</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>課程筆記功能</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
