import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageNavigation from "@/components/PageNavigation";
import ContactForm from "@/components/ContactForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MessageCircle, MapPin, Clock, Send } from "lucide-react";
import { SeoHead } from "@/components/SeoHead";

const contactMethods = [
  {
    icon: Mail,
    title: "電子郵件",
    value: "contact@aifengge.com",
    description: "商務合作與課程諮詢",
    href: "mailto:contact@aifengge.com",
  },
  {
    icon: Phone,
    title: "聯絡電話",
    value: "02-1234-5678",
    description: "週一至週五 9:00-18:00",
    href: "tel:+886212345678",
  },
  {
    icon: MessageCircle,
    title: "LINE 官方帳號",
    value: "@aifengge",
    description: "即時諮詢與課程通知",
    href: "https://line.me/ti/g2/o6oRaGIHTzZ1nEofxnT9Rbv7_ZHAX-rylbJfKA",
  },
];

const serviceTypes = [
  {
    title: "企業內訓",
    description: "針對企業需求量身打造的 AI 培訓課程，可到府授課或線上進行",
    features: ["客製化課程內容", "實戰案例演練", "課後諮詢服務"],
  },
  {
    title: "公開課程",
    description: "定期舉辦的 AI 實戰課程，適合個人進修或小團體報名",
    features: ["多元主題選擇", "小班制教學", "錄影回看權限"],
  },
  {
    title: "1 對 1 教練",
    description: "針對個人需求的專屬指導，快速解決工作中的 AI 應用問題",
    features: ["彈性時間安排", "專屬學習計畫", "即時問題解答"],
  },
  {
    title: "顧問諮詢",
    description: "為企業提供 AI 導入策略規劃與技術諮詢服務",
    features: ["現況診斷分析", "導入策略規劃", "技術選型建議"],
  },
];

export default function Contact() {
  const seoTitle = "聯絡我們 - 企業AI培訓課程諮詢 | AI峰哥";
  const seoDescription = "歡迎聯絡AI峰哥（黃敬峰）諮詢企業AI內訓、公開課程、1對1教練服務。提供 ChatGPT、Gemini 等 AI 工具實戰培訓，協助企業提升工作效率。";
  const seoKeywords = "聯絡AI峰哥, 企業AI培訓, AI課程諮詢, AI內訓, ChatGPT培訓, Gemini教學, 黃敬峰, 企業諮詢";

  return (
    <>
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl="https://ai-tw.manus.space/#contact"
      />
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Navigation Tabs */}
        <PageNavigation currentPath="/contact" />

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Badge variant="secondary" className="mb-4">
                📬 聯繫我們
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                讓我們一起開啟 AI 學習之旅
              </h1>
              <p className="text-lg text-muted-foreground">
                無論是企業培訓、公開課程還是個人諮詢，我們都很樂意為您服務
              </p>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-12 border-b">
          <div className="container">
            <div className="grid md:grid-cols-3 gap-6">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <a
                    key={index}
                    href={method.href}
                    target={method.href.startsWith("http") ? "_blank" : undefined}
                    rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="block"
                  >
                    <Card className="h-full hover:shadow-md transition-shadow hover:border-primary/50">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold mb-1">{method.title}</h3>
                            <p className="text-primary font-medium mb-1">{method.value}</p>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Service Types */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                服務項目
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                多元化的服務模式，滿足不同需求
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {serviceTypes.map((service, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                  立即諮詢
                </h2>
                <p className="text-lg text-muted-foreground">
                  填寫以下表單，我們會盡快與您聯繫
                </p>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <ContactForm />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                  常見問題
                </h2>
              </div>
              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">企業內訓的最低人數是多少？</h3>
                    <p className="text-muted-foreground">
                      建議最低 10 人以上，以確保課程互動效果。若人數較少，也可以考慮 1 對 1 教練或參加公開課程。
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">課程可以客製化嗎？</h3>
                    <p className="text-muted-foreground">
                      當然可以！我們會根據企業的產業特性、員工程度和學習目標，量身打造最適合的課程內容。
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-2">課程費用如何計算？</h3>
                    <p className="text-muted-foreground">
                      費用會根據課程時數、人數、客製化程度等因素而定。歡迎填寫諮詢表單，我們會提供詳細報價。
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
    </>
  );
}
