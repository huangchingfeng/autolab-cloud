import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Users, Lightbulb, Zap } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { JsonLdSchema, defaultOrganizationSchema } from "@/components/JsonLdSchema";
import Breadcrumb from "@/components/Breadcrumb";
import { useEffect } from "react";
import { Link } from "wouter";

export default function CorporateTraining() {
  useEffect(() => {
    document.title = "企業內訓與顧問服務 - 客製化AI培訓方案 | AI峰哥";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', '提供企業AI內訓與顧問服務，客製化培訓方案，協助企業導入AI工作流，提升團隊效率。已服務超過400家企業與政府單位。');
    }
  }, []);

  const features = [
    {
      icon: Target,
      title: "實戰導向",
      description: "不只教理論，更注重實際應用。課程中直接演練真實工作情境，學員當天就能帶走可用的模板與流程。"
    },
    {
      icon: Users,
      title: "產業客製",
      description: "根據您的產業特性與團隊需求，量身設計課程內容。從金融、製造到服務業，都有對應的實戰案例。"
    },
    {
      icon: Lightbulb,
      title: "思維轉型",
      description: "不只教工具操作，更培養AI思維。讓團隊理解如何用AI解決問題，而非只是學會某個功能。"
    },
    {
      icon: Zap,
      title: "持續支持",
      description: "課後提供 Q&A 支援與最佳實務更新，確保團隊能持續應用所學，真正落地實踐。"
    }
  ];

  const trainingTopics = [
    "ChatGPT 與 Claude 企業實戰應用",
    "Prompt 工程與優化技巧",
    "AI 輔助寫作與內容產生",
    "AI 視覺設計（Midjourney、DALL-E）",
    "AI 資料分析與視覺化",
    "AI 客服與聊天機器人",
    "AI 自動化工作流設計",
    "企業AI導入與變革管理"
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <JsonLdSchema data={defaultOrganizationSchema} />
      <Header />
      <Breadcrumb items={[{ label: "企業內訓與顧問" }]} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <div className="text-center space-y-6 mb-16">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                企業內訓與顧問服務
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                讓企業同仁「會用、懂用、好用、每天用」
              </p>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                我專注於將生成式 AI 轉化為團隊可複用的工作流。從基礎思維、工具選型到情境演練，讓學員帶走「當天可用」的實戰能力。
              </p>
            </div>

            {/* Core Features */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="border-2 hover:border-primary transition-colors">
                    <CardContent className="pt-6">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Training Topics */}
        <section className="py-20 md:py-32 bg-muted/30">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                核心培訓主題
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                涵蓋企業最需要的 AI 應用場景，可依您的需求彈性組合
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {trainingTopics.map((topic, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary text-sm font-bold">{index + 1}</span>
                      </div>
                      <p className="text-foreground font-medium">{topic}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-20 md:py-32 bg-background">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                服務實績
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                已協助超過 400 家企業與政府單位導入 AI 工作流
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-center mb-12">
              <Card>
                <CardContent className="pt-8">
                  <div className="text-4xl font-bold text-primary mb-2">400+</div>
                  <p className="text-muted-foreground">企業與機關</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-8">
                  <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
                  <p className="text-muted-foreground">學員人次</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-8">
                  <div className="text-4xl font-bold text-primary mb-2">300+</div>
                  <p className="text-muted-foreground">場次課程</p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button size="lg" variant="outline" asChild>
                <Link href="/clients">
                  <span>查看更多客戶見證</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
              <CardContent className="py-12">
                <div className="text-center space-y-6">
                  <h2 className="text-3xl font-bold">準備為您的團隊導入 AI 了嗎？</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    無論是企業內訓、顧問諮詢，還是長期合作，我們都能為您量身打造最適合的方案。
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" asChild>
                      <a href="#contact" className="text-primary-foreground">
                        立即洽詢
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <Link href="/about">
                        <span>了解阿峰老師</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
