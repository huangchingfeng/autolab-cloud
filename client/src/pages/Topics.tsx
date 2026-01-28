import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { JsonLdSchema, defaultOrganizationSchema } from "@/components/JsonLdSchema";
import Breadcrumb from "@/components/Breadcrumb";
import { useEffect } from "react";

export default function Topics() {
  useEffect(() => {
    document.title = "教學主題與工具 - AI 工具與應用場景 | AI峰哥";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', '涵蓋各類 AI 工具與應用場景，包含 ChatGPT、Claude、Gemini、Midjourney 等主流工具，以及 Prompt 工程、AI 寫作、視覺設計等核心主題。');
    }
  }, []);

  const topics = [
    "Prompt 工程與優化",
    "AI 輔助寫作與編輯",
    "AI 視覺設計與繪圖",
    "AI 資料分析與視覺化",
    "AI 客服與聊天機器人",
    "AI 自動化工作流",
    "AI 協作與團隊效率",
    "AI 倒理與安全",
  ];

  const tools = [
    { name: "ChatGPT", desc: "對話式 AI 助手", url: "https://chatgpt.com", icon: "🤖" },
    { name: "Claude", desc: "Anthropic 的 AI 助手", url: "https://claude.ai", icon: "🧠" },
    { name: "Gemini", desc: "Google 的 AI 助手", url: "https://gemini.google.com", icon: "✨" },
    { name: "Midjourney", desc: "AI 圖像生成", url: "https://www.midjourney.com", icon: "🎨" },
    { name: "DALL-E", desc: "OpenAI 的圖像生成", url: "https://openai.com/dall-e", icon: "🖼️" },
    { name: "Notion AI", desc: "AI 筆記與知識管理", url: "https://www.notion.so/product/ai", icon: "📓" },
    { name: "Gamma", desc: "AI 簡報生成", url: "https://gamma.app", icon: "📊" },
    { name: "GitHub Copilot", desc: "AI 程式編寫助手", url: "https://github.com/features/copilot", icon: "💻" },
    { name: "Zapier", desc: "AI 自動化平台", url: "https://zapier.com", icon: "⚡" },
    { name: "Make", desc: "視覺化自動化平台", url: "https://www.make.com", icon: "🔧" },
  ];

  const afengTools = [
    { name: "阿峰老師的提示詞學校", desc: "內含黃金提示詞優化師，幫你寫出更好的 Prompt", url: "https://prompt-school.manus.space/", icon: "🏫" },
    { name: "阿峰老師帶你使用 Nano Banana", desc: "內含圖片詠唱師，輕鬆生成 AI 圖像", url: "https://nanobanana-prompt.manus.space/", icon: "🍌" },
    { name: "阿峰老師幫你做貼圖", desc: "用 Nano Banana 製作客製化 LINE 貼圖", url: "https://line-sticker.manus.space", icon: "🎭" },
    { name: "阿峰老師帶你環遊世界", desc: "用 Nano Banana 生成世界各地的旅遊圖像", url: "https://gemini.google.com/share/38f5f315c4e4", icon: "✈️" },
    { name: "阿峰老師幫你把 PDF 轉成 JPG", desc: "快速將 PDF 檔案轉換為高品質圖片", url: "https://gemini.google.com/share/3fd71ad43e90", icon: "📄" },
    { name: "阿峰老師帶你設定安全密碼(多語言版本)", desc: "生成強度高的安全密碼，支援多種語言", url: "https://code.manus.space", icon: "🔐" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <JsonLdSchema data={defaultOrganizationSchema} />
      <Header />
      <Breadcrumb items={[{ label: "教學主題與工具" }]} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <div className="text-center space-y-6 mb-16">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                教學主題與工具
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                涵蓋各類 AI 工具與應用場景，幫助您全面掌握 AI 技能
              </p>
            </div>
          </div>
        </section>

        {/* Core Topics Section */}
        <section className="py-20 md:py-32 bg-background">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                核心教學主題
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                從基礎到進階，系統化學習 AI 應用技能
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {topics.map((topic, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary"></div>
                      </div>
                      <p className="text-sm text-foreground font-medium">{topic}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* AI Tools Section */}
        <section className="py-20 md:py-32 bg-muted/30">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                常用 AI 工具
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                掌握主流 AI 工具，提升工作效率
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {tools.map((tool, index) => (
                <a 
                  key={index} 
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="h-full hover:shadow-lg transition-all hover:scale-[1.02] group">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <span className="text-2xl">{tool.icon}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground group-hover:text-primary transition-colors">{tool.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">{tool.desc}</p>
                        </div>
                        <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Afeng Tools Section */}
        <section className="py-20 md:py-32 bg-background">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                🌟 阿峰老師的 AI 工具
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                阿峰老師親自開發的實用 AI 工具，免費使用
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {afengTools.map((tool, index) => (
                <a 
                  key={index} 
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="h-full bg-gradient-to-r from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10 transition-all hover:scale-[1.02] group border border-primary/10">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-md">
                          <span className="text-3xl">{tool.icon}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground group-hover:text-primary transition-colors text-lg">{tool.name}</p>
                          <p className="text-sm text-muted-foreground mt-2">{tool.desc}</p>
                        </div>
                        <svg className="w-5 h-5 text-primary/50 group-hover:text-primary transition-colors mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </CardContent>
                  </Card>
                </a>
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
                  <h2 className="text-3xl font-bold">想深入學習這些工具？</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    以上只是部分教學內容，實際課程會根據您的需求客製化調整。
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" asChild>
                      <a href="#contact" className="text-primary-foreground">
                        討論客製化課程
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <a href="/2026-ai-course">
                        查看公開課
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
