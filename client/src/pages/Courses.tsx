import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Star, Users, Clock, PlayCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Courses() {
  const { data: courses, isLoading } = trpc.videoCourses.getPublished.useQuery();

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="secondary" className="mb-4">
                🎬 線上課程
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                阿峰老師的 AI 錄播課程
              </h1>
              <p className="text-xl text-muted-foreground">
                隨時隨地學習，無限次數複習，打造你的 AI 職場競爭力
              </p>
            </div>
          </div>
        </section>

        {/* Courses List */}
        <section className="py-16">
          <div className="container">
            {isLoading ? (
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
            ) : courses && courses.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
                    {/* Cover Image */}
                    <div className="relative h-48 overflow-hidden">
                      {course.coverImage ? (
                        <img
                          src={course.coverImage}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <PlayCircle className="h-16 w-16 text-primary/50" />
                        </div>
                      )}
                      {course.originalPrice && course.originalPrice > course.price && (
                        <Badge variant="destructive" className="absolute top-4 right-4">
                          {Math.round((1 - course.price / course.originalPrice) * 100)}% OFF
                        </Badge>
                      )}
                    </div>

                    <CardHeader className="flex-1">
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                        {course.title}
                      </CardTitle>
                      {course.subtitle && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {course.subtitle}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Rating & Students */}
                      <div className="flex items-center gap-4 text-sm">
                        {course.reviewCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-medium">{formatRating(course.rating)}</span>
                            <span className="text-muted-foreground">({course.reviewCount})</span>
                          </div>
                        )}
                        {course.studentCount > 0 && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{course.studentCount} 位學員</span>
                          </div>
                        )}
                      </div>

                      {/* Duration */}
                      {course.videoDuration && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(course.videoDuration)}</span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary">
                          {formatPrice(course.price)}
                        </span>
                        {course.originalPrice && course.originalPrice > course.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(course.originalPrice)}
                          </span>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Link href={`/courses/${course.slug}`} className="w-full">
                        <Button className="w-full group/btn">
                          查看課程
                          <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎬</div>
                <h3 className="text-2xl font-semibold mb-2">課程準備中</h3>
                <p className="text-muted-foreground mb-6">
                  阿峰老師正在精心準備錄播課程，敬請期待！
                </p>
                <Button asChild>
                  <Link href="/events">
                    查看直播課程
                  </Link>
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
  );
}
