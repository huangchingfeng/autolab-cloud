import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { CreditCard, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function VideoCoursePayment() {
  const { orderNo } = useParams<{ orderNo: string }>();
  const { user, loading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TODO: Fetch order details and integrate with Newebpay
  // For now, this is a placeholder page

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-background py-12">
        <div className="container max-w-lg">
          <Card>
            <CardHeader className="text-center">
              <CreditCard className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>付款處理中</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                訂單編號：{orderNo}
              </p>
              <p className="text-sm text-muted-foreground">
                正在準備付款頁面，請稍候...
              </p>
              <div className="flex justify-center gap-4 pt-4">
                <Link href="/courses">
                  <Button variant="outline">返回課程列表</Button>
                </Link>
                <Link href="/learning">
                  <Button>前往學習中心</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
