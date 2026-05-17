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

  const navItems: Array<{
    name: string;
    href: string;
    staticLink?: boolean;
    subItems?: Array<{ name: string; href: string }>;
  }> = [
    { name: "關於阿峰老師", href: "/about" },
    { name: "企業內訓與顧問", href: "/corporate-training" },
    { 
      name: "公開課", 
      href: "/2026-ai-course",
      subItems: [
        { name: "2026 AI 實戰應用課(台北班)", href: "/2026-ai-course" },
        { name: "AI 超級業務實戰班", href: "/ai-super-sales" },
        { name: "保險業務 AI 工具箱", href: "/insurance-ai-tools" },
        { name: "AI 業務飛輪實戰班", href: "/ai-business-flywheel" },
      ]
    },
    { name: "1對1教練", href: "/coaching" },
    { name: "教學主題與工具", href: "/topics" },
    { name: "提示詞產生器", href: "/prompt-generator/", staticLink: true },
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

  const desktopPrimaryNames = new Set([
    "關於阿峰老師",
    "企業內訓與顧問",
    "公開課",
    "1對1教練",
    "教學主題與工具",
    "部落格",
  ]);
  const desktopPrimaryNavItems = navItems.filter((item) =>
    desktopPrimaryNames.has(item.name)
  );
  const desktopMoreNavItems = navItems.filter(
    (item) => !desktopPrimaryNames.has(item.name)
  );
  const isMoreActive = desktopMoreNavItems.some(
    (item) =>
      isActive(item.href) || item.subItems?.some((subItem) => isActive(subItem.href))
  );

  const renderDesktopNavItem = (item: (typeof navItems)[number]) => {
    if (item.subItems) {
      return (
        <DropdownMenu key={item.name}>
          <DropdownMenuTrigger asChild>
            <button
              className={`flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
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
                  <span className="cursor-pointer w-full whitespace-nowrap">
                    {subItem.name}
                  </span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    if (item.staticLink) {
      return (
        <a key={item.name} href={item.href}>
          <span className="whitespace-nowrap text-sm font-medium transition-colors hover:text-primary cursor-pointer text-muted-foreground">
            {item.name}
          </span>
        </a>
      );
    }

    return (
      <Link key={item.name} href={item.href}>
        <span
          className={`whitespace-nowrap text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
            isActive(item.href)
              ? "text-primary font-semibold"
              : "text-muted-foreground"
          }`}
        >
          {item.name}
        </span>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/">
          <div className="flex shrink-0 items-center space-x-2 cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border-2 border-primary">
              <span className="text-lg font-bold text-primary">AI</span>
            </div>
            <span className="hidden font-bold sm:inline-block text-foreground">
              AI峰哥
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden min-w-0 flex-1 items-center justify-center gap-5 px-2 xl:flex">
          {desktopPrimaryNavItems.map(renderDesktopNavItem)}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex shrink-0 items-center gap-1 whitespace-nowrap text-sm font-medium transition-colors hover:text-primary cursor-pointer ${
                  isMoreActive
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                更多
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {desktopMoreNavItems.map((item) => (
                <DropdownMenuItem key={item.name} asChild>
                  {item.staticLink ? (
                    <a href={item.href} className="cursor-pointer whitespace-nowrap">
                      {item.name}
                    </a>
                  ) : (
                    <Link href={item.href}>
                      <span className="cursor-pointer whitespace-nowrap">
                        {item.name}
                      </span>
                    </Link>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* CTA Button */}
        <div className="flex shrink-0 items-center gap-2">
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
            className="xl:hidden"
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
        <div className="xl:hidden border-t bg-background">
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
              if (item.staticLink) {
                return (
                  <a key={item.name} href={item.href}>
                    <span
                      className="block py-2 text-sm font-medium hover:text-primary cursor-pointer text-muted-foreground"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </span>
                  </a>
                );
              }

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
