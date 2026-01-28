import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageNavigation from "@/components/PageNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, Building2, Users, Award, TrendingUp } from "lucide-react";

// 企業客戶資料
const corporateClients = [
  { name: "台積電", category: "半導體" },
  { name: "聯發科", category: "半導體" },
  { name: "鴻海", category: "電子製造" },
  { name: "中華電信", category: "電信" },
  { name: "台灣大哥大", category: "電信" },
  { name: "遠傳電信", category: "電信" },
  { name: "國泰金控", category: "金融" },
  { name: "富邦金控", category: "金融" },
  { name: "中國信託", category: "金融" },
  { name: "玉山銀行", category: "金融" },
  { name: "統一企業", category: "食品" },
  { name: "全聯福利中心", category: "零售" },
];

// 學員見證
const testimonials = [
  {
    name: "陳經理",
    role: "行銷部經理",
    company: "科技公司",
    content: "阿峰老師的課程讓我們團隊在一週內就能將 AI 工具應用到日常工作中，報告撰寫效率提升了 50%！",
    rating: 5,
  },
  {
    name: "林主管",
    role: "業務主管",
    company: "金融業",
    content: "課程內容非常實用，不是空談理論，而是真正能落地的技巧。現在我用 AI 準備客戶提案只需要以前一半的時間。",
    rating: 5,
  },
  {
    name: "王小姐",
    role: "人資專員",
    company: "製造業",
    content: "原本對 AI 工具很陌生，但阿峰老師用淺顯易懂的方式教學，讓我很快就上手了。現在招募流程效率大幅提升！",
    rating: 5,
  },
  {
    name: "張總監",
    role: "研發總監",
    company: "軟體公司",
    content: "企業內訓的效果超出預期，團隊成員都反映課程內容很實用，而且阿峰老師會根據我們的產業特性調整案例。",
    rating: 5,
  },
  {
    name: "李經理",
    role: "專案經理",
    company: "顧問公司",
    content: "上完課後，我的簡報製作時間從 3 小時縮短到 30 分鐘，而且品質更好。這是我上過最值得的 AI 課程！",
    rating: 5,
  },
  {
    name: "吳副理",
    role: "財務副理",
    company: "上市公司",
    content: "阿峰老師教的 Excel + AI 整合技巧太實用了！現在財務報表分析的效率提升了好幾倍。",
    rating: 5,
  },
];

// 成就數據
const achievements = [
  { icon: Building2, value: "400+", label: "服務企業" },
  { icon: Users, value: "10,000+", label: "培訓學員" },
  { icon: Award, value: "10+", label: "年培訓經驗" },
  { icon: TrendingUp, value: "95%", label: "學員滿意度" },
];

export default function Testimonials() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Navigation Tabs */}
        <PageNavigation currentPath="/testimonials" />

        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-background py-16 md:py-24">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <Badge variant="secondary" className="mb-4">
                🏆 客戶與見證
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                深受企業信賴的 AI 培訓專家
              </h1>
              <p className="text-lg text-muted-foreground">
                累計服務超過 400 家企業，培訓學員超過 10,000 人次
              </p>
            </div>
          </div>
        </section>

        {/* Achievements */}
        <section className="py-12 border-b">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {achievements.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-3xl font-bold text-primary mb-1">{item.value}</div>
                    <div className="text-sm text-muted-foreground">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Corporate Clients */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                服務企業
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                從科技業到金融業，從製造業到服務業，我們的培訓服務深受各產業龍頭企業信賴
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {corporateClients.map((client, index) => (
                <Card key={index} className="text-center hover:shadow-md transition-shadow">
                  <CardContent className="py-6">
                    <div className="font-semibold mb-1">{client.name}</div>
                    <Badge variant="outline" className="text-xs">{client.category}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-center text-muted-foreground mt-8">
              以及更多企業與政府機關...
            </p>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                學員見證
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                聽聽學員們怎麼說
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="relative">
                  <CardContent className="pt-8 pb-6">
                    <Quote className="absolute top-4 left-4 h-8 w-8 text-primary/20" />
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    <div className="border-t pt-4">
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role} · {testimonial.company}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">
                準備好提升團隊的 AI 能力了嗎？
              </h2>
              <p className="text-muted-foreground mb-8">
                立即聯繫我們，了解如何為您的企業量身打造 AI 培訓方案
              </p>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
              >
                聯繫我們
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
