import { Link } from "wouter";
import { Mail, Phone, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* 聯絡資訊 */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">聯絡資訊</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://line.me/ti/p/0976715102"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>LINE: 0976715102</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:0976715102"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span>0976-715-102</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:nikeshoxmiles@gmail.com"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>nikeshoxmiles@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>

          {/* 服務項目 */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">服務項目</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/#services"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  企業內訓與顧問
                </a>
              </li>
              <li>
                <a
                  href="/#courses"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  公開課程
                </a>
              </li>
              <li>
                <a
                  href="/#coaching"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  1對1教練
                </a>
              </li>
              <li>
                <Link href="/blog">
                  <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    學習資源
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* 社群連結 */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">加入社群</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://line.me/ti/g2/o6oRaGIHTzZ1nEofxnT9Rbv7_ZHAX-rylbJfKA?utm_source=invitation&utm_medium=link_copy&utm_campaign=default"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  AI學員社群（LINE群組）
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/886976715102"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  WhatsApp
                </a>
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              加入 LINE 好友請使用<br />
              電話號碼搜尋：0976715102
            </p>
          </div>

          {/* 關於我們 */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-foreground">關於我們</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              專注於企業AI職場實戰培訓，協助團隊建立可複用的AI工作流，提升工作效率與競爭力。
            </p>
          </div>
        </div>

        {/* 版權聲明 */}
        <div className="mt-12 border-t pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 黃敬峰 AI峰哥. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
