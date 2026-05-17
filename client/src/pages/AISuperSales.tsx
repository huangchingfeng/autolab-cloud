import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import AISuperSalesRegistrationForm from "@/components/AISuperSalesRegistrationForm";

export default function AISuperSales() {
  const scrollToSignup = () => {
    const signupSection = document.getElementById('signup');
    if (signupSection) {
      signupSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Hero Section - 奧美風格：大量留白、精煉文案 */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-[#0A1628] leading-tight">
              業務不用再追客戶
            </h1>
            <p className="text-2xl md:text-3xl text-[#1E3A5F] font-light">
              讓 AI 幫你研究客戶、提案、跟進、開發
            </p>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent max-w-md mx-auto" />

          <div className="space-y-6">
            <h2 className="text-xl md:text-2xl text-[#0A1628]">
              AI 超級業務實戰班 — 免費四堂課
            </h2>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-[#1E3A5F]">
              <span>完全免費</span>
              <span className="text-[#F59E0B]">•</span>
              <span>每堂 1 小時</span>
              <span className="text-[#F59E0B]">•</span>
              <span>線上直播</span>
            </div>

            <Button 
              onClick={scrollToSignup}
              className="bg-[#F59E0B] hover:bg-[#D97706] text-white text-lg px-12 py-6 rounded-none font-medium"
            >
              免費報名
            </Button>

            <p className="text-sm text-[#1E3A5F]/70">
              3/6 開課 | 共 4 堂 | 每堂限額 100 人
            </p>
          </div>
        </div>
      </section>

      {/* Pain Points Section - 奧美風格：簡潔列表 */}
      <section className="bg-[#F8F9FA] py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0A1628] text-center mb-16">
              你還在這樣做業務嗎？
            </h2>

            <div className="space-y-6">
              {[
                "拜訪前花很多時間研究客戶，資料散落各處整理不起來",
                "客戶問到競品、規格、細節，常常只能說「我回去查」",
                "開完會太忙沒整理，跟進漏掉、下次又從頭來",
                "客戶跑完了不知道去哪找新的，陌生開發效率很低",
                "你知道要進步，但不想學一堆工具，只想學「業務真的用得上」的"
              ].map((pain, index) => (
                <div key={index} className="flex items-start gap-4 py-4 border-b border-[#E5E7EB] last:border-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mt-2.5 flex-shrink-0" />
                  <p className="text-lg text-[#1E3A5F]">{pain}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center space-y-6">
              <p className="text-2xl md:text-3xl font-bold text-[#0A1628]">
                不是 AI 會取代你，<br />
                是「會用 AI 的業務」會取代你。
              </p>
              <p className="text-xl text-[#1E3A5F]/80">
                所以我準備了 4 堂免費課，讓你從追趕變成領先。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section - 奧美風格：清晰的課程卡片 */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0A1628] mb-4">
              四堂課，直接打通業務全流程
            </h2>
            <p className="text-xl text-[#1E3A5F]/80">
              一次報名，四堂都能上（完全免費）
            </p>
          </div>

          {/* Process Flow */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {["拜訪前摸透客戶", "開會即時軍師", "會後追到成交", "AI 幫你挖客戶"].map((step, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-[#F59E0B] font-bold text-lg">{index + 1}</span>
                <span className="text-[#1E3A5F]">{step}</span>
              </div>
            ))}
          </div>

          {/* Course Cards */}
          <div className="space-y-8">
            {/* Class 1 */}
            <Card className="border-2 border-[#E5E7EB] hover:border-[#F59E0B] transition-colors">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-[#F59E0B] bg-[#FEF3C7] px-3 py-1">第一堂</span>
                    <span className="text-sm text-[#1E3A5F]/70">3/6（五）19:30-20:30</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#0A1628]">拜訪前，AI 幫你摸透客戶</h3>
                  <p className="text-[#F59E0B] font-medium">別人準備 3 天，你只要 30 分鐘</p>
                  <div className="space-y-2 text-[#1E3A5F]">
                    <p><strong>解決：</strong>拜訪前研究太久、資料散、問不出好問題、簡報不專業</p>
                    <p><strong>上完你會：</strong>30 分鐘研究報告、掌握痛點/競品/動態、做出客製簡報</p>
                    <p><strong>帶走：</strong>研究報告/作戰卡模板/提案簡報各 1 份</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Class 2 */}
            <Card className="border-2 border-[#E5E7EB] hover:border-[#F59E0B] transition-colors">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-[#F59E0B] bg-[#FEF3C7] px-3 py-1">第二堂</span>
                    <span className="text-sm text-[#1E3A5F]/70">3/13（五）19:30-20:30</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#0A1628]">開會時，AI 當你的即時軍師</h3>
                  <p className="text-[#F59E0B] font-medium">客戶問什麼，你都答得出來</p>
                  <div className="space-y-2 text-[#1E3A5F]">
                    <p><strong>解決：</strong>規格記不住、競品答不出、臨時被問只能回去查、客戶資訊裝不下</p>
                    <p><strong>上完你會：</strong>產品知識庫、客戶資料庫、會議中 3 秒查答案</p>
                    <p><strong>帶走：</strong>產品知識庫 1 個、客戶資料庫 1 個（3 位客戶）、QA 工作流、提問清單</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Class 3 */}
            <Card className="border-2 border-[#E5E7EB] hover:border-[#F59E0B] transition-colors">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-[#F59E0B] bg-[#FEF3C7] px-3 py-1">第三堂</span>
                    <span className="text-sm text-[#1E3A5F]/70">3/21（六）12:00-13:00</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#0A1628]">會議後，AI 幫你追到成交</h3>
                  <p className="text-[#F59E0B] font-medium">不再忘記跟進，不再漏掉客戶</p>
                  <div className="space-y-2 text-[#1E3A5F]">
                    <p><strong>解決：</strong>會後沒整理、跟進漏掉、要做紀錄簡報 Email 時間不夠、想關心不知怎麼開口</p>
                    <p><strong>上完你會：</strong>10 分鐘整理紀錄、自動產出客戶資料、AI 幫你寫跟進與關心訊息</p>
                    <p><strong>帶走：</strong>會議紀錄模板/會後簡報/跟進模板/客戶關心 SOP</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Class 4 */}
            <Card className="border-2 border-[#E5E7EB] hover:border-[#F59E0B] transition-colors">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-[#F59E0B] bg-[#FEF3C7] px-3 py-1">第四堂</span>
                    <span className="text-sm text-[#1E3A5F]/70">3/27（五）19:30-20:30</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#0A1628]">AI 幫你挖出新客戶</h3>
                  <p className="text-[#F59E0B] font-medium">不再只靠人脈，系統化開發陌生客戶</p>
                  <div className="space-y-2 text-[#1E3A5F]">
                    <p><strong>解決：</strong>客戶跑完不知去哪找、陌生開發效率低、不知道怎麼接觸陌生人、開發信沒人回</p>
                    <p><strong>上完你會：</strong>用 AI 找潛在客戶、寫開發信/LinkedIn 訊息、設計陌生開發流程</p>
                    <p><strong>帶走：</strong>潛在客戶清單（10 家）、開發信模板、LinkedIn 模板、開發 SOP</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Instructor Section - 奧美風格：簡潔專業 */}
      <section className="bg-[#F8F9FA] py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <img 
                  src="/teacher-photo.jpg"
                  alt="阿峰老師"
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-[#0A1628]">講師介紹</h2>
                <h3 className="text-xl text-[#F59E0B] font-medium">黃敬峰（阿峰老師）</h3>
                <div className="space-y-3 text-[#1E3A5F]">
                  <p>企業 AI 職場實戰專家</p>
                  <p>協助超過 400 家企業與政府單位導入 AI 工作流</p>
                  <p>累計培訓 10,000+ 學員</p>
                  <p>完成 300+ 場次課程</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section - 奧美風格：清晰問答 */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0A1628] text-center mb-16">
            常見問題
          </h2>

          <div className="space-y-8">
            {[
              {
                q: "真的完全免費嗎？",
                a: "是的，這四堂課完全免費。我希望讓更多業務夥伴體驗 AI 如何改變工作方式。"
              },
              {
                q: "需要有 AI 基礎嗎？",
                a: "不需要。課程從零開始，專為「沒時間學一堆工具」的業務設計，只教你真正用得上的。"
              },
              {
                q: "上課需要準備什麼？",
                a: "一台電腦、網路連線、以及你目前遇到的業務困擾。課程中會實作，建議準備真實案例。"
              },
              {
                q: "錯過直播可以看重播嗎？",
                a: "可以。報名後會提供錄影連結，但建議參加直播，可以即時提問和互動。"
              },
              {
                q: "適合哪些產業的業務？",
                a: "B2B、B2C 都適合。只要你的工作涉及「研究客戶、提案、跟進、開發」，就能直接應用。"
              }
            ].map((faq, index) => (
              <div key={index} className="border-b border-[#E5E7EB] pb-8 last:border-0">
                <h3 className="text-xl font-bold text-[#0A1628] mb-3">{faq.q}</h3>
                <p className="text-[#1E3A5F]">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Registration Form Section - 奧美風格：簡潔表單 */}
      <section id="signup" className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0A1628] mb-4">
              準備好讓 AI 成為你的業務夥伴了嗎？
            </h2>
            <p className="text-xl text-[#1E3A5F]/80">
              免費報名四堂課，從此不再追客戶
            </p>
            <p className="text-sm text-[#1E3A5F]/70 mt-4">
              3/6 開課 | 每堂限額 100 人 | 額滿關閉
            </p>
          </div>

          <AISuperSalesRegistrationForm />
        </div>
      </section>

      <Footer />
    </div>
  );
}
