import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Home, FileText, FolderOpen, Tag, LogOut, Users, Calendar, ClipboardList, PlayCircle, ShoppingCart, BarChart3, Ticket, GraduationCap, Receipt, Bell, CalendarDays, Settings2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, loading, isAuthenticated } = useAuth();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    toast.success("已登出");
    setLocation("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">需要登入</h2>
          <p className="text-muted-foreground">請先登入以訪問後台管理</p>
          <Button asChild>
            <a href={getLoginUrl()}>登入</a>
          </Button>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">權限不足</h2>
          <p className="text-muted-foreground">您沒有權限訪問後台管理</p>
          <Button asChild>
            <Link href="/">
              <a>返回首頁</a>
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "儀表板", href: "/admin", icon: Home },
    { name: "文章管理", href: "/admin/posts", icon: FileText },
    { name: "分類與標籤", href: "/admin/categories", icon: FolderOpen },
    { name: "活動管理", href: "/admin/events", icon: Calendar },
    { name: "報名管理", href: "/admin/registrations", icon: ClipboardList },
    { name: "活動報名管理", href: "/admin/event-registrations", icon: Users },
    { name: "2026 課程報名", href: "/admin/course2026-registrations", icon: GraduationCap },
    { name: "每日課程名單", href: "/admin/course2026-roster", icon: CalendarDays },
    { name: "課程場次管理", href: "/admin/course2026-sessions", icon: Settings2 },
    { name: "付款記錄", href: "/admin/payment-records", icon: Receipt },
    { name: "錄播課程", href: "/admin/video-courses", icon: PlayCircle },
    { name: "課程訂單", href: "/admin/video-purchases", icon: ShoppingCart },
    { name: "課程營收", href: "/admin/video-dashboard", icon: BarChart3 },
    { name: "聯絡人管理", href: "/admin/contacts", icon: Users },
    { name: "優惠代碼", href: "/admin/promo-codes", icon: Ticket },
    { name: "通知管理", href: "/admin/notifications", icon: Bell },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-6 border-b">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border-2 border-primary">
              <span className="text-lg font-bold text-primary">AI</span>
            </div>
            <span className="font-bold text-foreground">後台管理</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link href="/" className="flex items-center gap-3">
              <Home className="h-5 w-5" />
              返回網站
            </Link>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="h-5 w-5 mr-3" />
            登出
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container py-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
