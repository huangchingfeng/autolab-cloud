import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Briefcase, Users, Lightbulb, Zap, Calendar, ArrowRight, BookOpen, Wrench } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import CourseVideos from "@/components/CourseVideos";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { JsonLdSchema, defaultPersonSchema, defaultOrganizationSchema } from "@/components/JsonLdSchema";
import { useEffect } from "react";

function LatestBlogPosts() {
  const { data: posts, isLoading } = trpc.blog.getPosts.useQuery({ limit: 3, offset: 0 });

  if (isLoading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
              最新文章
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              探索 AI 應用的最新趨勢與實戰技巧
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            最新文章
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            探索 AI 應用的最新趨勢與實戰技巧
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((item) => (
            <Card key={item.post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="line-clamp-2">{item.post.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{item.post.publishedAt ? new Date(item.post.publishedAt).toLocaleDateString('zh-TW') : ''}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-3 mb-4">
                  {item.post.excerpt}
                </p>
                <Button variant="ghost" className="p-0 h-auto" asChild>
                  <Link href={`/blog/${item.post.slug}`}>
                    <span className="flex items-center gap-2">
                      閱讀更多
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="text-center mt-12">
          <Button size="lg" variant="outline" asChild>
            <Link href="/blog">
              <span>查看所有文章</span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useEffect(() => {
    document.title = "黃敬峰 AI峰哥 - 台灣企業AI職場實戰專家 | ChatGPT、Gemini 企業培訓講師";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', '黃敬峰（AI峰哥/阿峰老師）是台灣領先的企業AI實戰培訓專家，提供企業內訓、公開課程、1對1教練服務，協助超過400家企業與政府單位導入AI工作流。');
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <JsonLdSchema data={defaultPersonSchema} />
      <JsonLdSchema data={defaultOrganizationSchema} />
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                    讓 AI 成為您的
                    <span className="block text-primary">職場超能力</span>
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed sm:text-xl">
                    台灣企業 AI 職場實戰專家，協助超過 <strong className="text-foreground">400 家企業與政府單位</strong>導入 AI 工作流，累計培訓 <strong className="text-foreground">10,000+ 學員</strong>，完成 <strong className="text-foreground">300+ 場次課程</strong>。
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" asChild>
                    <Link href="/corporate-training">
                      <span className="text-primary-foreground">企業內訓洽詢</span>
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/2026-ai-course">
                      <span className="text-foreground">查看公開課</span>
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Right Image */}
              <div className="relative lg:order-last">
                <div className="relative aspect-square max-w-md mx-auto lg:max-w-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl transform rotate-6"></div>
                  <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl">
                    <img
                      src="/afeng-professional.jpg"
                      alt="阿峰老師"
                      className="w-full h-full object-cover object-center rounded-2xl shadow-2xl"
                      style={{ objectPosition: 'center 20%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Teacher Section - Teaser */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-muted/30 to-background">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Briefcase className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  關於阿峰老師
                </h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                黃敬峰（AI峰哥/阿峰老師）是台灣領先的企業AI實戰培訓專家，擁有超過 10 年的企業培訓經驗。從生成式AI元年（2022）起，即深入研究 ChatGPT、Claude、Midjourney 等工具，並將其轉化為企業可落地的實戰方案。
              </p>
              <Button size="lg" variant="outline" asChild>
                <Link href="/about">
                  <span className="flex items-center gap-2">
                    了解更多
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Corporate Training Section - Teaser */}
        <section className="py-20 md:py-32 bg-background">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Target className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  企業內訓與顧問
                </h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                讓企業同仁「會用、懂用、好用、每天用」。我專注於將生成式 AI 轉化為團隊可複用的工作流，從基礎思維、工具選型到情境演練，讓學員帶走「當天可用」的實戰能力。
              </p>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Target, title: "實戰導向", desc: "課程中直接演練真實工作情境" },
                  { icon: Users, title: "產業客製", desc: "根據產業特性量身設計內容" },
                  { icon: Lightbulb, title: "思維轉型", desc: "培養AI思維，不只學工具操作" },
                  { icon: Zap, title: "持續支持", desc: "課後Q&A與最佳實務更新" },
                ].map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button size="lg" variant="outline" asChild>
                <Link href="/corporate-training">
                  <span className="flex items-center gap-2">
                    了解更多
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Public Courses Section - Teaser */}
        <section className="py-20 md:py-32 bg-muted/30">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  公開課
                </h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                精心設計的 AI 實戰課程，帶您快速掌握生成式 AI 應用。包含 ChatGPT 職場實戰、AI 設計工具、AI 顧問級企劃工作坊等多元課程，以及線上課程與錄播檔案選擇。
              </p>
              <Button size="lg" variant="outline" asChild>
                <Link href="/2026-ai-course">
                  <span className="flex items-center gap-2">
                    了解更多
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 1-on-1 Coaching Section - Teaser */}
        <section className="py-20 md:py-32 bg-background">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Users className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  1對1 教練服務
                </h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                量身打造的個人化 AI 學習計畫，根據您的工作情境與需求，設計專屬的 AI 工作流解決方案。完全客製化的學習內容、實際案例演練、彈性排課、持續追蹤輔導。
              </p>
              <Button size="lg" variant="outline" asChild>
                <Link href="/coaching">
                  <span className="flex items-center gap-2">
                    了解更多
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Topics & Tools Section - Teaser */}
        <section className="py-20 md:py-32 bg-muted/30">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <Wrench className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  教學主題與工具
                </h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                涵蓋各類 AI 工具與應用場景，包含 ChatGPT、Claude、Gemini、Midjourney 等主流工具，以及 Prompt 工程、AI 寫作、視覺設計、自動化工作流等核心主題。
              </p>
              <Button size="lg" variant="outline" asChild>
                <Link href="/topics">
                  <span className="flex items-center gap-2">
                    了解更多
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Clients Section - Teaser */}
        <section className="py-20 md:py-32 bg-background">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  客戶見證
                </h2>
              </div>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                感謝超過 400 家企業與政府單位的信任與支持，包含華碩、蝦皮、南山人壽、行政院數位發展部、勞動力發展署、經濟部能源署等知名機構。
              </p>
              <div className="grid grid-cols-3 gap-8 text-center mb-8">
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
              <Button size="lg" variant="outline" asChild>
                <Link href="/clients">
                  <span className="flex items-center gap-2">
                    了解更多
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>
            </div>
          </div>
        </section>



        {/* Course Videos Section */}
        <CourseVideos />

        {/* Latest Blog Posts Section */}
        <LatestBlogPosts />

        {/* Contact Section */}
        <section id="contact" className="py-20 bg-gradient-to-b from-background to-muted/20">
          <div className="container max-w-4xl">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                立即聯繫，開啓 AI 轉型之旅
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                讓阿峰老師為您量身打造最適合的 AI 導入方案
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
