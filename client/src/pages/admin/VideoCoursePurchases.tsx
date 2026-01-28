import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminVideoCoursePurchases() {
  const { data: purchases, isLoading } = trpc.videoCourses.getAllPurchases.useQuery();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">已付款</Badge>;
      case "pending":
        return <Badge variant="secondary">待付款</Badge>;
      case "failed":
        return <Badge variant="destructive">失敗</Badge>;
      case "refunded":
        return <Badge variant="outline">已退款</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">訂單管理</h1>
        <p className="text-muted-foreground">管理錄播課程的購買訂單</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>訂單列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : purchases && purchases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>訂單編號</TableHead>
                  <TableHead>課程</TableHead>
                  <TableHead>學員</TableHead>
                  <TableHead>金額</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>付款時間</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map(({ purchase, course, user }) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-mono text-sm">
                      {purchase.orderNo}
                    </TableCell>
                    <TableCell>{course?.title || "未知課程"}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user?.name || "未知用戶"}</p>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{formatPrice(purchase.finalAmount)}</p>
                        {purchase.discountAmount > 0 && (
                          <p className="text-sm text-green-600">
                            折扣 -{formatPrice(purchase.discountAmount)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(purchase.paymentStatus)}</TableCell>
                    <TableCell>
                      {purchase.paidAt
                        ? new Date(purchase.paidAt).toLocaleString('zh-TW')
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">尚無任何訂單</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
