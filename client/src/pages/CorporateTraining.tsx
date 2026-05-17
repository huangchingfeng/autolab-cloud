import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Target, Users, Lightbulb, Zap } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { JsonLdSchema, defaultOrganizationSchema } from "@/components/JsonLdSchema";
import Breadcrumb from "@/components/Breadcrumb";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function CorporateTraining() {
  useEffect(() => {
    document.title = "企業內訓與顧問服務 - 客製化AI培訓方案 | AI峰哥";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', '提供企業AI內訓與顧問服務，客製化培訓方案，協助企業導入AI工作流，提升團隊效率。已服務超過400家企業與政府單位。');
    }
  }, []);

  const features = [
    {
      icon: Target,
      title: "實戰導向",
      description: "不只教理論，更注重實際應用。課程中直接演練真實工作情境，學員當天就能帶走可用的模板與流程。"
    },
    {
      icon: Users,
      title: "產業客製",
      description: "根據您的產業特性與團隊需求，量身設計課程內容。從金融、製造到服務業，都有對應的實戰案例。"
    },
    {
      icon: Lightbulb,
      title: "思維轉型",
      description: "不只教工具操作，更培養AI思維。讓團隊理解如何用AI解決問題，而非只是學會某個功能。"
    },
    {
      icon: Zap,
      title: "持續支持",
      description: "課後提供 Q&A 支援與最佳實務更新，確保團隊能持續應用所學，真正落地實踐。"
    }
  ];

  const trainingTopics = [
    "ChatGPT 與 Claude 企業實戰應用",
    "Prompt 工程與優化技巧",
    "AI 輔助寫作與內容產生",
    "AI 視覺設計（Midjourney、DALL-E）",
    "AI 資料分析與視覺化",
    "AI 客服與聊天機器人",
    "AI 自動化工作流設計",
    "企業AI導入與變革管理"
  ];

  const programOptions = [
    "企業 AI 基礎導入",
    "主管與部門工作流設計",
    "內容行銷與提案效率",
    "資料分析與決策支援",
    "客製化顧問陪跑",
  ];

  const [inquiryForm, setInquiryForm] = useState({
    name: "",
    company: "",
    jobTitle: "",
    email: "",
    phone: "",
    headcount: "",
    programs: [] as string[],
    preferredTime: "",
    notes: "",
  });

  const submitInquiry = trpc.corporateInquiry.submit.useMutation({
    onSuccess: () => {
      toast.success("已收到邀課需求，我們會盡快與您聯繫。");
      setInquiryForm({
        name: "",
        company: "",
        jobTitle: "",
        email: "",
        phone: "",
        headcount: "",
        programs: [],
        preferredTime: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(`送出失敗：${error.message}`);
    },
  });

  const updateInquiryField = (field: keyof typeof inquiryForm, value: string) => {
    setInquiryForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleProgram = (program: string) => {
    setInquiryForm(prev => ({
      ...prev,
      programs: prev.programs.includes(program)
        ? prev.programs.filter(item => item !== program)
        : [...prev.programs, program],
    }));
  };

  const handleInquirySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitInquiry.mutate({
      name: inquiryForm.name,
      company: inquiryForm.company,
      jobTitle: inquiryForm.jobTitle,
      email: inquiryForm.email,
      phone: inquiryForm.phone || undefined,
      headcount: inquiryForm.headcount || undefined,
      programs: inquiryForm.programs.length > 0 ? inquiryForm.programs : undefined,
      preferredTime: inquiryForm.preferredTime || undefined,
      notes: inquiryForm.notes || undefined,
      sourcePage: "general",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <JsonLdSchema data={defaultOrganizationSchema} />
      <Header />
      <Breadcrumb items={[{ label: "企業內訓與顧問" }]} />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <div className="text-center space-y-6 mb-16">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                企業內訓與顧問服務
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                讓企業同仁「會用、懂用、好用、每天用」
              </p>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                我專注於將生成式 AI 轉化為團隊可複用的工作流。從基礎思維、工具選型到情境演練，讓學員帶走「當天可用」的實戰能力。
              </p>
            </div>

            {/* Core Features */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="border-2 hover:border-primary transition-colors">
                    <CardContent className="pt-6">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Training Topics */}
        <section className="py-20 md:py-32 bg-muted/30">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                核心培訓主題
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                涵蓋企業最需要的 AI 應用場景，可依您的需求彈性組合
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {trainingTopics.map((topic, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary text-sm font-bold">{index + 1}</span>
                      </div>
                      <p className="text-foreground font-medium">{topic}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="py-20 md:py-32 bg-background">
          <div className="container">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                服務實績
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                已協助超過 400 家企業與政府單位導入 AI 工作流
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-center mb-12">
              <Card>
                <CardContent className="pt-8">
                  <div className="text-4xl font-bold text-primary mb-2">400+</div>
                  <p className="text-muted-foreground">企業與機關</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-8">
                  <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
                  <p className="text-muted-foreground">學員人次</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-8">
                  <div className="text-4xl font-bold text-primary mb-2">300+</div>
                  <p className="text-muted-foreground">場次課程</p>
                </CardContent>
              </Card>
            </div>

            <div className="text-center">
              <Button size="lg" variant="outline" asChild>
                <Link href="/clients">
                  <span>查看更多客戶見證</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
              <CardContent className="py-12">
                <div className="text-center space-y-6">
                  <h2 className="text-3xl font-bold">準備為您的團隊導入 AI 了嗎？</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    無論是企業內訓、顧問諮詢，還是長期合作，我們都能為您量身打造最適合的方案。
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" asChild>
                      <a href="#contact" className="text-primary-foreground">
                        立即洽詢
                      </a>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                      <Link href="/about">
                        <span>了解阿峰老師</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="contact" className="py-20 md:py-32 bg-background">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                企業邀課需求
              </h2>
              <p className="text-lg text-muted-foreground">
                留下團隊需求與預計時程，後台會同步建立一筆可追蹤的邀課資料。
              </p>
            </div>

            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle>邀課表單</CardTitle>
                <CardDescription>星號欄位為必填</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInquirySubmit} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="inquiry-name">姓名 *</Label>
                      <Input
                        id="inquiry-name"
                        value={inquiryForm.name}
                        onChange={event => updateInquiryField("name", event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inquiry-company">公司名稱 *</Label>
                      <Input
                        id="inquiry-company"
                        value={inquiryForm.company}
                        onChange={event => updateInquiryField("company", event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inquiry-job-title">職稱 *</Label>
                      <Input
                        id="inquiry-job-title"
                        value={inquiryForm.jobTitle}
                        onChange={event => updateInquiryField("jobTitle", event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inquiry-email">Email *</Label>
                      <Input
                        id="inquiry-email"
                        type="email"
                        value={inquiryForm.email}
                        onChange={event => updateInquiryField("email", event.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inquiry-phone">電話</Label>
                      <Input
                        id="inquiry-phone"
                        value={inquiryForm.phone}
                        onChange={event => updateInquiryField("phone", event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inquiry-headcount">預計人數</Label>
                      <Input
                        id="inquiry-headcount"
                        value={inquiryForm.headcount}
                        onChange={event => updateInquiryField("headcount", event.target.value)}
                        placeholder="例如：20-30 人"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>有興趣的方向</Label>
                    <div className="grid gap-3 md:grid-cols-2">
                      {programOptions.map(program => (
                        <label
                          key={program}
                          className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={inquiryForm.programs.includes(program)}
                            onChange={() => toggleProgram(program)}
                            className="h-4 w-4"
                          />
                          <span>{program}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="inquiry-time">預計時間</Label>
                      <Input
                        id="inquiry-time"
                        value={inquiryForm.preferredTime}
                        onChange={event => updateInquiryField("preferredTime", event.target.value)}
                        placeholder="例如：6 月下旬、週五下午"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inquiry-notes">其他需求</Label>
                      <Textarea
                        id="inquiry-notes"
                        value={inquiryForm.notes}
                        onChange={event => updateInquiryField("notes", event.target.value)}
                        placeholder="可簡述產業、部門、想解決的工作情境"
                      />
                    </div>
                  </div>

                  <Button type="submit" size="lg" disabled={submitInquiry.isPending}>
                    {submitInquiry.isPending ? "送出中..." : "送出邀課需求"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
