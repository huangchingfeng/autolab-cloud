import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Briefcase } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { JsonLdSchema, defaultPersonSchema, defaultOrganizationSchema } from "@/components/JsonLdSchema";
import Breadcrumb from "@/components/Breadcrumb";
import { WorkshopStats } from "@/components/WorkshopStats";
import { useEffect } from "react";

export default function About() {
  useEffect(() => {
    document.title = "關於阿峰老師 - 台灣企業AI職場實戰專家 | AI峰哥";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', '黃敬峰（AI峰哥/阿峰老師）是台灣領先的企業AI實戰培訓專家，擁有超過10年的企業培訓經驗，協助超過400家企業與政府單位導入AI工作流。');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <JsonLdSchema data={defaultPersonSchema} />
      <JsonLdSchema data={defaultOrganizationSchema} />
      <Header />
      <Breadcrumb items={[{ label: "關於阿峰老師" }]} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <div className="text-center space-y-4 mb-16">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                關於阿峰老師
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                台灣企業AI職場實戰專家，協助超過 400 家企業與政府單位導入 AI 工作流
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Left: Professional Background */}
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Briefcase className="h-6 w-6 text-primary" />
                      專業背景
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-muted-foreground">
                      <p className="leading-relaxed">
                        黃敬峰（AI峰哥/阿峰老師）是台灣領先的企業AI實戰培訓專家，擁有超過 <strong className="text-foreground">10 年的企業培訓經驗</strong>。從生成式AI元年（2022）起，即深入研究 ChatGPT、Claude、Midjourney 等工具，並將其轉化為企業可落地的實戰方案。
                      </p>
                      <p className="leading-relaxed">
                        阿峰老師的教學理念是「<strong className="text-foreground">會用、懂用、好用、每天用</strong>」，不僅教導工具操作，更強調 <strong className="text-foreground">Prompt 工程思維</strong>與<strong className="text-foreground">工作流設計</strong>，讓學員能夠當天帶走可立即應用的實戰技能。
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Target className="h-6 w-6 text-primary" />
                      授課特色
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { icon: "💡", title: "深入淺出", desc: "以真實案例拆解複雜概念" },
                        { icon: "🛠️", title: "實戰導向", desc: "課堂即產出可用模板" },
                        { icon: "🎯", title: "產業客製", desc: "依您的情境設計演練" },
                        { icon: "🔄", title: "持續支持", desc: "課後 Q&A 與最佳實務更新" },
                      ].map((feature, index) => (
                        <div key={index} className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                          <div className="text-3xl mb-2">{feature.icon}</div>
                          <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                          <p className="text-sm text-muted-foreground">{feature.desc}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Teaching Experience & Clients */}
              <div className="space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <TrendingUp className="h-6 w-6 text-primary" />
                      授課經歷
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="p-4 rounded-lg bg-primary/5">
                        <div className="text-3xl font-bold text-primary">400+</div>
                        <div className="text-sm text-muted-foreground mt-1">企業與機關</div>
                      </div>
                      <div className="p-4 rounded-lg bg-primary/5">
                        <div className="text-3xl font-bold text-primary">10,000+</div>
                        <div className="text-sm text-muted-foreground mt-1">學員人次</div>
                      </div>
                      <div className="p-4 rounded-lg bg-primary/5">
                        <div className="text-3xl font-bold text-primary">300+</div>
                        <div className="text-sm text-muted-foreground mt-1">場次課程</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-foreground">核心教學領域：</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {[
                          "ChatGPT 與 Claude 實戰應用",
                          "Prompt 工程與優化技巧",
                          "AI 輔助寫作與內容產生",
                          "AI 視覺設計（Midjourney、DALL-E）",
                          "AI 自動化工作流設計",
                          "企業AI導入與變革管理",
                        ].map((item, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">✓</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Briefcase className="h-6 w-6 text-primary" />
                      服務企業（部分名單）
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {[
                          "日商三菱商事", "日商TOTO", "華碩電腦", "新加坡商蝦皮購物",
                          "南山人壽", "精誠資訊", "Nissan Taiwan", "Toyota Taiwan",
                          "Order歐德家具", "雅丰連鎖醫美", "國賓影城"
                        ].map((company, index) => (
                          <span key={index} className="px-3 py-1 bg-muted rounded-full text-sm text-foreground">
                            {company}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground text-center mt-4">
                        ...以及更多企業與政府單位
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* CTA Section */}
            <div className="mt-16 text-center">
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
                <CardContent className="py-12">
                  <h3 className="text-2xl font-bold mb-4">準備好開始您的 AI 學習之旅了嗎？</h3>
                  <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                    無論是企業內訓、公開課程，還是 1對1 教練服務，阿峰老師都能為您量身打造最適合的 AI 學習方案。
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" asChild>
                      <a href="/corporate-training" className="text-primary-foreground">
                        企業內訓洽詢
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <a href="/2026-ai-course">
                        查看公開課
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* 2025 年度成就視覺化 */}
        <WorkshopStats />
      </main>

      <Footer />
    </div>
  );
}
