import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

const SESSION_OPTIONS = [
  { value: "session1", label: "第一場：2/20 (四) 19:00-21:30" },
  { value: "session2", label: "第二場：3/6 (四) 19:00-21:30" },
  { value: "session3", label: "第三場：3/20 (四) 19:00-21:30" },
  { value: "session4", label: "第四場：4/10 (四) 19:00-21:30" },
  { value: "all", label: "四場全報" },
];

const REFERRAL_SOURCE_OPTIONS = [
  { value: "teacher", label: "阿峰老師" },
  { value: "line_community", label: "阿峰老師LINE社群" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "other", label: "其他" },
];

export default function AISuperSalesRegistrationForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    selectedSessions: [] as string[],
    referralSource: "" as string,
    subscribeNewsletter: false,
  });

  const [submitted, setSubmitted] = useState(false);

  const registerMutation = trpc.aiSuperSales.register.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("報名成功！我們將盡快與您聯繫。");
    },
    onError: (error) => {
      toast.error(`報名失敗：${error.message}`);
    },
  });

  const handleSessionToggle = (sessionValue: string) => {
    if (sessionValue === "all") {
      // If "all" is selected, clear other selections and set only "all"
      setFormData(prev => ({
        ...prev,
        selectedSessions: prev.selectedSessions.includes("all") ? [] : ["all"]
      }));
    } else {
      // If a specific session is selected, remove "all" and toggle the session
      setFormData(prev => {
        const newSessions = prev.selectedSessions.filter(s => s !== "all");
        if (newSessions.includes(sessionValue)) {
          return { ...prev, selectedSessions: newSessions.filter(s => s !== sessionValue) };
        } else {
          return { ...prev, selectedSessions: [...newSessions, sessionValue] };
        }
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("請填寫所有必填欄位");
      return;
    }

    if (formData.selectedSessions.length === 0) {
      toast.error("請選擇至少一個場次");
      return;
    }

    if (!formData.referralSource) {
      toast.error("請選擇資訊來源");
      return;
    }

    registerMutation.mutate({
      ...formData,
      referralSource: formData.referralSource as "teacher" | "line_community" | "facebook" | "instagram" | "youtube" | "other",
    });
  };

  if (submitted) {
    return (
      <Card className="max-w-2xl mx-auto border-2 border-[#F59E0B]">
        <CardContent className="p-12 text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-[#F59E0B]" />
          </div>
          <h3 className="text-2xl font-bold text-[#0A1628]">報名成功！</h3>
          <div className="space-y-3 text-[#1E3A5F]">
            <p>感謝您報名 AI 超級業務實戰班</p>
            <p>我們已收到您的報名資料，課程連結與行前通知將在開課前寄送至您的信箱</p>
          </div>
          <div className="pt-4">
            <p className="text-sm text-[#1E3A5F]/70">
              若有任何問題，歡迎透過官方 LINE 聯繫我們
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-[#0A1628]">免費報名</CardTitle>
        <CardDescription>填寫以下資料完成報名（* 為必填）</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">姓名 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="請輸入您的姓名"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="example@email.com"
              required
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">電話 *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0912-345-678"
              required
            />
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company">公司名稱（選填）</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="請輸入您的公司名稱"
            />
          </div>

          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="jobTitle">職稱（選填）</Label>
            <Input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder="例如：業務經理、銷售主管"
            />
          </div>

          {/* Session Selection */}
          <div className="space-y-3">
            <Label>報名場次 *</Label>
            <div className="space-y-2">
              {SESSION_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`session-${option.value}`}
                    checked={formData.selectedSessions.includes(option.value)}
                    onCheckedChange={() => handleSessionToggle(option.value)}
                  />
                  <Label
                    htmlFor={`session-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              選擇「四場全報」將自動取消其他單場選擇
            </p>
          </div>

          {/* Referral Source */}
          <div className="space-y-3">
            <Label>資訊來源 *</Label>
            <RadioGroup
              value={formData.referralSource}
              onValueChange={(value) => setFormData({ ...formData, referralSource: value })}
            >
              {REFERRAL_SOURCE_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`referral-${option.value}`} />
                  <Label
                    htmlFor={`referral-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Newsletter Subscription */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="newsletter"
              checked={formData.subscribeNewsletter}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, subscribeNewsletter: checked as boolean })
              }
            />
            <Label htmlFor="newsletter" className="text-sm font-normal cursor-pointer">
              我同意訂閱阿峰老師的電子報，接收最新 AI 應用資訊與課程通知
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "提交中..." : "確認報名"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
