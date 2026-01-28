import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  Clock, MapPin, Users, Laptop, CheckCircle2, 
  Sparkles, TrendingUp, FileText, Image, Video,
  ChevronRight, Star
} from "lucide-react";
import Course2026RegistrationForm from "@/components/Course2026RegistrationForm";

export default function PublicCourses2026() {
  const [userType, setUserType] = useState<"new" | "returning">("new");
  const [plan, setPlan] = useState<string>("");
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [showSecondPerson, setShowSecondPerson] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"transfer" | "online">("transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Collect form data
      const formData = {
        userType,
        plan,
        planPrice: pricingPlans[userType].find(p => p.id === plan)?.price || 0,
        selectedSessions,
        selectedMonth,
        name1: (document.getElementById('name1') as HTMLInputElement)?.value || '',
        phone1: (document.getElementById('phone1') as HTMLInputElement)?.value || '',
        email1: (document.getElementById('email1') as HTMLInputElement)?.value || '',
        industry1: (document.getElementById('industry') as HTMLInputElement)?.value,
        name2: showSecondPerson ? (document.getElementById('name2') as HTMLInputElement)?.value : undefined,
        phone2: showSecondPerson ? (document.getElementById('phone2') as HTMLInputElement)?.value : undefined,
        email2: showSecondPerson ? (document.getElementById('email2') as HTMLInputElement)?.value : undefined,
        industry2: showSecondPerson ? (document.getElementById('industry2') as HTMLInputElement)?.value : undefined,
        paymentMethod,
        transferLast5: paymentMethod === 'transfer' ? (document.getElementById('transferLast5') as HTMLInputElement)?.value : undefined,
      };

      // Validate required fields
      if (!formData.name1 || !formData.phone1 || !formData.email1) {
        alert('請填寫完整的學員資料');
        setIsSubmitting(false);
        return;
      }

      if (selectedSessions.length === 0) {
        alert('請至少選擇一個場次');
        setIsSubmitting(false);
        return;
      }

      if (!plan) {
        alert('請選擇方案');
        setIsSubmitting(false);
        return;
      }

      // Submit via tRPC (placeholder - will implement later)
      console.log('Form data:', formData);
      alert('報名功能正在開發中，請稍後再試。');
      
    } catch (error) {
      console.error('Submission error:', error);
      alert('報名失敗，請稍後再試。');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    document.title = "2026 AI 實戰應用課 | 阿峰老師 | 讓 AI 真正落地的實戰課程";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', '專為企業與職場人士設計的 AI 課程。涵蓋 ChatGPT, Gemini, Napkin AI, Gamma 簡報實戰。讓 AI 真正落地，提升營運效率。');
    }
  }, []);

  // 定價方案
  const pricingPlans = {
    new: [
      { id: "single", label: "單堂體驗", price: 3000, note: "彈性選擇" },
      { id: "full", label: "4 堂全系列", price: 10000, note: "原價 $12,000 (省 $2,000)" },
      { id: "double", label: "雙人同行 (4堂)", price: 16000, note: "最推薦！每人 $8,000" }
    ],
    returning: [
      { id: "single", label: "舊生複訓 (單堂)", price: 2400, note: "需核對資格" },
      { id: "full", label: "舊生複訓 (4堂)", price: 7000, note: "需核對資格" }
    ]
  };

  // 課程場次（只保留初階 1-4，每個月都會開課）
  const sessions = {
    january: [
      { id: "0120_1", date: "1/20 (二)", time: "9:00-12:00", course: "初階 1" },
      { id: "0127_1", date: "1/27 (二)", time: "9:00-12:00", course: "初階 1" },
      { id: "0120_2", date: "1/20 (二)", time: "13:00-16:00", course: "初階 2" },
      { id: "0127_2", date: "1/27 (二)", time: "13:00-16:00", course: "初階 2" },
      { id: "0122_3", date: "1/22 (四)", time: "9:00-12:00", course: "初階 3" },
      { id: "0128_3", date: "1/28 (三)", time: "9:00-12:00", course: "初階 3" },
      { id: "0122_4", date: "1/22 (四)", time: "13:00-16:00", course: "初階 4" },
      { id: "0128_4", date: "1/28 (三)", time: "13:00-16:00", course: "初階 4" }
    ],
    february: [
      { id: "0203_1", date: "2/3 (二)", time: "9:00-12:00", course: "初階 1" },
      { id: "0203_2", date: "2/3 (二)", time: "13:00-16:00", course: "初階 2" },
      { id: "0205_3", date: "2/5 (四)", time: "9:00-12:00", course: "初階 3" },
      { id: "0205_4", date: "2/5 (四)", time: "13:00-16:00", course: "初階 4" }
    ],
    march: [
      { id: "0305_1", date: "3/5 (四)", time: "9:00-12:00", course: "初階 1" },
      { id: "0312_1", date: "3/12 (四)", time: "9:00-12:00", course: "初階 1" },
      { id: "0305_2", date: "3/5 (四)", time: "13:00-16:00", course: "初階 2" },
      { id: "0312_2", date: "3/12 (四)", time: "13:00-16:00", course: "初階 2" },
      { id: "0311_3", date: "3/11 (三)", time: "9:00-12:00", course: "初階 3" },
      { id: "0324_3", date: "3/24 (二)", time: "9:00-12:00", course: "初階 3" },
      { id: "0311_4", date: "3/11 (三)", time: "13:00-16:00", course: "初階 4" },
      { id: "0324_4", date: "3/24 (二)", time: "13:00-16:00", course: "初階 4" }
    ]
  };

  const scrollToForm = () => {
    document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    if (plan === "double") {
      setShowSecondPerson(true);
    } else {
      setShowSecondPerson(false);
    }
  }, [plan]);

  // Auto-select all sessions when full series is selected
  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    if (plan === "full" || plan === "double") {
      const monthSessions = sessions[month as keyof typeof sessions];
      const sessionIds = monthSessions.map(s => s.id);
      setSelectedSessions(sessionIds);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10"></div>
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight">
              4 堂課做出 4 套可複用 AI 工作流：會議、簡報、圖表、內容一次到位
            </h1>
            
            <p className="text-xl md:text-2xl text-cyan-600 font-medium">
              企業最愛的 AI 實戰課：不是學工具，是把 AI 變成 SOP
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center gap-2 text-slate-700">
                <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                <span>最受企業主喜愛的 AI 實戰課</span>
              </div>
            </div>
            
            <Button 
              size="lg" 
              onClick={scrollToForm}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-900 px-8 py-6 text-lg font-bold shadow-lg shadow-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/70 transition-all"
            >
              立即搶佔 1 月名額 (剩餘席次不多)
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Learning Outcomes */}
      <section className="py-20 md:py-32 bg-slate-100/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              學完這 4 堂課，你的工作效率將產生
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400"> 「光速」</span>
              改變
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="bg-white border-slate-200 hover:border-cyan-500/50 transition-all group">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <Clock className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">會議記錄</h3>
                    <p className="text-slate-700 text-sm">1 小時會議，30 秒生成紀錄與待辦 (Action Items)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 hover:border-cyan-500/50 transition-all group">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <FileText className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">簡報製作</h3>
                    <p className="text-slate-700 text-sm">輸入主題，Gamma/Felo 5 分鐘產出 20 頁商業簡報</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 hover:border-cyan-500/50 transition-all group">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <Image className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">視覺圖表</h3>
                    <p className="text-slate-700 text-sm">告別醜圖！用 Napkin AI 一鍵生成顧問級邏輯圖表</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 hover:border-cyan-500/50 transition-all group">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">知識內化</h3>
                    <p className="text-slate-700 text-sm">NotebookLM 瞬間摘要百頁報告，還能生成 Podcast 對談</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 hover:border-cyan-500/50 transition-all group">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg group-hover:scale-110 transition-transform">
                    <Video className="h-6 w-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">影音量產</h3>
                    <p className="text-slate-700 text-sm">一人抵一個行銷團隊，掌握從腳本到影片生成的完整工作流</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* 上完帶走的交付物 */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-white to-slate-50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              上完帶走的交付物
            </h2>
            <p className="text-slate-600 text-lg">不只學概念，帶走可立即套用的模板與工作流</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-white border-slate-200 hover:border-cyan-500/50 transition-all shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    ①
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      會議紀錄與待辦「30 秒產出」Prompt＋模板
                    </h3>
                    <p className="text-slate-600 text-sm mb-3">
                      一鍵生成會議紀錄、Action Items 和待辦清單
                    </p>
                    <a 
                      href="https://docs.google.com/document/d/1JZ8gQwkXq5GKetfVVMfrErReV-Gf2P8CnxuSmekPDLk/edit?usp=sharing" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-cyan-600 hover:text-cyan-700 text-sm font-medium inline-flex items-center gap-1"
                    >
                      查看範例 <ChevronRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 hover:border-cyan-500/50 transition-all shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    ②
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      市調 → 大綱 → 20 頁簡報的一條龍工作流
                    </h3>
                    <p className="text-slate-600 text-sm mb-3">
                      使用 Gemini Deep Research 從市場調查到完整簡報
                    </p>
                    <a 
                      href="https://gemini.google.com/share/7144f9a02086" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-cyan-600 hover:text-cyan-700 text-sm font-medium inline-flex items-center gap-1"
                    >
                      查看範例 <ChevronRight className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 hover:border-cyan-500/50 transition-all shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    ③
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      顧問級邏輯圖表模板
                    </h3>
                    <p className="text-slate-600 text-sm mb-3">
                      NotebookLM 常用框架：MECE/金字塔/流程圖
                    </p>
                    <div className="flex flex-col gap-2">
                      <a 
                        href="https://notebooklm.google.com/notebook/a311b260-719c-4176-b3a8-c381e6817e9c?artifactId=0f0e2e67-bda2-4d86-8195-4ce4aba5a027" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-600 hover:text-cyan-700 text-sm font-medium inline-flex items-center gap-1"
                      >
                        範例 1 <ChevronRight className="h-4 w-4" />
                      </a>
                      <a 
                        href="https://notebooklm.google.com/notebook/f5e48124-12b2-4eb5-b6f4-526dd66ba35c?artifactId=479293f0-479b-42bd-be7b-dd8735da7190" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-600 hover:text-cyan-700 text-sm font-medium inline-flex items-center gap-1"
                      >
                        範例 2 <ChevronRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 hover:border-cyan-500/50 transition-all shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    ④
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      NotebookLM「百頁資料內化」SOP
                    </h3>
                    <p className="text-slate-600 text-sm mb-3">
                      摘要、QA、學習卡、測驗、Podcast 完整流程
                    </p>
                    <div className="flex flex-col gap-2">
                      <a 
                        href="https://notebooklm.google.com/notebook/d7b931ac-d75d-4bf1-afa1-dc590e0de40c?artifactId=c796ccc9-eecc-4c16-b24f-66641ccf87a5" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-600 hover:text-cyan-700 text-sm font-medium inline-flex items-center gap-1"
                      >
                        學習卡範例 <ChevronRight className="h-4 w-4" />
                      </a>
                      <a 
                        href="https://notebooklm.google.com/notebook/d7b931ac-d75d-4bf1-afa1-dc590e0de40c?artifactId=f42e98f6-a2bf-4278-a079-4023e15fafe2" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-600 hover:text-cyan-700 text-sm font-medium inline-flex items-center gap-1"
                      >
                        測驗範例 <ChevronRight className="h-4 w-4" />
                      </a>
                      <a 
                        href="https://notebooklm.google.com/notebook/d7b931ac-d75d-4bf1-afa1-dc590e0de40c?artifactId=7edba025-1dee-4831-8641-36c9e679bdf3" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-600 hover:text-cyan-700 text-sm font-medium inline-flex items-center gap-1"
                      >
                        Podcast 範例 <ChevronRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 hover:border-cyan-500/50 transition-all shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    ⑤
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      指令庫（文案＋圖片）
                    </h3>
                    <p className="text-slate-600 text-sm mb-3">
                      精選 Prompt 模板庫，開箱即用
                    </p>
                    <div className="flex flex-col gap-2">
                      <a 
                        href="https://ai-tw.manus.space/topics" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-600 hover:text-cyan-700 text-sm font-medium inline-flex items-center gap-1"
                      >
                        文案指令庫 <ChevronRight className="h-4 w-4" />
                      </a>
                      <a 
                        href="https://ai-tw.manus.space/topics" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-600 hover:text-cyan-700 text-sm font-medium inline-flex items-center gap-1"
                      >
                        圖片指令庫 <ChevronRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Course Outline - 課程大綱 */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">課程大綱</h2>
            <p className="text-slate-600 text-lg">4 堂課做出 4 套可複用 AI 工作流</p>
          </div>

          <div className="space-y-8 max-w-5xl mx-auto">
            {/* 初階 1 */}
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-3xl">🟢</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">初階 1:AI 會議革命與資訊整合術</h3>
                    <p className="text-slate-600 mb-4"><strong>目標:</strong> 釋放你的大腦記憶體,建立個人的 AI 數位特助。</p>
                    
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">核心工具:</p>
                      <p className="text-sm text-slate-600">ChatGPT / Gemini / Grok / Perplexity / Felo / 阿峰老師專屬提示詞網站</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">課程內容:</p>
                      <ul className="space-y-2 text-slate-700 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <span><strong>AI 會議記錄實戰:</strong> 使用 LLM 結合語音轉文字,一鍵生成精準會議紀錄、Action Items(執行項目)與待辦清單。</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <span><strong>打造個人化指令庫:</strong> 建立專屬的可重複使用 Prompt 模板,讓 AI 懂你的工作邏輯。</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <span><strong>智慧資訊搜集:</strong> 運用 Perplexity 與 Felo 進行高效資訊檢索,並生成資訊心智圖表。</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-lg border border-cyan-200">
                      <p className="text-sm font-semibold text-slate-900 mb-2">🏆 本堂實戰產出(帶走這兩樣):</p>
                      <ul className="space-y-1 text-sm text-slate-700">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-600">•</span>
                          <span><strong>個人化指令庫(Prompt Library):</strong> 建立好屬於你自己的 AI 溝通模板。</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-600">•</span>
                          <span><strong>可重複使用的「會議記錄模組」:</strong> 未來開會,一鍵生成紀錄與待辦事項。</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 初階 2 */}
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-3xl">🔵</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">初階 2:市場洞察與簡報自動化</h3>
                    <p className="text-slate-600 mb-4"><strong>目標:</strong> 用 AI 的速度,做出顧問級的商業分析與簡報。</p>
                    
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">核心工具:</p>
                      <p className="text-sm text-slate-600">Gemini Deep Research / Grok Deep Search / Gamma / Gemini Canvas / Nano Banana</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">課程內容:</p>
                      <ul className="space-y-2 text-slate-700 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <span><strong>深度市場調查:</strong> 運用 Gemini Deep Research 與 Grok Deep Search 進行競品分析與市場定位。</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <span><strong>商業簡報實戰:</strong> 結合市場調查數據,產出包含市調、定位、結論的完整商業邏輯。</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <span><strong>視覺化資訊圖表:</strong> 使用 Gemini Canvas 搭配 Nano Banana 製作專業數據圖表。</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <span><strong>簡報一鍵生成:</strong> Gamma 簡報工具實戰教學,快速排版與設計。</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-lg border border-cyan-200">
                      <p className="text-sm font-semibold text-slate-900 mb-2">🏆 本堂實戰產出:</p>
                      <ul className="space-y-1 text-sm text-slate-700">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-600">•</span>
                          <span><strong>20 頁商業策略簡報:</strong> 包含完整市調數據、品牌定位分析、結論與視覺化圖表的完整簡報檔(PDF/PPT)。</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 初階 3 */}
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-3xl">🟠</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">初階 3:NotebookLM 專案大腦與輕量開發</h3>
                    <p className="text-slate-600 mb-4"><strong>目標:</strong> 建立「不會說錯話」的專屬知識庫,並利用 AI 輔助開發。</p>
                    
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">核心工具:</p>
                      <p className="text-sm text-slate-600">NotebookLM / Gemini Canvas</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">課程內容:</p>
                      <ul className="space-y-2 text-slate-700 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <span><strong>知識庫建置:</strong> 建立個人學習資料庫或公司產品知識庫(SOP、產品規格),確保 AI 回覆準確不瞎掰。</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <span><strong>業務賦能應用:</strong> 利用 NotebookLM 協助業務回覆客戶產品疑問,甚至建構輕量級雲端 CRM 系統。</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <span><strong>百頁資料內化術:</strong> 針對大量文件(如法規、長篇報告)進行 SOP 摘要、生成 QA、學習卡、測驗題,甚至轉為 Podcast。</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <span><strong>AI 程式撰寫初體驗:</strong> 使用 Gemini Canvas 撰寫簡易程式(如:內部系統 Prototype、零售業抽獎小遊戲、網頁設計)。</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-lg border border-cyan-200">
                      <p className="text-sm font-semibold text-slate-900 mb-2">🏆 本堂實戰產出:</p>
                      <ul className="space-y-1 text-sm text-slate-700">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-600">•</span>
                          <span><strong>NotebookLM 專案資料庫:</strong> 一個訓練好的 AI 專案大腦(個人知識庫或公司客服庫)。</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-600">•</span>
                          <span><strong>1 頁重點摘要(One-pager):</strong> 包含關鍵資訊圖表的專案精華摘要。</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 初階 4 */}
            <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-3xl">🟣</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">初階 4:影像創作與內容行銷策略</h3>
                    <p className="text-slate-600 mb-4"><strong>目標:</strong> 打造吸睛的視覺素材,建立完整的社群流量飛輪。</p>
                    
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">核心工具:</p>
                      <p className="text-sm text-slate-600">Gemini Nano Banana Pro / Grok / Google AI Studio</p>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-semibold text-slate-700 mb-2">課程內容:</p>
                      <ul className="space-y-2 text-slate-700 text-sm">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <span><strong>高質感影像生成:</strong> 運用 Google AI Studio 與 Nano Banana / Pro 模式生成商業級影像。</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <span><strong>靜態影像動態化:</strong> 使用 Grok 讓靜態圖片動起來,增加吸睛度。</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <span><strong>社群經營全攻略:</strong> 結合 AI 擬定社群行銷策略,從文案撰寫到視覺設計一氣呵成。</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-4 rounded-lg border border-cyan-200">
                      <p className="text-sm font-semibold text-slate-900 mb-2">🏆 本堂實戰產出:</p>
                      <ul className="space-y-1 text-sm text-slate-700">
                        <li className="flex items-start gap-2">
                          <span className="text-cyan-600">•</span>
                          <span><strong>社群內容矩陣(10 則以上):</strong> 完成 10 篇完整的社群貼文,包含高品質視覺素材(圖片/動圖)與配套文案,回去直接排程發布。</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center mt-12">
            <div className="flex flex-wrap gap-6 justify-center items-center max-w-4xl mx-auto">
              <img src="/logos/gemini-canvas.png" alt="Gemini Canvas" className="h-12 opacity-70 hover:opacity-100 transition-opacity" />
              <img src="/logos/nano-banana.png" alt="Nano Banana" className="h-12 opacity-70 hover:opacity-100 transition-opacity" />
              <img src="/logos/notebooklm.png" alt="NotebookLM" className="h-12 opacity-70 hover:opacity-100 transition-opacity" />
              <img src="/logos/perplexity.png" alt="Perplexity" className="h-12 opacity-70 hover:opacity-100 transition-opacity" />
              <img src="/logos/grok.png" alt="Grok" className="h-12 opacity-70 hover:opacity-100 transition-opacity" />
              <img src="/logos/gamma.png" alt="Gamma" className="h-12 opacity-70 hover:opacity-100 transition-opacity" />
              <img src="/logos/felo.jpg" alt="Felo" className="h-12 opacity-70 hover:opacity-100 transition-opacity rounded" />
              <img src="/logos/google-ai-studio.png" alt="Google AI Studio" className="h-12 opacity-70 hover:opacity-100 transition-opacity" />
              <img src="/logos/manus.png" alt="Manus" className="h-12 opacity-70 hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 md:py-32 bg-slate-100/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">學員見證</h2>
            <p className="text-slate-600 text-lg">來自各行業的真實反饋</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 italic">
                  「回信率提高 3 倍，不用請昂貴翻譯。」
                </p>
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-slate-900 font-semibold">陳總經理</p>
                  <p className="text-slate-600 text-sm">中小企業老闆 (傳產製造業)</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 italic">
                  「一天產出以前一週的工作量，實戰立刻能用。」
                </p>
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-slate-900 font-semibold">Jessica Lin</p>
                  <p className="text-slate-600 text-sm">行銷部門主管 (零售電商)</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="h-5 w-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 italic">
                  「幾百頁法規報告幾分鐘抓出重點,學費第一個月就賺回來。」
                </p>
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-slate-900 font-semibold">Mark Wu</p>
                  <p className="text-slate-600 text-sm">行政特助 (金融服務業)</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Testimonial Videos */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">學員見證影片</h3>
              <p className="text-slate-600">真實學員分享他們的學習成果</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/X3nILy__5Uo" 
                  title="【學員見證】行銷產業 / 提升工作效率" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/7SNi9iGwuI0" 
                  title="【學員見證】電商產業 / 一週省 6 小時" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/FBIRyZjBLTE" 
                  title="【學員見證】金融產業 / 快速掌握法規重點" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/T5flSp059mU" 
                  title="【學員見證】製造業 / 提高國際溝通效率" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
          </div>

          {/* Course Videos */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">課程實況影片</h3>
              <p className="text-slate-600">看看課程現場的實戰教學</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/C3KLl32pONM" 
                  title="【課程實況】Gamma 簡報實作片段" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/ozmDUTXZOcA" 
                  title="【課程實況】NotebookLM 知識內化" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src="https://www.youtube.com/embed/nDfjU9caVs4" 
                  title="【課程實況】AI 圖像生成實戰" 
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
          </div>

          {/* Instructor */}
          <div className="mt-20 max-w-4xl mx-auto">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="pt-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">講師介紹</h3>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <img 
                    src="/teacher-photo.jpg" 
                    alt="阿峰老師" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-cyan-500/30"
                  />
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">黃敬峰（AI峰哥/阿峰老師）</h4>
                    <p className="text-cyan-600 font-semibold mb-3">台灣企業 AI 商業實戰專家</p>
                    <p className="text-slate-700 leading-relaxed">
                      已協助 <span className="text-cyan-600 font-bold">400+</span> 企業導入 AI 工作流，
                      累計培訓 <span className="text-cyan-600 font-bold">10,000+</span> 學員，
                      完成 <span className="text-cyan-600 font-bold">300+</span> 場次課程。
                      專注於將生成式 AI 轉化為團隊可複用的實戰方案。
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Logistics */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">課程資訊</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <Users className="h-6 w-6 text-cyan-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">適合對象</h3>
                    <ul className="space-y-1 text-slate-700 text-sm">
                      <li>• 完全初學者（無痛入門）</li>
                      <li>• 舊生複訓（更新 AI 大腦）</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <Laptop className="h-6 w-6 text-cyan-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">軟硬體需求</h3>
                    <ul className="space-y-1 text-slate-700 text-sm">
                      <li>• 強烈建議攜帶筆電（效果最佳）</li>
                      <li>• 教學以免費版工具為主</li>
                      <li>• 需準備 Google 帳號</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <Clock className="h-6 w-6 text-cyan-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">上課時間</h3>
                    <p className="text-slate-700 text-sm">上午 9:00-12:00 或 下午 13:00-16:00（每堂 3 小時）</p>
                    <p className="text-cyan-400 text-sm mt-2">補課機制：若無法出席，可轉班至下個月同課程</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <MapPin className="h-6 w-6 text-cyan-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">上課地點</h3>
                    <p className="text-slate-700 text-sm">104625 臺北市中山區民權東路二段42號3樓</p>
                    <p className="text-slate-600 text-xs mt-2">
                      捷運中山國小站 (4號出口) / 行天宮站 (3號出口)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Google Maps */}
          <div className="max-w-5xl mx-auto">
            <Card className="bg-white border-slate-200 overflow-hidden">
              <CardContent className="p-0">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3614.3715837447595!2d121.53287!3d25.062944!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3442a96f8e7e3e8b%3A0x3e3e3e3e3e3e3e3e!2z5Y-w5YyX5biC5Lit5bGx5Y2A5rCR5qyK5p2x6Lev5LqM5q61NDLomZ8y5qiT!5e0!3m2!1szh-TW!2stw!4v1234567890123"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full"
                ></iframe>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* 適合這些人 */}
      <section className="py-20 md:py-32 bg-slate-100/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              適合這些人（任一符合就很適合）
            </h2>
            <p className="text-slate-600 text-lg">無論你的角色是什麼，AI 都能成為你的超能力</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card className="bg-white border-slate-200 hover:border-cyan-500/50 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      行銷/品牌/電商
                    </h3>
                    <p className="text-slate-700 text-sm">
                      要更快做簡報、社群內容、影片
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 hover:border-cyan-500/50 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      主管/老闆/業務
                    </h3>
                    <p className="text-slate-700 text-sm">
                      要把 AI 變成團隊 SOP，不是個人玩具
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 hover:border-cyan-500/50 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      行政/助理/PM
                    </h3>
                    <p className="text-slate-700 text-sm">
                      要把會議、報告、彙整變成半自動
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 hover:border-cyan-500/50 transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      顧問/講師
                    </h3>
                    <p className="text-slate-700 text-sm">
                      要把資料消化與圖表呈現做到顧問級
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 課後支持與保證 */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              課後支持與保證
            </h2>
            <p className="text-slate-600 text-lg">學習不孤單，持續支援你的 AI 之旅</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-8 w-8 text-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      課後 QA 群（Line 群）集中答疑
                    </h3>
                    <p className="text-slate-700 text-sm">
                      加入專屬 LINE 群組，隨時提問，阿峰老師和助教團隊即時解答
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="h-8 w-8 text-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      提供指令模板包下載＋網站清單
                    </h3>
                    <p className="text-slate-700 text-sm">
                      含免費版可用範圍說明，讓你課後立即上手
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-32 bg-slate-100/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              常見問題 FAQ
            </h2>
            <p className="text-slate-600 text-lg">解答你的疑問，讓報名更安心</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  1. 需要會寫程式嗎？
                </h3>
                <p className="text-slate-700">
                  <strong>不需要。</strong>課程含指令模板，只要會複製貼上就能上手。我們專注於實戰應用，不是寫程式。
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  2. 工具都要付費嗎？免費版能做到哪些？
                </h3>
                <p className="text-slate-700">
                  <strong>免費版工具為主。</strong>課程使用的工具大多有免費版本，已足夠完成課程內容。若有付費建議，會推薦購買 Gemini（性價比最高）。
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  3. 沒帶筆電可以嗎？
                </h3>
                <p className="text-slate-700">
                  <strong>強烈建議帶筆電。</strong>雖然手機也能操作部分工具，但筆電的操作效率和學習效果會好很多。
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  4. 會不會教太多工具學不完？
                </h3>
                <p className="text-slate-700">
                  <strong>不會。</strong>課程以 AI 工作流為主，阿峰老師的重點是帶領大家去構思工作上面該如何應用，而不是堆疊工具清單。
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  5. 錯過可以補課/轉班嗎？
                </h3>
                <p className="text-slate-700">
                  <strong>可以的。</strong>若無法出席，可轉班至下個月同課程，彈性安排學習時間。
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  6. 可以開公司發票/統編嗎？
                </h3>
                <p className="text-slate-700">
                  <strong>可以的。</strong>報名時請在備註欄填寫公司統編和抬頭，我們會開立三聯式發票。
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200">
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  7. 付款方式有哪些？
                </h3>
                <p className="text-slate-700">
                  <strong>匯款/刷卡。</strong>支援銀行轉帳和線上刷卡兩種方式，選擇最方便的付款方式即可。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>



      {/* Pricing */}
      <section className="py-20 md:py-32 bg-slate-100/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">課程方案</h2>
            <p className="text-slate-600 text-lg">選擇最適合您的學習方案</p>
          </div>

          <div className="max-w-5xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-4 text-slate-900 font-bold">方案</th>
                  <th className="text-left p-4 text-slate-900 font-bold">對象</th>
                  <th className="text-left p-4 text-slate-900 font-bold">價格</th>
                  <th className="text-left p-4 text-slate-900 font-bold">備註</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <tr className="border-b border-slate-200/50 hover:bg-slate-800/30">
                  <td className="p-4">單堂體驗</td>
                  <td className="p-4">新生</td>
                  <td className="p-4 font-bold text-slate-900">$3,000 / 堂</td>
                  <td className="p-4 text-sm">彈性選擇</td>
                </tr>
                <tr className="border-b border-slate-200/50 hover:bg-slate-800/30">
                  <td className="p-4">4 堂全系列</td>
                  <td className="p-4">新生</td>
                  <td className="p-4 font-bold text-slate-900">$10,000</td>
                  <td className="p-4 text-sm">原價 $12,000 <span className="text-amber-400">(省 $2,000)</span></td>
                </tr>
                <tr className="border-b border-slate-200/50 bg-gradient-to-r from-amber-500/10 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20">
                  <td className="p-4 font-bold">雙人同行 (4堂)</td>
                  <td className="p-4">新生</td>
                  <td className="p-4 font-bold text-amber-400 text-lg">$8,000/每人</td>
                  <td className="p-4 text-sm">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded text-amber-600 font-semibold">
                      <Sparkles className="h-3 w-3" />
                      最推薦！
                    </span>
                    <br />
                    每人 $8,000 <span className="text-amber-400">(總價 $16,000)</span>
                  </td>
                </tr>
                <tr className="border-b border-slate-200/50 hover:bg-slate-800/30">
                  <td className="p-4">舊生複訓 (單堂)</td>
                  <td className="p-4">舊生</td>
                  <td className="p-4 font-bold text-slate-900">$2,400 / 堂</td>
                  <td className="p-4 text-sm text-slate-600">需核對資格</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="p-4">舊生複訓 (4堂)</td>
                  <td className="p-4">舊生</td>
                  <td className="p-4 font-bold text-slate-900">$7,000</td>
                  <td className="p-4 text-sm text-slate-600">需核對資格</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Registration Form */}
      <section id="registration-form" className="py-20 md:py-32">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <Card className="bg-white border-slate-200">
              <CardContent className="pt-8">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">立即報名</h2>
                  <p className="text-slate-600">填寫表單，讓 AI 成為你的超能力</p>
                </div>
                <Course2026RegistrationForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Sticky CTA for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-950/95 backdrop-blur-sm border-t border-slate-800 md:hidden z-50">
        <Button 
          onClick={scrollToForm}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-slate-900 font-bold shadow-lg shadow-cyan-500/50"
        >
          立即報名
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Footer />
    </div>
  );
}
