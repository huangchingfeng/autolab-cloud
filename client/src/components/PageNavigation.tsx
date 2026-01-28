import { Link, useLocation } from "wouter";
import { Calendar, BookOpen, Award, MessageSquare, Home } from "lucide-react";

const navItems = [
  { href: "/", label: "首頁", icon: Home },
  { href: "/events", label: "活動課程", icon: Calendar },
  { href: "/blog", label: "部落格", icon: BookOpen },
  { href: "/testimonials", label: "客戶與見證", icon: Award },
  { href: "/contact", label: "聯繫我們", icon: MessageSquare },
];

interface PageNavigationProps {
  currentPath: string;
}

export default function PageNavigation({ currentPath }: PageNavigationProps) {
  return (
    <nav className="sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container">
        <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === currentPath;
            return (
              <Link key={item.href} href={item.href}>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
