import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Target, Calendar, MessageSquare } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { JsonLdSchema, defaultOrganizationSchema } from "@/components/JsonLdSchema";
import Breadcrumb from "@/components/Breadcrumb";
import { useEffect } from "react";

export default function Coaching() {
  useEffect(() => {
    document.title = "1對1 AI 教練服務 - 個人化學習方案 | AI峰哥";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', '量身打造的個人化 AI 學習計畫，根據您的工作情境與需求，設計專屬的 AI 工作流解決方案。完全客製化的學習內容與進度。');
    }
  }, []);

  const benefits = [
    {
      icon: Target,
      title: "完全客製化",
      description: "根據您的工作情境與需求，設計專屬的學習內容與進度，確保每一堂課都對您有實質幫助。"
    },
    {
      icon: MessageSquare,
      title: "實際案例演練",
      description: "使用您的真實工作案例進行演練，不只學會工具，更能立即應用到工作中。"
    },
    {
      icon: Calendar,
      title: "彈性排課",
      description: "配合您的時間安排課程，不受固定班次限制，學習更有彈性。"
    },
    {
      icon: Check,
      title: "持續追蹤輔導",
      description: "課後持續追蹤您的實踐狀況，提供回饋與建議，確保落地實踐。"
    }
  ];

  const process = [
    {
      step: "1",
      title: "需求諮詢",
      description: "透過線上會議了解您的工作情境、學習目標與時間安排。"
    },
    {
      step: "2",
      title: "方案設計",
      description: "根據您的需求設計專屬學習計畫，包含課程內容、時數與進度。"
    },
    {
      step: "3",
      title: "開始學習",
      description: "按照排定的時間進行 1對1 線上教學，實際演練您的工作案例。"
    },
    {
      step: "4",
      title: "持續支持",
      description: "課後提供 Q&A 支援，追蹤您的實踐狀況，確保學習成效。"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <JsonLdSchema data={defaultOrganizationSchema} />
      <Header />
      <Breadcrumb items={[{ label: "1對1 教練服務" }]} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                  1對1 AI 教練服務
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  量身打造的個人化 AI 學習計畫，根據您的工作情境與需求，設計專屬的 AI 工作流解決方案。
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild>
                    <a href="https://ai-career.manus.space/" target="_blank" rel="noopener noreferrer" className="text-primary-foreground">
                      預約諮詢
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="#process">
                      了解流程
                    </a>
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="text-6xl mb-4">🎯</div>
                    <p className="text-xl font-semibold text-foreground">個人化學習體驗</p>
                    <p className="text-sm text-muted-foreground mt-2">量身打造的 AI 教練服務</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 md:py-32 bg-background">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                為什麼選擇 1對1 教練服務？
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                相比公開課程，1對1 教練服務能更精準地解決您的實際需求
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <Card key={index} className="border-2 hover:border-primary transition-colors">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl">{benefit.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {benefit.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section id="process" className="py-20 md:py-32 bg-muted/30">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                服務流程
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                從諮詢到實踐，完整的學習支持流程
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {process.map((item, index) => (
                <Card key={index} className="relative hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="absolute -top-4 -left-4 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold shadow-lg">
                      {item.step}
                    </div>
                    <CardTitle className="text-xl pt-4">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Suitable For Section */}
        <section className="py-20 md:py-32 bg-background">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                適合對象
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  title: "企業主管",
                  description: "需要快速掌握 AI 應用，帶領團隊數位轉型的決策者。"
                },
                {
                  title: "專業工作者",
                  description: "希望用 AI 提升工作效率，但不知從何開始的職場人士。"
                },
                {
                  title: "創業者",
                  description: "想用 AI 優化業務流程，降低成本提高競爭力的創業家。"
                }
              ].map((item, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
              <CardContent className="py-12">
                <div className="text-center space-y-6">
                  <h2 className="text-3xl font-bold">準備開始您的 AI 學習之旅？</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    立即預約免費諮詢，讓我們一起規劃最適合您的學習方案。
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" asChild>
                      <a href="https://ai-career.manus.space/" target="_blank" rel="noopener noreferrer" className="text-primary-foreground">
                        預約諮詢
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <a href="#contact">
                        聯繫我們
                      </a>
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
