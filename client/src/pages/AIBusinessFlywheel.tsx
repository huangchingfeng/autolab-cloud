import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  UserX, Scale, Clock, Linkedin, Building2,
  Target, Sparkles, Layers, TrendingUp,
  MapPin, Users, Gift, CheckCircle2,
  ChevronDown, ChevronUp, Quote,
  Briefcase, UserCheck, GraduationCap, Mic, Wallet, Camera, XCircle
} from "lucide-react";

export default function AIBusinessFlywheel() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showFloatingCta, setShowFloatingCta] = useState(false);

  useEffect(() => {
    document.title = "AI 業務飛輪實戰班｜專為 B2B 業務、顧問、專業服務設計的個人品牌課程";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', '專為 B2B 業務、獨立顧問、專業服務創業者設計。6 小時學會用 AI 打造個人品牌，讓高價值客戶主動找上門。從「被比價」變成「被指名」。報名贈 AI 飛輪系統永久使用。');
    }
  }, []);

  // 監聽滾動，顯示浮動 CTA
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingCta(window.scrollY > window.innerHeight);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToForm = () => {
    document.getElementById('registration-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // 痛點資料
  const painPoints = [
    { icon: UserX, text: "專業能力很強，但客戶第一時間想到的不是你" },
    { icon: Scale, text: "每次提案都在跟低價競爭，客戶只看報價" },
    { icon: Clock, text: "成交週期太長，客戶考慮到最後選了別人" },
    { icon: Linkedin, text: "想經營 LinkedIn / 社群，但不知道 B2B 內容怎麼寫" },
    { icon: Building2, text: "公司沒有行銷資源，只能靠自己想辦法" },
  ];

  // 課程大綱
  const curriculum = [
    {
      unit: "單元一",
      time: "09:00 - 10:00",
      title: "專業定位",
      points: [
        "找到你的獨特價值主張（UVP）",
        "分析目標客戶的決策路徑",
        "定位你在市場上的專業切角"
      ],
      outcome: "一句話說清楚「為什麼要找你」"
    },
    {
      unit: "單元二",
      time: "10:15 - 11:15",
      title: "第一篇深度內容",
      points: [
        "B2B / 高單價內容的寫法",
        "用 AI 產出有洞見的專業文章",
        "現場完成一篇可發布的內容"
      ],
      outcome: "一篇展現專業深度的文章"
    },
    {
      unit: "單元三",
      time: "11:30 - 12:30",
      title: "內容靈感系統",
      points: [
        "5 大高價值內容來源",
        "把專業知識轉化為內容素材",
        "建立你的內容彈藥庫"
      ],
      outcome: "未來 3 個月的內容主題清單"
    },
    {
      unit: "單元四",
      time: "13:30 - 14:30",
      title: "高效內容生產線",
      points: [
        "黃金三角提示詞公式",
        "一文多用：深度文 → 多平台內容",
        "LinkedIn / FB / 電子報的內容策略"
      ],
      outcome: "掌握高效產出的完整流程"
    },
    {
      unit: "單元五",
      time: "14:45 - 15:45",
      title: "品牌飛輪系統",
      points: [
        "從曝光到成交的 6 階段路徑",
        "設計你的客戶獲取漏斗",
        "讓內容自動篩選對的客戶"
      ],
      outcome: "你的專屬飛輪系統藍圖"
    },
    {
      unit: "單元六",
      time: "16:00 - 17:00",
      title: "專業形象包裝",
      points: [
        "AI 製作專業封面與配圖",
        "把文章轉成提案簡報",
        "建立一致的視覺識別"
      ],
      outcome: "專業質感的視覺素材"
    }
  ];

  // 學員見證
  const testimonials = [
    {
      quote: "從一年接 10 場，變成一年接 50 場",
      detail: "以前我只能等企業 HR 轉介紹，很被動。開始經營 LinkedIn 後，現在企業主動來找我的比例超過 60%。最重要的是，這些客戶來的時候已經看過我的內容，知道我的教學風格，不用再花時間說服。報價也從單場 3 萬提高到 5 萬，因為他們是指名要我。",
      name: "Kevin",
      title: "企業培訓講師｜從業 8 年"
    },
    {
      quote: "高單價客戶終於不用再比價了",
      detail: "做品牌顧問最怕的就是客戶只看價格。以前提案 10 個，成交 2 個，還要被殺價。現在我固定發品牌策略的深度文章，來找我的客戶都是看了內容覺得「就是你了」。上個月成交一個年約 80 萬的案子，對方說：「我追蹤你半年了，一直在等預算。」",
      name: "Michelle",
      title: "品牌策略顧問｜創業 5 年"
    },
    {
      quote: "從 cold call 到 warm lead",
      detail: "以前開發企業客戶，第一通電話就被掛掉。現在我在 LinkedIn 分享數位轉型的案例，企業的 IT 主管會主動來詢問。最大的差別是，見面的時候他們已經信任我了，不用從零開始建立關係，直接談需求。今年的業績是去年的 1.5 倍。",
      name: "James",
      title: "B2B 軟體業務｜從業 6 年"
    },
    {
      quote: "終於不用在銀行門口發傳單了",
      detail: "以前為了找高資產客戶，什麼方法都試過。現在我每週發一篇財務規劃的觀點文，高資產客戶會主動來諮詢。這些客戶的資產規模都是千萬以上，而且是認同我的理念才來，不是被推銷來的。",
      name: "Emily",
      title: "獨立財務顧問｜從業 10 年"
    },
    {
      quote: "從接婚攝到接品牌案",
      detail: "以前我主要接婚禮攝影，單價 3-5 萬。開始經營個人品牌後，品牌客戶開始找上門。現在一半以上的案子是品牌形象照、商品攝影，單案金額從 5 萬提升到 15-20 萬。關鍵是，我不用再去比價平台上面競爭了。",
      name: "阿德",
      title: "商業攝影師｜創業 7 年"
    },
    {
      quote: "LinkedIn 帶來的案子，比我主動開發還多",
      detail: "做 HR 顧問，以前都是靠人脈介紹。開始在 LinkedIn 分享人才管理的觀點後，企業的人資長會主動來詢問服務。上個月有一間上市公司的 CHRO 來找我，說他追蹤我一年了，終於有專案可以合作。這種「被等待」的感覺，真的很不一樣。",
      name: "雅琪",
      title: "人資管理顧問｜從業 12 年"
    },
    {
      quote: "案子從我去提案，變成客戶排隊等我",
      detail: "以前在設計平台上接案，要跟幾十個設計師競爭。現在我在 IG 和部落格分享設計理念，客戶來的時候都說「我就是喜歡你的風格」。現在的困擾變成：案子太多，要排隊等 3 個月。",
      name: "Mia",
      title: "室內設計工作室創辦人｜創業 4 年"
    },
    {
      quote: "從 B2C 小客戶，轉型 B2B 企業客戶",
      detail: "以前我的教練服務主要是個人客戶，單次 3000。開始經營專業內容後，企業的 L&D 部門開始找我。現在我主要做企業內訓和主管教練，單案金額從幾千變成幾十萬。內容真的是轉型最好的槓桿。",
      name: "志明",
      title: "企業教練｜從業 6 年"
    }
  ];

  // FAQ 資料
  const faqs = [
    {
      q: "我是做 B2B 的，內容行銷真的有用嗎？",
      a: "B2B 的決策週期長，更需要內容建立信任。根據研究，70% 的 B2B 買家在聯繫業務前就已經上網做過功課。如果他們搜不到你，機會就給了競爭對手。"
    },
    {
      q: "我的產業很專業/小眾，寫的內容有人看嗎？",
      a: "小眾市場反而更適合內容行銷。你不需要 10 萬粉絲，你需要的是 100 個精準的潛在客戶。這堂課會教你怎麼寫「對的人一定會看」的內容。"
    },
    {
      q: "我真的很忙，沒時間經營內容怎麼辦？",
      a: "這就是為什麼要學 AI。用這套方法，一篇深度文章 30 分鐘內可以完成，而且可以一文多用，一篇變五篇。每週花 1-2 小時就能維持穩定產出。"
    },
    {
      q: "AI 寫的東西不是很沒溫度嗎？",
      a: "關鍵在於你怎麼使用。這堂課教的不是讓 AI 幫你寫，而是讓 AI 幫你「放大」。觀點是你的，洞見是你的，AI 只是讓你更有效率。"
    },
    {
      q: "我已經有在經營社群了，這堂課對我還有幫助嗎？",
      a: "如果你目前的內容沒有帶來客戶詢問，那問題可能出在「系統」而不是「努力」。這堂課會幫你診斷問題，建立完整的獲客路徑。"
    },
    {
      q: "這堂課跟其他 AI 課程有什麼不同？",
      a: "市面上的課程教「工具」，這堂課教「變現」。學會下指令只是 10%，知道怎麼變成客戶才是 90%。我們教的是完整的商業系統，不是單純的技術操作。"
    }
  ];

  // 6 大適合對象（詳細版）
  const targetAudienceDetailed = [
    {
      icon: Briefcase,
      type: "B2B 業務",
      description: "高單價、長週期、企業方案",
      need: "讓客戶見面前就信任你"
    },
    {
      icon: UserCheck,
      type: "獨立顧問",
      description: "品牌/行銷/人資/財務顧問",
      need: "不再被比價"
    },
    {
      icon: GraduationCap,
      type: "專業服務創業者",
      description: "律師、會計師、設計師",
      need: "讓專業被看見"
    },
    {
      icon: Mic,
      type: "企業講師/教練",
      description: "內訓講師、高管教練",
      need: "被企業指名邀約"
    },
    {
      icon: Wallet,
      type: "高單價業務",
      description: "高資產客戶、企業保險",
      need: "高資產客戶主動來"
    },
    {
      icon: Camera,
      type: "專業領域創業家",
      description: "攝影師、婚顧、活動策劃",
      need: "脱離比價平台"
    }
  ];

  // 不適合對象
  const notSuitableFor = [
    "期待上完課隔天就有客戶",
    "不願意公開分享專業知識",
    "只想學工具，不想學商業思維",
    "產品沒有差異化，純拼價格"
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Section 1: Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#1A3C6E' }}>
        {/* 背景裝飾 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-72 h-72 bg-amber-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container relative z-10 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm">
              <span>專為 B2B 業務 ╳ 顧問 ╳ 高單價服務設計</span>
            </div>
            
            {/* 主標題 */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight" style={{ fontFamily: "'Noto Serif TC', serif" }}>
              你的專業值得被看見<br />
              讓對的客戶，<span style={{ color: '#D4AF37' }}>主動找上門</span>
            </h1>
            
            {/* 副標題 */}
            <p className="text-xl md:text-2xl text-white/80">
              6 小時學會用 AI 打造個人品牌<br />
              從「追客戶」變成「被指名」
            </p>
            
            {/* CTA 按鈕 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg"
                onClick={scrollToForm}
                className="px-8 py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                style={{ backgroundColor: '#D4AF37', color: '#1A3C6E' }}
              >
                立即報名 NT$9,000
              </Button>
            </div>
            
            {/* 信任徽章 */}
            <div className="flex flex-wrap justify-center gap-6 pt-8 text-white/90 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" style={{ color: '#D4AF37' }} />
                <span>專為高單價、長週期銷售設計</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" style={{ color: '#D4AF37' }} />
                <span>適合 B2B 業務、顧問、專業服務</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" style={{ color: '#D4AF37' }} />
                <span>現場實作 + 專屬 AI 系統</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Pain Points */}
      <section className="py-20 md:py-32" style={{ backgroundColor: '#F4F6F8' }}>
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#333333', fontFamily: "'Noto Serif TC', serif" }}>
              這些困境，是不是很熟悉？
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {painPoints.map((point, index) => (
              <Card key={index} className="bg-white border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-red-100">
                      <point.icon className="h-6 w-6 text-red-500" />
                    </div>
                    <p className="text-lg" style={{ color: '#333333' }}>{point.text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* 轉折句 */}
          <div className="text-center mt-16 max-w-2xl mx-auto">
            <p className="text-xl md:text-2xl" style={{ color: '#555555' }}>
              問題不是你不夠專業
            </p>
            <p className="text-2xl md:text-3xl font-bold mt-4" style={{ color: '#1A3C6E' }}>
              而是你的專業，沒有被對的人看見
            </p>
            <p className="text-xl mt-4" style={{ color: '#D4AF37' }}>
              這堂課，就是要解決這個問題
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Transformation */}
      <section className="py-20 md:py-32" style={{ backgroundColor: '#1A3C6E' }}>
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Noto Serif TC', serif" }}>
              從「被比價」到「被指名」
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Before */}
            <div className="p-8 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <h3 className="text-xl font-bold text-white mb-6">傳統模式</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-white/80">
                  <span className="text-red-400">❌</span>
                  <span>靠轉介紹、靠關係，來源不穩定</span>
                </li>
                <li className="flex items-start gap-3 text-white/80">
                  <span className="text-red-400">❌</span>
                  <span>每次提案都在比價，利潤被壓縮</span>
                </li>
                <li className="flex items-start gap-3 text-white/80">
                  <span className="text-red-400">❌</span>
                  <span>客戶不認識你，從零開始建立信任</span>
                </li>
                <li className="flex items-start gap-3 text-white/80">
                  <span className="text-red-400">❌</span>
                  <span>成交週期長，耗時耗力</span>
                </li>
                <li className="flex items-start gap-3 text-white/80">
                  <span className="text-red-400">❌</span>
                  <span>專業被低估，只能用價格競爭</span>
                </li>
              </ul>
            </div>
            
            {/* After */}
            <div className="p-8 rounded-2xl border-2" style={{ backgroundColor: 'rgba(212,175,55,0.1)', borderColor: '#D4AF37' }}>
              <h3 className="text-xl font-bold text-white mb-6">飛輪模式</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-white">
                  <span style={{ color: '#D4AF37' }}>✅</span>
                  <span>內容持續曝光，穩定吸引精準客戶</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span style={{ color: '#D4AF37' }}>✅</span>
                  <span>客戶看完內容就認同你，不比價</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span style={{ color: '#D4AF37' }}>✅</span>
                  <span>見面前就建立信任，縮短成交週期</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span style={{ color: '#D4AF37' }}>✅</span>
                  <span>高價值客戶主動找你，不用追著跑</span>
                </li>
                <li className="flex items-start gap-3 text-white">
                  <span style={{ color: '#D4AF37' }}>✅</span>
                  <span>專業被看見，報價有底氣</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Course Intro */}
      <section id="course-intro" className="py-20 md:py-32 bg-white">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ color: '#333333', fontFamily: "'Noto Serif TC', serif" }}>
                這不是一堂 AI 工具課<br />
                是一套讓你「被指名」的系統
              </h2>
            </div>
            
            <div className="text-center mb-12 p-6 rounded-xl" style={{ backgroundColor: '#F4F6F8' }}>
              <p className="text-lg mb-4" style={{ color: '#555555' }}>如果你是：</p>
              <ul className="space-y-2" style={{ color: '#333333' }}>
                <li>• B2B 業務，需要長期經營客戶關係</li>
                <li>• 獨立顧問，需要穩定的案源</li>
                <li>• 專業服務提供者，需要打造個人品牌</li>
              </ul>
              <p className="text-lg mt-6 font-bold" style={{ color: '#1A3C6E' }}>
                你需要的不只是「會用 AI」<br />
                而是一套能把專業變成「客戶主動來」的系統
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-none shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#D4AF37' }}>
                      <Target className="h-6 w-6" style={{ color: '#1A3C6E' }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: '#333333' }}>① 定位你的專業價值</h3>
                      <p style={{ color: '#555555' }}>找到讓你與眾不同的切角，讓對的客戶一看就知道「這就是我要找的人」</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#D4AF37' }}>
                      <Sparkles className="h-6 w-6" style={{ color: '#1A3C6E' }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: '#333333' }}>② 用 AI 高效產出深度內容</h3>
                      <p style={{ color: '#555555' }}>30 分鐘寫出一篇有洞見的專業文章，不是 AI 味的廢話，是展現你思維的內容</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#D4AF37' }}>
                      <Layers className="h-6 w-6" style={{ color: '#1A3C6E' }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: '#333333' }}>③ 建立內容資產矩陣</h3>
                      <p style={{ color: '#555555' }}>一篇深度文章 → 5 種平台內容，LinkedIn、Facebook、電子報、簡報全覆蓋</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#D4AF37' }}>
                      <TrendingUp className="h-6 w-6" style={{ color: '#1A3C6E' }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold mb-2" style={{ color: '#333333' }}>④ 打造從曝光到成交的飛輪</h3>
                      <p style={{ color: '#555555' }}>讓每一篇內容都在幫你篩選客戶，見面前就建立信任，縮短成交週期</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center mt-12 p-6 rounded-xl" style={{ backgroundColor: '#1A3C6E' }}>
              <p className="text-xl text-white">
                學完這套系統<br />
                <span className="font-bold">你的專業會被看見</span><br />
                <span className="font-bold">對的客戶會主動找你</span><br />
                <span className="font-bold" style={{ color: '#D4AF37' }}>你的報價會更有底氣</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Curriculum */}
      <section className="py-20 md:py-32" style={{ backgroundColor: '#F4F6F8' }}>
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#333333', fontFamily: "'Noto Serif TC', serif" }}>
              6 小時，打造你的專業品牌飛輪
            </h2>
            <p className="text-lg" style={{ color: '#555555' }}>
              從定位、產出、到系統化經營，一次學會
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {curriculum.map((item, index) => (
              <Card key={index} className="bg-white border-none shadow-md overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* 左側時間軸 */}
                    <div className="p-6 md:w-48 flex-shrink-0" style={{ backgroundColor: '#1A3C6E' }}>
                      <div className="text-white">
                        <p className="font-bold">{item.unit}</p>
                        <p className="text-sm opacity-80" style={{ color: '#D4AF37' }}>{item.time}</p>
                      </div>
                    </div>
                    
                    {/* 右側內容 */}
                    <div className="p-6 flex-grow">
                      <h3 className="text-xl font-bold mb-4" style={{ color: '#333333' }}>【{item.title}】</h3>
                      <ul className="space-y-2 mb-4">
                        {item.points.map((point, i) => (
                          <li key={i} className="flex items-start gap-2" style={{ color: '#555555' }}>
                            <span>•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: '#F4F6F8' }}>
                        <p className="text-sm">
                          <span className="font-bold" style={{ color: '#D4AF37' }}>✓ 成果：</span>
                          <span style={{ color: '#333333' }}>{item.outcome}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Testimonials */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#333333', fontFamily: "'Noto Serif TC', serif" }}>
              他們都用這套方法，讓客戶主動找上門
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {testimonials.map((item, index) => (
              <Card key={index} className="border-none shadow-md">
                <CardContent className="pt-6">
                  <Quote className="h-8 w-8 mb-4" style={{ color: '#D4AF37' }} />
                  <p className="text-xl font-bold mb-4" style={{ color: '#1A3C6E' }}>
                    「{item.quote}」
                  </p>
                  <p className="text-sm mb-6" style={{ color: '#555555' }}>
                    {item.detail}
                  </p>
                  <div className="border-t pt-4">
                    <p className="font-bold" style={{ color: '#333333' }}>—— {item.name}</p>
                    <p className="text-sm" style={{ color: '#555555' }}>{item.title}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: Instructor */}
      <section className="py-20 md:py-32" style={{ backgroundColor: '#F4F6F8' }}>
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-12">
              {/* 講師照片 */}
              <div className="w-64 h-64 rounded-full overflow-hidden border-4 flex-shrink-0" style={{ borderColor: '#1A3C6E' }}>
                <img 
                  src="/images/afeng-profile.jpg" 
                  alt="阿峰老師" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop';
                  }}
                />
              </div>
              
              {/* 講師介紹 */}
              <div className="flex-grow text-center md:text-left">
                <h3 className="text-2xl font-bold mb-4" style={{ color: '#333333' }}>阿峰老師</h3>
                
                <blockquote className="text-xl font-bold italic mb-6" style={{ color: '#1A3C6E' }}>
                  「我不教你用 AI 寫廢文<br />
                  我教你用 AI 建立專業品牌」
                </blockquote>
                
                <p className="mb-6" style={{ color: '#555555' }}>
                  專注於協助專業人士將知識轉化為影響力，<br />
                  已輔導超過 500 位業務、顧問、專業服務者<br />
                  建立個人品牌與自動化獲客系統。
                </p>
                
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-6">
                  <span className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: '#1A3C6E', color: 'white' }}>
                    📌 AI 業務飛輪 創辦人
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: '#1A3C6E', color: 'white' }}>
                    📌 方格子 科技專欄作家
                  </span>
                  <span className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: '#1A3C6E', color: 'white' }}>
                    📌 Podcast《專業變現》製作人
                  </span>
                </div>
                
                <p className="text-lg" style={{ color: '#333333' }}>
                  「專業人士最大的問題不是不專業，<br />
                  <span className="font-bold" style={{ color: '#D4AF37' }}>而是專業沒有被對的人看見。</span>」
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: 適合對象 */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#333333', fontFamily: "'Noto Serif TC', serif" }}>
              這堂課適合誰？
            </h2>
            <p className="text-lg" style={{ color: '#555555' }}>
              專為需要「被指名」的專業人士設計
            </p>
          </div>
          
          {/* 6 大適合對象 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {targetAudienceDetailed.map((item, index) => (
              <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4" style={{ backgroundColor: '#1A3C6E' }}>
                    <div className="flex items-center gap-3">
                      <item.icon className="h-6 w-6" style={{ color: '#D4AF37' }} />
                      <h3 className="text-lg font-bold text-white">{item.type}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm mb-2" style={{ color: '#555555' }}>{item.description}</p>
                    <p className="font-bold" style={{ color: '#1A3C6E' }}>
                      → {item.need}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* 不適合對象 */}
          <div className="max-w-2xl mx-auto">
            <div className="p-6 rounded-xl border-2 border-dashed" style={{ borderColor: '#e5e7eb' }}>
              <h3 className="text-xl font-bold mb-4 text-center" style={{ color: '#333333' }}>
                這堂課可能不適合你，如果你是…
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {notSuitableFor.map((item, index) => (
                  <div key={index} className="flex items-start gap-2" style={{ color: '#555555' }}>
                    <XCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: FAQ */}
      <section className="py-20 md:py-32" style={{ backgroundColor: '#F4F6F8' }}>
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#333333', fontFamily: "'Noto Serif TC', serif" }}>
              常見問題
            </h2>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-white border shadow-sm">
                <CardContent className="p-0">
                  <button
                    className="w-full p-6 text-left flex items-center justify-between"
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  >
                    <span className="font-bold" style={{ color: '#1A3C6E' }}>Q：{faq.q}</span>
                    {expandedFaq === index ? (
                      <ChevronUp className="h-5 w-5 flex-shrink-0" style={{ color: '#1A3C6E' }} />
                    ) : (
                      <ChevronDown className="h-5 w-5 flex-shrink-0" style={{ color: '#1A3C6E' }} />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-6 pb-6">
                      <p style={{ color: '#555555' }}>A：{faq.a}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Section 9: Final CTA */}
      <section id="registration-section" className="py-20 md:py-32" style={{ backgroundColor: '#1A3C6E' }}>
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Noto Serif TC', serif" }}>
                準備好讓你的專業被看見了嗎？
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 items-start">
              {/* 課程資訊 */}
              <Card className="bg-white/10 border-white/20 text-white">
                <CardContent className="pt-6">
                  <h3 className="text-2xl font-bold mb-6">AI 業務飛輪實戰班</h3>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span style={{ color: '#D4AF37' }}>📅</span>
                      <span>日期：2026 年 __ 月 __ 日（六）</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{ color: '#D4AF37' }}>⏰</span>
                      <span>時間：09:00 - 17:00（含午休）</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5" style={{ color: '#D4AF37' }} />
                      <span>地點：台北市（近捷運站）</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5" style={{ color: '#D4AF37' }} />
                      <span>名額：限額 16 位（小班制，確保學習品質）</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xl" style={{ color: '#D4AF37' }}>💰</span>
                      <span className="text-xl font-bold">費用：NT$ 9,000</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-white/20 pt-6 space-y-2">
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" style={{ color: '#D4AF37' }} />
                      <span>6 小時實戰工作坊</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" style={{ color: '#D4AF37' }} />
                      <span>精緻午餐與茶點</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" style={{ color: '#D4AF37' }} />
                      <span>課程完整講義</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" style={{ color: '#D4AF37' }} />
                      <span>AI 飛輪系統永久使用權（市價 NT$ 5,000）</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" style={{ color: '#D4AF37' }} />
                      <span>學員專屬社群（講師親自回覆）</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" style={{ color: '#D4AF37' }} />
                      <span>課後 30 天內容健檢一次</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* 報名按鈕區 + 適合對象 */}
              <div>
                <Button 
                  size="lg"
                  className="w-full px-12 py-8 text-xl font-bold shadow-lg hover:shadow-xl transition-all mb-6"
                  style={{ backgroundColor: '#D4AF37', color: '#1A3C6E' }}
                  onClick={() => window.open('/contact', '_blank')}
                >
                  立即報名，打造你的專業品牌
                </Button>
                
                <div className="text-white/80 text-sm mb-6 space-y-1">
                  <p>⚠️ 小班制教學，每班限額 16 位</p>
                  <p>⚠️ 確保每位學員都能得到個別指導</p>
                </div>
                
                <div className="p-4 rounded-lg bg-white/10 text-white">
                  <p className="font-bold mb-3">這堂課適合你，如果你是：</p>
                  <ul className="space-y-2 text-sm">
                    {targetAudienceDetailed.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#D4AF37' }} />
                        <span>{item.type}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Floating CTA */}
      {showFloatingCta && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:hidden" style={{ backgroundColor: '#1A3C6E' }}>
          <Button 
            className="w-full py-4 text-lg font-bold"
            style={{ backgroundColor: '#D4AF37', color: '#1A3C6E' }}
            onClick={scrollToForm}
          >
            立即報名 NT$9,000
          </Button>
        </div>
      )}
    </div>
  );
}
