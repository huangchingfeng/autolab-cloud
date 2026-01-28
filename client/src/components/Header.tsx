import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  const navItems = [
    { name: "關於阿峰老師", href: "/about" },
    { name: "企業內訓與顧問", href: "/corporate-training" },
    { 
      name: "公開課", 
      href: "/2026-ai-course",
      subItems: [
        { name: "2026 AI 實戰應用課(台北班)", href: "/2026-ai-course" },
        { name: "AI 業務飛輪實戰班", href: "/ai-business-flywheel" },
      ]
    },
    { name: "1對1教練", href: "/coaching" },
    { name: "教學主題與工具", href: "/topics" },
    { name: "提示詞庫", href: "/prompt-library" },
    { name: "客戶見證", href: "/clients" },
    { name: "部落格", href: "/blog" },
    { name: "活動課程", href: "/events" },
    { name: "錄播課程", href: "/courses" },
    { name: "學習中心", href: "/learning" },
    { name: "常見問題", href: "/faq" },
    { name: "聯繫我們", href: "/contact" },
  ];

  // 判斷是否為當前頁面
  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border-2 border-primary">
              <span className="text-lg font-bold text-primary">AI</span>
            </div>
            <span className="hidden font-bold sm:inline-block text-foreground">
              AI峰哥
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-6">
          {navItems.map((item) => {
            // 如果有子選單，使用 DropdownMenu
            if (item.subItems) {
              return (
                <DropdownMenu key={item.name}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                        isActive(item.href)
                          ? "text-primary font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.name}
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {item.subItems.map((subItem) => (
                      <DropdownMenuItem key={subItem.name} asChild>
                        <Link href={subItem.href}>
                          <span className="cursor-pointer w-full">{subItem.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            }

            // 一般連結
            return (
              <Link key={item.name} href={item.href}>
                <span
                  className={`text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                    isActive(item.href)
                      ? "text-primary font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <NotificationBell />
          <Button
            asChild
            className="hidden sm:inline-flex"
          >
            <Link href="/contact">
              <span className="text-primary-foreground">立即洽詢</span>
            </Link>
          </Button>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-background">
          <div className="container py-4 space-y-3">
            {navItems.map((item) => {
              // 如果有子選單，展開顯示
              if (item.subItems) {
                return (
                  <div key={item.name} className="space-y-2">
                    <div className="text-sm font-semibold text-foreground py-2">
                      {item.name}
                    </div>
                    <div className="pl-4 space-y-2">
                      {item.subItems.map((subItem) => (
                        <Link key={subItem.name} href={subItem.href}>
                          <span
                            className={`block py-2 text-sm font-medium hover:text-primary cursor-pointer ${
                              isActive(subItem.href)
                                ? "text-primary font-semibold"
                                : "text-muted-foreground"
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {subItem.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              // 一般連結
              return (
                <Link key={item.name} href={item.href}>
                  <span
                    className={`block py-2 text-sm font-medium hover:text-primary cursor-pointer ${
                      isActive(item.href)
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
            <Button asChild className="w-full">
              <Link href="/contact">
                <span className="text-primary-foreground">立即洽詢</span>
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
