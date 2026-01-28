import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { JsonLdSchema, defaultOrganizationSchema } from "@/components/JsonLdSchema";
import Breadcrumb from "@/components/Breadcrumb";
import { useEffect } from "react";
import { Link } from "wouter";

export default function PublicCourses() {
  useEffect(() => {
    document.title = "公開課程 - AI 實戰培訓課程 | AI峰哥";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', '精心設計的 AI 實戰公開課程，包含 ChatGPT 職場實戰、AI 設計工具、AI 顧問級企劃工作坊等，帶您快速掌握生成式 AI 應用。');
    }
  }, []);

  const courses = [
    {
      title: "ChatGPT 職場實戰班",
      description: "從基礎入門到進階應用，學習如何用 ChatGPT 提升工作效率。包含 Prompt 工程、工作流設計、實際案例演練。",
      duration: "6 小時",
      level: "初階至中階",
    },
    {
      title: "AI 設計工具快速上手",
      description: "學習 Midjourney、Stable Diffusion 等 AI 繪圖工具，快速產出專業視覺設計。適合行銷、設計、內容創作者。",
      duration: "4 小時",
      level: "初階",
    },
    {
      title: "AI 顧問級企劃工作坊",
      description: "運用 AI 打造無法拒絕的致勝提案。學習如何用 AI 協助市場研究、競品分析、策略規劃。",
      duration: "8 小時",
      level: "中階至進階",
    },
  ];

  const onlineCourses = [
    {
      title: "【AI 視覺賦能工作術】Gemini Nano Banana & Grok 影像實戰班",
      description: "學習使用 Gemini Nano Banana 和 Grok 進行 AI 影像處理與視覺分析，提升工作效率。",
      link: "https://www.accupass.com/event/2511211212029299882480",
    },
    {
      title: "生成式 AI 簡報實戰：打造從草稿到上台的自動化流程",
      description: "運用 AI 工具快速製作專業簡報，從內容規劃到視覺設計，全流程自動化。",
      link: "https://www.accupass.com/event/2510020727354782889890",
    },
    {
      title: "《解鎖 Gemini 實戰應用課》最實惠 AI 技巧課程",
      description: "深入探索 Gemini 在各種工作場景的實務應用，掌握最新的 AI 技巧。",
      link: "https://www.accupass.com/event/2509040845172074134967",
    },
    {
      title: "NotebookLM 職場效率革命：工作者的 AI 智慧助理實戰課",
      description: "學習使用 NotebookLM 進行知識管理與筆記整理，打造個人 AI 智慧助理。",
      link: "https://www.accupass.com/event/2509210730087630978640",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <JsonLdSchema data={defaultOrganizationSchema} />
      <Header />
      <Breadcrumb items={[{ label: "公開課" }]} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <div className="text-center space-y-6 mb-16">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                公開課程
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                精心設計的 AI 實戰課程，帶您快速掌握生成式 AI 應用
              </p>
            </div>
          </div>
        </section>

        {/* Public Courses Section */}
        <section className="py-20 md:py-32 bg-background">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                實體公開課
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                小班制教學，現場實作演練，確保每位學員都能充分吸收
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.map((course, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">時長：{course.duration}</span>
                      <span className="text-muted-foreground">等級：{course.level}</span>
                    </div>
                    <Button className="w-full" variant="outline" asChild>
                      <a href="#contact">
                        了解詳情
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Online Courses Section */}
        <section className="py-20 md:py-32 bg-muted/30">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                線上課程
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                無法參加實體課程？我們提供高品質的線上課程，讓您隨時隨地學習 AI 技能
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {onlineCourses.map((course, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {course.description}
                    </p>
                    <Button className="w-full" asChild>
                      <a href={course.link} target="_blank" rel="noopener noreferrer">
                        前往 Accupass 報名
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* 購買錄播檔案 */}
            <div className="max-w-3xl mx-auto">
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-2xl text-center">課程錄播檔案</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-center text-muted-foreground">
                    錯過了直播課程？沒關係！您可以購買課程錄播檔案，隨時回看學習。
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" asChild>
                      <a href="https://www.accupass.com/organizer/detail/720089297172350" target="_blank" rel="noopener noreferrer" className="text-primary-foreground">
                        查看所有課程
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <a href="#contact">
                        洽詢錄播檔案
                      </a>
                    </Button>
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    如需購買錄播檔案，請透過下方聯絡表單與我們聯繫
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 bg-background">
          <div className="container">
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
              <CardContent className="py-12">
                <div className="text-center space-y-6">
                  <h2 className="text-3xl font-bold">想了解更多課程資訊？</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    歡迎透過下方聯絡表單與我們聯繫，我們會盡快為您安排課程說明。
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" asChild>
                      <a href="#contact" className="text-primary-foreground">
                        立即洽詢
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <Link href="/events">
                        <span>查看活動課程</span>
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
