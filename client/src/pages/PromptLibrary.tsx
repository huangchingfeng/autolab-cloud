import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import PromptComparisonTable from "@/components/PromptComparisonTable";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function PromptLibrary() {
  useEffect(() => {
    document.title = "提示詞庫 - AI Prompt 中英文對照範例 | AI峰哥";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        '阿峰老師精選的 AI 提示詞庫，提供中英文對照範例，涵蓋工作、學習、創意等多種應用場景。'
      );
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Breadcrumb items={[{ label: "提示詞庫" }]} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <div className="text-center space-y-6 mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary font-medium text-sm mb-4">
                <Sparkles className="w-4 h-4" />
                <span>阿峰老師精選提示詞</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                AI 提示詞庫
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                精選實用的 AI 提示詞範例，提供<strong className="text-foreground">中英文對照</strong>，
                涵蓋工作、學習、創意等多種應用場景。每個提示詞都經過阿峰老師的在地化調整，
                更符合台灣使用者的需求。
              </p>
            </div>

            {/* 使用說明 */}
            <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 to-accent/5 border-2 border-primary/20">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📋</span>
                    </div>
                    <h3 className="font-semibold text-foreground">中英文對照</h3>
                    <p className="text-sm text-muted-foreground">
                      左欄中文、右欄英文，一目了然
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📄</span>
                    </div>
                    <h3 className="font-semibold text-foreground">一鍵複製</h3>
                    <p className="text-sm text-muted-foreground">
                      點擊複製按鈕，快速使用
                    </p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">💡</span>
                    </div>
                    <h3 className="font-semibold text-foreground">實戰解析</h3>
                    <p className="text-sm text-muted-foreground">
                      阿峰老師親自解析應用技巧
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 提示詞範例區 */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container max-w-6xl">
            <div className="space-y-8">
              {/* 範例 1：客製化運動週期規劃 */}
              <PromptComparisonTable
                showNumber
                number={1}
                title="客製化運動週期規劃 (Periodization Planning)"
                analysis="很多同學健身失敗，是因為採用了「通用型」的課表，忽略了台灣的氣候與場地限制。這組提示詞的核心價值在於「情境感知」。你向 AI 提供的參數（如：目標賽事、每週頻率、居住地限制）越精確，它生成的模型就越具備可行性。例如針對台灣潮濕多雨的氣候，我們可以設定室內替代方案。"
                chinesePrompt="我想在 12 月參加臺北馬拉松。我最近剛以 2 小時的成績跑完半馬，每週可以訓練 5 天。請建立一份月度訓練計畫，幫助我持續增強耐力。考量到台灣夏季炎熱多雨，請幫我將雨天的訓練調整為健身房跑步機菜單。"
                englishPrompt="I want to run the Taipei Marathon in December. I recently finished a half marathon in 2 hours, and I can train 5 days a week. Create a monthly training plan that will help me continue to build my endurance. Considering Taiwan's hot and rainy summers, please adjust rainy day sessions to treadmill workouts."
              />

              {/* 範例 2：專案管理式的居家斷捨離 */}
              <PromptComparisonTable
                showNumber
                number={2}
                title="專案管理式的居家斷捨離 (Task Decomposition)"
                analysis="面對雜亂的環境，大腦容易產生「認知過載」(Cognitive Overload)。這組指令運用了專案管理中的「工作分解結構」(WBS) 概念，將龐大的「整理」目標，拆解為每日 20 分鐘的微任務。對於居住在都會區小坪數套房的同學來說，空間利用率 (Space Utilization) 至關重要。"
                chinesePrompt="我想在這個月整理並為我在台北的租屋處進行斷捨離。請建立一個 30 天計畫，將過程拆解為簡單的每日任務，每項任務不超過 20 分鐘，且不需要我購買任何收納新品。請特別針對小坪數套房的空間利用提供建議。"
                englishPrompt="I want to organize and declutter my rental apartment in Taipei this month. Create a 30-day plan that breaks the process into simple, daily tasks that take no more than 20 minutes each and won't require me to purchase any new storage items. Please provide specific advice for optimizing small living spaces."
              />

              {/* 範例 3：沉浸式語言學習 */}
              <PromptComparisonTable
                showNumber
                number={3}
                title="沉浸式語言學習與主動回想 (Active Recall)"
                analysis="傳統語言學習效率低落，往往是因為缺乏「輸出」與「即時回饋」。這組提示詞將 AI 定義為你的教學設計師 (Instructional Designer)。透過生成「互動式測驗」與「閃卡 (Flashcards)」，我們能利用「間隔重複」(Spaced Repetition) 的原理來強化記憶。這對於想進入外商或計畫去日本旅遊的同學來說，是掌握外語最科學的路徑。"
                chinesePrompt="我想學習基礎日文，目標是年底去東京自由行。請針對旅遊會話主題生成一份 30 天引導式學習計畫，並針對動詞變化建立一個互動式的多選題測驗。另外，請為這 50 個實用短語生成一組閃卡。"
                englishPrompt="I'd like to learn basic Japanese for my upcoming trip to Tokyo at the end of the year. Generate a 30-day guided learning plan focused on travel conversation topics and create an interactive multiple-choice quiz on verb conjugations. Please also generate a set of flashcards for the 50 practical phrases."
              />

              {/* 範例 4：行為面試模擬 */}
              <PromptComparisonTable
                showNumber
                number={4}
                title="行為面試模擬與非語言溝通分析 (Behavioral Interview Strategy)"
                analysis="面試不僅是回答問題，更是一場關於專業形象的展演。這組提示詞利用 AI 進行「情境模擬」，特別針對 STAR 原則（情境、任務、行動、結果）進行行為面試訓練。在台灣競爭激烈的科技業或金融業求職中，精準的表達與肢體語言分析將是你的決勝關鍵。"
                chinesePrompt="我下週有一個內湖科學園區科技公司的 [職位名稱] 面試。請與我進行一場即時、對話式的模擬面試，重點放在行為面試問題。接著，在我上傳練習影片後，請提供一份詳細的回饋報告，分析我的說話節奏、肢體語言以及贅字的使用。"
                englishPrompt="I have a job interview next week for a [role] at a tech company in Neihu Science Park. Simulate a live, conversational interview with me, focusing on behavioral questions. Second, create a detailed feedback report after I upload my video rehearsal, analyzing my speaking pace, body language, and use of filler words."
              />

              {/* 範例 5：飲食營養的供應鏈管理 */}
              <PromptComparisonTable
                showNumber
                number={5}
                title="飲食營養的供應鏈管理 (Nutritional Logistics)"
                analysis="健康飲食最難的往往不是「吃」，而是「決策」與「採購」。這組指令其實是在建立一套個人的「飲食供應鏈系統」。我們可以結合台灣方便的採購渠道（如全聯、家樂福），解決決策疲勞 (Decision Fatigue)，並產出精確的採購清單，確保你的執行端（廚房）與供應端（超市）無縫接軌。"
                chinesePrompt="我想吃得更健康。請在每週日早上 9 點建立一份為期 7 天、高蛋白且素食者友善的晚餐計畫。我每天晚上大約有 45 分鐘的烹飪時間。請包含該週的採買清單，食材請以全聯福利中心或傳統市場容易買到的為主。"
                englishPrompt="I want to eat healthier. Every Sunday at 9 a.m., please create a 7-day, high-protein and vegetarian-friendly dinner plan. I have about 45 minutes to cook each night. Include a grocery list for the week, prioritizing ingredients easily available at PX Mart or traditional markets in Taiwan."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <Card className="max-w-4xl mx-auto bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
              <CardContent className="py-12">
                <div className="text-center space-y-6">
                  <h2 className="text-3xl font-bold">想學習更多提示詞技巧？</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    以上只是部分精選範例。在阿峰老師的課程中，您將學習到完整的 Prompt 工程思維與實戰技巧。
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <a
                      href="/2026-ai-course"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
                    >
                      查看公開課
                    </a>
                    <a
                      href="/contact"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-11 px-8"
                    >
                      聯繫洽詢
                    </a>
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
