import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { PlayCircle, BookOpen, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useEffect } from "react";

export default function LearningCenter() {
  const { user, loading } = useAuth();
  const { data: purchases, isLoading } = trpc.videoCourses.getMyPurchases.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = getLoginUrl();
    }
  }, [loading, user]);

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} 小時 ${minutes} 分鐘`;
    }
    return `${minutes} 分鐘`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">載入中...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background">
        {/* Hero Section */}
        <section className="py-12 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="container">
            <div className="flex items-center gap-4 mb-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">學習中心</h1>
            </div>
            <p className="text-muted-foreground">
              歡迎回來，{user.name || "學員"}！這裡是您已購買的所有課程。
            </p>
          </div>
        </section>

        {/* Courses List */}
        <section className="py-12">
          <div className="container">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-40 w-full" />
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : purchases && purchases.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {purchases.map(({ purchase, course }) => (
                  <Card key={purchase.id} className="overflow-hidden hover:shadow-lg transition-shadow group flex flex-col">
                    {/* Cover Image */}
                    <div className="relative h-40 overflow-hidden">
                      {course?.coverImage ? (
                        <img
                          src={course.coverImage}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <PlayCircle className="h-12 w-12 text-primary/50" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <PlayCircle className="h-16 w-16 text-white" />
                      </div>
                    </div>

                    <CardHeader className="flex-1">
                      <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                        {course?.title || "課程"}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-2">
                      {course?.videoDuration && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{formatDuration(course.videoDuration)}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        購買日期：{new Date(purchase.paidAt || purchase.createdAt).toLocaleDateString('zh-TW')}
                      </p>
                    </CardContent>

                    <CardFooter>
                      <Link href={`/learning/${course?.id}`} className="w-full">
                        <Button className="w-full group/btn">
                          <PlayCircle className="mr-2 h-4 w-4" />
                          開始學習
                          <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-2xl font-semibold mb-2">尚未購買任何課程</h3>
                <p className="text-muted-foreground mb-6">
                  瀏覽我們的課程，開始您的 AI 學習之旅！
                </p>
                <Button asChild>
                  <Link href="/courses">
                    探索課程
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
