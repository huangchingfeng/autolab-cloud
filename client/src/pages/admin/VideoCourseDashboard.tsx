import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Users, BookOpen, TrendingUp } from "lucide-react";

export default function VideoCourseDashboard() {
  const { data: courses, isLoading: coursesLoading } = trpc.videoCourses.getAll.useQuery();
  const { data: purchases, isLoading: purchasesLoading } = trpc.videoCourses.getAllPurchases.useQuery();

  const isLoading = coursesLoading || purchasesLoading;

  // Calculate statistics
  const totalCourses = courses?.length || 0;
  const publishedCourses = courses?.filter(c => c.status === "published").length || 0;
  
  const paidPurchases = purchases?.filter(p => p.purchase.paymentStatus === "paid") || [];
  const totalRevenue = paidPurchases.reduce((sum, p) => sum + p.purchase.finalAmount, 0);
  const totalStudents = new Set(paidPurchases.map(p => p.purchase.userId)).size;
  const totalOrders = paidPurchases.length;

  // Recent purchases (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentPurchases = paidPurchases.filter(
    p => p.purchase.paidAt && new Date(p.purchase.paidAt) >= sevenDaysAgo
  );
  const recentRevenue = recentPurchases.reduce((sum, p) => sum + p.purchase.finalAmount, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon 
  }: { 
    title: string; 
    value: string | number; 
    subtitle?: string; 
    icon: React.ElementType;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">課程營收總覽</h1>
        <p className="text-muted-foreground">錄播課程銷售數據分析</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="總營收"
              value={formatPrice(totalRevenue)}
              subtitle={`近 7 天 ${formatPrice(recentRevenue)}`}
              icon={DollarSign}
            />
            <StatCard
              title="總學員數"
              value={totalStudents}
              subtitle={`${totalOrders} 筆訂單`}
              icon={Users}
            />
            <StatCard
              title="已發布課程"
              value={publishedCourses}
              subtitle={`共 ${totalCourses} 個課程`}
              icon={BookOpen}
            />
            <StatCard
              title="近 7 天訂單"
              value={recentPurchases.length}
              subtitle="筆新訂單"
              icon={TrendingUp}
            />
          </div>

          {/* Course Performance */}
          <Card>
            <CardHeader>
              <CardTitle>課程銷售排行</CardTitle>
            </CardHeader>
            <CardContent>
              {courses && courses.length > 0 ? (
                <div className="space-y-4">
                  {courses
                    .sort((a, b) => b.studentCount - a.studentCount)
                    .slice(0, 5)
                    .map((course, index) => {
                      const courseRevenue = paidPurchases
                        .filter(p => p.purchase.courseId === course.id)
                        .reduce((sum, p) => sum + p.purchase.finalAmount, 0);
                      
                      return (
                        <div key={course.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="text-2xl font-bold text-muted-foreground">
                              #{index + 1}
                            </span>
                            <div>
                              <p className="font-medium">{course.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {course.studentCount} 位學員
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatPrice(courseRevenue)}</p>
                            <p className="text-sm text-muted-foreground">
                              單價 {formatPrice(course.price)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  尚無課程數據
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>最近訂單</CardTitle>
            </CardHeader>
            <CardContent>
              {paidPurchases.length > 0 ? (
                <div className="space-y-4">
                  {paidPurchases
                    .sort((a, b) => 
                      new Date(b.purchase.paidAt || 0).getTime() - 
                      new Date(a.purchase.paidAt || 0).getTime()
                    )
                    .slice(0, 5)
                    .map(({ purchase, course, user }) => (
                      <div key={purchase.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{course?.title || "未知課程"}</p>
                          <p className="text-sm text-muted-foreground">
                            {user?.name || "未知用戶"} · {purchase.paidAt 
                              ? new Date(purchase.paidAt).toLocaleDateString('zh-TW')
                              : "-"}
                          </p>
                        </div>
                        <p className="font-medium text-green-600">
                          +{formatPrice(purchase.finalAmount)}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  尚無訂單數據
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
