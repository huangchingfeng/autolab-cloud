import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  // 生成 Schema.org BreadcrumbList 結構化資料
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "首頁",
        "item": typeof window !== 'undefined' ? `${window.location.origin}/` : "https://aifengge.com/"
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.label,
        ...(item.href && {
          "item": typeof window !== 'undefined' ? `${window.location.origin}${item.href}` : `https://aifengge.com${item.href}`
        })
      }))
    ]
  };

  return (
    <>
      {/* Schema.org 結構化資料 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      {/* 麵包屑導航 UI */}
      <nav aria-label="麵包屑導航" className="py-4 border-b bg-muted/30">
        <div className="container">
          <ol className="flex items-center gap-2 text-sm flex-wrap">
            {/* 首頁 */}
            <li className="flex items-center gap-2">
              <Link href="/">
                <span className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                  <Home className="h-4 w-4" />
                  <span>首頁</span>
                </span>
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </li>

            {/* 動態麵包屑項目 */}
            {items.map((item, index) => {
              const isLast = index === items.length - 1;
              
              return (
                <li key={index} className="flex items-center gap-2">
                  {item.href && !isLast ? (
                    <>
                      <Link href={item.href}>
                        <span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                          {item.label}
                        </span>
                      </Link>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </>
                  ) : (
                    <span className="text-foreground font-medium" aria-current="page">
                      {item.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
}
