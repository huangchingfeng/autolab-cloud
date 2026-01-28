import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SeoHead } from "@/components/SeoHead";
import { JsonLdSchema } from "@/components/JsonLdSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const faqData = [
  {
    category: "課程相關",
    questions: [
      {
        question: "課程適合完全沒有 AI 基礎的人嗎？",
        answer: "非常適合！我的課程設計從零開始，不需要任何程式背景或 AI 知識。我會用淺顯易懂的方式講解，並提供大量實際案例，讓您能快速上手。課程重點在於「會用」而非「理論」，讓您當天就能帶走可用的技能。"
      },
      {
        question: "企業內訓和公開課程有什麼差別？",
        answer: "企業內訓是針對貴公司的產業特性、部門需求、工作流程量身設計的客製化課程，可以使用公司實際案例進行演練，並提供後續追蹤輔導。公開課程則是固定主題、固定時間的標準課程，適合個人學習或小團隊參加，費用較低但內容較為通用。"
      },
      {
        question: "一場企業內訓大約需要多少時間？",
        answer: "標準企業內訓為 3-6 小時（半天至一天），可依需求調整。建議至少安排 3 小時，才能涵蓋基礎觀念、工具操作、實作演練三個環節。若希望深入特定主題或多個工具，建議安排 6 小時或分兩天進行，學習效果會更好。"
      },
      {
        question: "課程結束後會提供什麼資料？",
        answer: "課程結束後，您會收到：(1) 完整課程簡報檔案 (2) 實作演練的 Prompt 模板 (3) 相關工具的操作手冊 (4) 延伸學習資源清單。企業內訓還會額外提供客製化的工作流範本，以及課後 Q&A 群組支援（通常為期 1-3 個月）。"
      },
    ]
  },
  {
    category: "工具與技術",
    questions: [
      {
        question: "課程會教哪些 AI 工具？",
        answer: "主要教學工具包含：ChatGPT（GPT-4）、Claude、Gemini、Midjourney、DALL-E、NotebookLM、Gamma、Canva AI 等。會根據您的需求選擇最適合的工具組合。企業內訓可以針對特定工具深入講解，公開課程則會涵蓋多種工具的基礎應用。"
      },
      {
        question: "需要自備電腦或付費訂閱 AI 工具嗎？",
        answer: "建議自備筆記型電腦以便實作練習。大部分工具都有免費版本可以使用（如 ChatGPT 免費版、Gemini、Canva 免費版），足以完成課堂練習。若希望體驗更進階功能，可考慮訂閱 ChatGPT Plus（每月 $20 美金）或 Midjourney（每月 $10 美金起），但不強制要求。"
      },
      {
        question: "ChatGPT 和 Gemini 有什麼差別？該用哪一個？",
        answer: "ChatGPT（OpenAI）在創意寫作、對話流暢度、Prompt 理解力較強；Gemini（Google）在資料搜尋、多語言處理、與 Google 生態系整合較佳。建議兩者都學，依任務選擇：寫作、企劃用 ChatGPT；研究、資料整理用 Gemini。課程中會詳細比較並示範各自的最佳使用情境。"
      },
    ]
  },
  {
    category: "報名與費用",
    questions: [
      {
        question: "企業內訓的費用如何計算？",
        answer: "企業內訓費用依據課程時數、參加人數、客製化程度而定。標準半天課程（3 小時）約 3-5 萬元，全天課程（6 小時）約 5-8 萬元。若需要多場次、跨部門、或深度客製化，會另外報價。歡迎透過聯絡表單或 LINE 官方帳號諮詢，我會根據您的需求提供詳細報價。"
      },
      {
        question: "公開課程可以開立發票或收據嗎？",
        answer: "可以！所有公開課程都會開立電子發票或收據，可用於公司報帳。報名時請在備註欄填寫公司統編、抬頭、聯絡資訊，我們會在課程結束後 7 個工作天內寄送發票。若有特殊開立需求（如三聯式發票），請提前告知。"
      },
      {
        question: "報名後可以取消或改期嗎？",
        answer: "公開課程：開課前 7 天（含）申請取消可全額退費；開課前 3-6 天取消退 50%；開課前 2 天內恕不退費，但可保留名額轉至下一梯次。企業內訓：確認日期後若需改期，請至少提前 14 天告知，可免費改期一次；若於 14 天內取消或改期，需支付 30% 行政費用。"
      },
    ]
  },
  {
    category: "其他問題",
    questions: [
      {
        question: "1對1 AI 教練服務和一般課程有什麼不同？",
        answer: "1對1 教練服務是完全客製化的個人輔導，會針對您的工作情境、產業特性、實際需求設計專屬學習計畫。不僅教工具操作，更會協助您建立 AI 工作流、優化現有流程、解決實際問題。包含課後追蹤、作業批改、隨時諮詢等服務，適合希望深入學習或有特殊需求的學員。"
      },
      {
        question: "課程有錄影或線上重播嗎？",
        answer: "實體課程原則上不提供錄影，但會提供完整簡報和操作手冊。部分公開課程有推出「錄播版」，可於 Accupass 平台購買，隨時回看學習。企業內訓若有錄影需求，請提前告知，可另外安排（需額外收費）。"
      },
      {
        question: "如何持續追蹤 AI 最新發展和課程資訊？",
        answer: "建議加入我的 LINE 官方帳號 @aifengge，會不定期分享 AI 工具更新、實用技巧、課程優惠。也可以追蹤我的 Facebook 粉絲專頁「AI峰哥」，或訂閱電子報（於官網首頁訂閱）。此外，我也會在部落格發布深度文章，歡迎常來逛逛！"
      },
    ]
  },
];

export default function FAQ() {
  const seoTitle = "常見問題 FAQ - AI 課程與培訓諮詢 | AI峰哥";
  const seoDescription = "AI峰哥（黃敬峰）常見問題解答：包含課程內容、工具選擇、報名方式、企業內訓、1對1 教練服務等相關問題。快速了解 AI 培訓課程的所有細節。";
  const seoKeywords = "AI課程FAQ, ChatGPT教學問題, 企業AI培訓諮詢, AI工具選擇, 課程報名, AI峰哥, 黃敬峰";

  // FAQ Schema
  const faqSchema = {
    type: 'FAQPage' as const,
    mainEntity: faqData.flatMap(category =>
      category.questions.map(q => ({
        '@type': 'Question' as const,
        name: q.question,
        acceptedAnswer: {
          '@type': 'Answer' as const,
          text: q.answer,
        },
      }))
    ),
  };

  return (
    <>
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonicalUrl="https://ai-tw.manus.space/faq"
      />
      <JsonLdSchema data={faqSchema} />
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
            <div className="container">
              <div className="max-w-3xl mx-auto text-center">
                <Badge variant="secondary" className="mb-4">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  常見問題
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  常見問題 FAQ
                </h1>
                <p className="text-xl text-muted-foreground">
                  關於 AI 課程、工具、報名的所有疑問，都在這裡為您解答
                </p>
              </div>
            </div>
          </section>

          {/* FAQ Content */}
          <section className="py-16">
            <div className="container max-w-4xl">
              {faqData.map((category, categoryIndex) => (
                <Card key={categoryIndex} className="mb-8">
                  <CardHeader>
                    <CardTitle className="text-2xl text-primary">
                      {category.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((item, questionIndex) => (
                        <AccordionItem
                          key={questionIndex}
                          value={`item-${categoryIndex}-${questionIndex}`}
                        >
                          <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary">
                            {item.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground leading-relaxed pt-4">
                            {item.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Contact CTA */}
          <section className="py-16 bg-muted/50">
            <div className="container max-w-3xl text-center">
              <h2 className="text-3xl font-bold mb-4">還有其他問題？</h2>
              <p className="text-xl text-muted-foreground mb-8">
                找不到您想要的答案嗎？歡迎直接聯絡我們，我們會盡快為您解答
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/#contact">
                  <Button size="lg" className="gap-2">
                    <Mail className="h-5 w-5" />
                    聯絡我們
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  onClick={() => window.open('https://line.me/ti/g2/o6oRaGIHTzZ1nEofxnT9Rbv7_ZHAX-rylbJfKA', '_blank')}
                >
                  <MessageCircle className="h-5 w-5" />
                  LINE 官方帳號
                </Button>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
