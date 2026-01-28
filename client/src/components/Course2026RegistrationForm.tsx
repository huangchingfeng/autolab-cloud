import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface FormData {
  userType: "new" | "returning";
  plan: "single" | "full" | "double" | "test";
  selectedSessions: string[];
  name1: string;
  email1: string;
  phone1: string;
  industry1: string;
  name2: string;
  email2: string;
  phone2: string;
  industry2: string;
  paymentMethod: "transfer" | "online";
  transferLast5: string;
  promoCode: string;
  needInvoice: boolean;
  taxId: string;
  invoiceTitle: string;
  subscribeNewsletter: boolean;
}

// 只保留初階 1-4 課程，每個月都會開課
const COURSE_SESSIONS = [
  // 1 月課程
  { id: "0120_1", name: "初階 1：AI 職場應用啟航班 - 策略視野與基礎建構", date: "1/20 (二) 9:00-12:00", month: "1月", location: "台北 悖活原力" },
  { id: "0127_1", name: "初階 1：AI 職場應用啟航班 - 策略視野與基礎建構", date: "1/27 (二) 9:00-12:00", month: "1月", location: "台北 悖活原力" },
  { id: "0120_2", name: "初階 2：AI 職場應用進階班 - 市場洞察與簡報自動化", date: "1/20 (二) 13:00-16:00", month: "1月", location: "台北 悖活原力" },
  { id: "0127_2", name: "初階 2：AI 職場應用進階班 - 市場洞察與簡報自動化", date: "1/27 (二) 13:00-16:00", month: "1月", location: "台北 悖活原力" },
  { id: "0122_3", name: "初階 3：AI 職場應用實戰班 - 知識內化與創意設計", date: "1/22 (四) 9:00-12:00", month: "1月", location: "台北 悖活原力" },
  { id: "0128_3", name: "初階 3：AI 職場應用實戰班 - 知識內化與創意設計", date: "1/28 (三) 9:00-12:00", month: "1月", location: "台北 悖活原力" },
  { id: "0122_4", name: "初階 4：AI 職場應用專精班 - 影像創作與內容策略", date: "1/22 (四) 13:00-16:00", month: "1月", location: "台北 悖活原力" },
  { id: "0128_4", name: "初階 4：AI 職場應用專精班 - 影像創作與內容策略", date: "1/28 (三) 13:00-16:00", month: "1月", location: "台北 悖活原力" },
  
  // 2 月課程
  { id: "0203_1", name: "初階 1：AI 職場應用啟航班 - 策略視野與基礎建構", date: "2/3 (二) 9:00-12:00", month: "2月", location: "台北 悖活原力" },
  { id: "0203_2", name: "初階 2：AI 職場應用進階班 - 市場洞察與簡報自動化", date: "2/3 (二) 13:00-16:00", month: "2月", location: "台北 悖活原力" },
  { id: "0205_3", name: "初階 3：AI 職場應用實戰班 - 知識內化與創意設計", date: "2/5 (四) 9:00-12:00", month: "2月", location: "台北 悖活原力" },
  { id: "0205_4", name: "初階 4：AI 職場應用專精班 - 影像創作與內容策略", date: "2/5 (四) 13:00-16:00", month: "2月", location: "台北 悖活原力" },
  
  // 3 月課程
  { id: "0305_1", name: "初階 1：AI 職場應用啟航班 - 策略視野與基礎建構", date: "3/5 (四) 9:00-12:00", month: "3月", location: "台北 悖活原力" },
  { id: "0312_1", name: "初階 1：AI 職場應用啟航班 - 策略視野與基礎建構", date: "3/12 (四) 9:00-12:00", month: "3月", location: "台北 悖活原力" },
  { id: "0305_2", name: "初階 2：AI 職場應用進階班 - 市場洞察與簡報自動化", date: "3/5 (四) 13:00-16:00", month: "3月", location: "台北 悖活原力" },
  { id: "0312_2", name: "初階 2：AI 職場應用進階班 - 市場洞察與簡報自動化", date: "3/12 (四) 13:00-16:00", month: "3月", location: "台北 悖活原力" },
  { id: "0311_3", name: "初階 3：AI 職場應用實戰班 - 知識內化與創意設計", date: "3/11 (三) 9:00-12:00", month: "3月", location: "台北 悖活原力" },
  { id: "0324_3", name: "初階 3：AI 職場應用實戰班 - 知識內化與創意設計", date: "3/24 (二) 9:00-12:00", month: "3月", location: "台北 悖活原力" },
  { id: "0311_4", name: "初階 4：AI 職場應用專精班 - 影像創作與內容策略", date: "3/11 (三) 13:00-16:00", month: "3月", location: "台北 悖活原力" },
  { id: "0324_4", name: "初階 4：AI 職場應用專精班 - 影像創作與內容策略", date: "3/24 (二) 13:00-16:00", month: "3月", location: "台北 悖活原力" },
];

const PLAN_PRICES = {
  new: {
    single: 3000,
    full: 10000, // 全系列套票(4 堂課)
    double: 16000, // 雙人同行(4 堂課,總價)
    test: 1, // 測試付款（NT$ 1）
  },
  returning: {
    single: 2400,
    full: 7000,
    double: 14000, // 舊生雙人同行,總價
    test: 1, // 測試付款（NT$ 1）
  },
};

export default function Course2026RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    userType: "new",
    plan: "single",
    selectedSessions: [],
    name1: "",
    email1: "",
    phone1: "",
    industry1: "",
    name2: "",
    email2: "",
    phone2: "",
    industry2: "",
    paymentMethod: "online",
    transferLast5: "",
    promoCode: "",
    needInvoice: false,
    taxId: "",
    invoiceTitle: "",
    subscribeNewsletter: true, // 預設勾選訂閱電子報
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const registerMutation = trpc.course2026.register.useMutation({
    onSuccess: (data) => {
      if (data.paymentMethod === "online" && data.newebpayForm) {
        // 自動提交藍新金流表單
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "https://core.newebpay.com/MPG/mpg_gateway";
        
        Object.entries(data.newebpayForm).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value as string;
          form.appendChild(input);
        });
        
        document.body.appendChild(form);
        form.submit();
      } else {
        alert("報名成功！我們已發送確認信到您的 Email，請查收。");
        // 重置表單
        setFormData({
          userType: "new",
          plan: "single",
          selectedSessions: [],
          name1: "",
          email1: "",
          phone1: "",
          industry1: "",
          name2: "",
          email2: "",
          phone2: "",
          industry2: "",
          paymentMethod: "online",
          transferLast5: "",
          promoCode: "",
          needInvoice: false,
          taxId: "",
          invoiceTitle: "",
          subscribeNewsletter: true,
        });
      }
    },
    onError: (error) => {
      alert(`報名失敗：${error.message}`);
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 驗證學員類型
    if (!formData.userType) {
      newErrors.userType = "請選擇學員類型";
    }

    // 驗證方案
    if (!formData.plan) {
      newErrors.plan = "請選擇報名方案";
    }

    // 驗證課程選擇
    if (formData.selectedSessions.length === 0) {
      newErrors.selectedSessions = "請至少選擇一堂課程";
    }

    // 雙人方案必須選擇 4 堂課
    if (formData.plan === "double" && formData.selectedSessions.length !== 4) {
      newErrors.selectedSessions = "雙人同行方案必須選擇 4 堂課程";
    }

    // 驗證第一位學員資料
    if (!formData.name1.trim()) {
      newErrors.name1 = "請輸入姓名";
    }
    if (!formData.email1.trim()) {
      newErrors.email1 = "請輸入 Email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email1)) {
      newErrors.email1 = "Email 格式不正確";
    }
    if (!formData.phone1.trim()) {
      newErrors.phone1 = "請輸入電話";
    } else if (!/^09\d{8}$/.test(formData.phone1.replace(/[-\s]/g, ""))) {
      newErrors.phone1 = "電話格式不正確（請輸入 09 開頭的手機號碼）";
    }

    // 驗證第二位學員資料（雙人方案）
    if (formData.plan === "double") {
      if (!formData.name2.trim()) {
        newErrors.name2 = "請輸入第二位學員姓名";
      }
      if (!formData.email2.trim()) {
        newErrors.email2 = "請輸入第二位學員 Email";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email2)) {
        newErrors.email2 = "Email 格式不正確";
      }
      if (!formData.phone2.trim()) {
        newErrors.phone2 = "請輸入第二位學員電話";
      } else if (!/^09\d{8}$/.test(formData.phone2.replace(/[-\s]/g, ""))) {
        newErrors.phone2 = "電話格式不正確（請輸入 09 開頭的手機號碼）";
      }
    }


    // 驗證付款方式
    if (!formData.paymentMethod) {
      newErrors.paymentMethod = "請選擇付款方式";
    }

    // 驗證銀行匯款帳號後五碼
    if (formData.paymentMethod === "transfer" && !formData.transferLast5.trim()) {
      newErrors.transferLast5 = "請輸入匯款帳號後五碼";
    }

    // 驗證三聯式發票欄位
    if (formData.needInvoice) {
      if (!formData.taxId.trim()) {
        newErrors.taxId = "請輸入統一編號";
      } else if (!/^\d{8}$/.test(formData.taxId)) {
        newErrors.taxId = "統一編號必須為 8 位數字";
      }
      if (!formData.invoiceTitle.trim()) {
        newErrors.invoiceTitle = "請輸入發票抬頭";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    registerMutation.mutate({
      userType: formData.userType,
      plan: formData.plan,
      planPrice: totalPrice,
      selectedSessions: formData.selectedSessions,
      name1: formData.name1,
      email1: formData.email1,
      phone1: formData.phone1,
      industry1: formData.industry1 || undefined,
      name2: formData.plan === "double" ? formData.name2 : undefined,
      email2: formData.plan === "double" ? formData.email2 : undefined,
      phone2: formData.plan === "double" ? formData.phone2 : undefined,
      industry2: formData.plan === "double" ? formData.industry2 : undefined,
      paymentMethod: formData.paymentMethod,
      transferLast5: formData.paymentMethod === "transfer" ? formData.transferLast5 : undefined,
      promoCode: formData.promoCode || undefined,
      needInvoice: formData.needInvoice,
      taxId: formData.needInvoice ? formData.taxId : undefined,
      invoiceTitle: formData.needInvoice ? formData.invoiceTitle : undefined,
      subscribeNewsletter: formData.subscribeNewsletter,
    });
  };

  const handlePlanChange = (plan: "single" | "full" | "double" | "test") => {
    setFormData((prev) => ({
      ...prev,
      plan,
      selectedSessions: plan === "full" || plan === "double" ? [] : prev.selectedSessions,
    }));
  };

  const handleSessionToggle = (sessionId: string) => {
    setFormData((prev) => {
      // 單堂體驗方案或測試付款：單選（radio）
      if (prev.plan === "single" || prev.plan === "test") {
        return {
          ...prev,
          selectedSessions: [sessionId], // 直接替換為新選擇的課程
        };
      }
      
      // 其他方案：複選（checkbox）
      const isSelected = prev.selectedSessions.includes(sessionId);
      const newSessions = isSelected
        ? prev.selectedSessions.filter((id) => id !== sessionId)
        : [...prev.selectedSessions, sessionId];
      
      return {
        ...prev,
        selectedSessions: newSessions,
      };
    });
  };

  // 計算優惠代碼折扣後的價格
  const calculateTotalPrice = () => {
    let basePrice = PLAN_PRICES[formData.userType][formData.plan];
    
    // 檢查優惠代碼：BNI 優惠只適用於新生全系列方案
    if (formData.promoCode.toUpperCase() === "BNI" && formData.userType === "new" && formData.plan === "full") {
      return 7000;
    }
    
    return basePrice;
  };

  const totalPrice = calculateTotalPrice();
  const originalPrice = PLAN_PRICES[formData.userType][formData.plan];
  const hasDiscount = totalPrice < originalPrice;

  // 按月份分組課程
  const sessionsByMonth = COURSE_SESSIONS.reduce((acc, session) => {
    if (!acc[session.month]) {
      acc[session.month] = [];
    }
    acc[session.month].push(session);
    return acc;
  }, {} as Record<string, typeof COURSE_SESSIONS>);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">2026 AI 實戰應用課報名表單</CardTitle>
        <CardDescription>請填寫以下資料完成報名</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 學員類型選擇 */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">學員類型</Label>
            <RadioGroup
              value={formData.userType}
              onValueChange={(value) => setFormData({ ...formData, userType: value as "new" | "returning" })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="cursor-pointer">新生（首次報名）</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="returning" id="returning" />
                <Label htmlFor="returning" className="cursor-pointer">舊生（曾參加過阿峰老師課程）</Label>
              </div>
            </RadioGroup>
            {errors.userType && <p className="text-sm text-red-500">{errors.userType}</p>}
          </div>

          {/* 方案選擇 */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">報名方案</Label>
            <RadioGroup
              value={formData.plan}
              onValueChange={(value) => handlePlanChange(value as "single" | "full" | "double")}
            >

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="cursor-pointer">
                  單堂體驗（NT$ {PLAN_PRICES[formData.userType].single} / 堂）
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="cursor-pointer">
                  全系列套票（NT$ {PLAN_PRICES[formData.userType].full} / 4 堂）
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="double" id="double" />
                <Label htmlFor="double" className="cursor-pointer">
                  雙人同行（NT$ {PLAN_PRICES[formData.userType].double} / 4 堂 2 人）
                </Label>
              </div>
              <div className="flex items-center space-x-2 border-t pt-2 mt-2">
                <RadioGroupItem value="test" id="test" />
                <Label htmlFor="test" className="cursor-pointer text-orange-600 font-medium">
                  🧪 測試付款（NT$ 1）- 僅供測試用
                </Label>
              </div>
            </RadioGroup>
            {errors.plan && <p className="text-sm text-red-500">{errors.plan}</p>}
          </div>

          {/* 課程選擇 */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">選擇課程</Label>
            <p className="text-sm text-muted-foreground">
              {formData.plan === "double" && "雙人同行方案必須選擇 4 堂課程"}
              {formData.plan === "full" && "全系列套票請選擇 4 堂課程"}
              {formData.plan === "single" && "單堂體驗：請選擇 1 堂課程（只能選擇一堂）"}
              {formData.plan === "test" && "🧪 測試付款：請選擇任意 1 堂課程（僅供測試用）"}
            </p>
            
            {Object.entries(sessionsByMonth).map(([month, sessions]) => (
              <div key={month} className="space-y-2">
                <h3 className="font-semibold text-primary">{month}課程</h3>
                <div className="space-y-2 pl-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-start space-x-2">
                      <Checkbox
                        id={session.id}
                        checked={formData.selectedSessions.includes(session.id)}
                        onCheckedChange={() => handleSessionToggle(session.id)}
                      />
                      <Label htmlFor={session.id} className="cursor-pointer text-sm leading-relaxed">
                        {session.name} - {session.date}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {errors.selectedSessions && <p className="text-sm text-red-500">{errors.selectedSessions}</p>}
          </div>

          {/* 第一位學員資料 */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">學員資料</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name1">姓名 *</Label>
                <Input
                  id="name1"
                  value={formData.name1}
                  onChange={(e) => setFormData({ ...formData, name1: e.target.value })}
                  placeholder="請輸入姓名"
                />
                {errors.name1 && <p className="text-sm text-red-500">{errors.name1}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email1">Email *</Label>
                <Input
                  id="email1"
                  type="email"
                  value={formData.email1}
                  onChange={(e) => setFormData({ ...formData, email1: e.target.value })}
                  placeholder="請輸入 Email"
                />
                {errors.email1 && <p className="text-sm text-red-500">{errors.email1}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone1">電話 *</Label>
                <Input
                  id="phone1"
                  value={formData.phone1}
                  onChange={(e) => setFormData({ ...formData, phone1: e.target.value })}
                  placeholder="請輸入手機號碼"
                />
                {errors.phone1 && <p className="text-sm text-red-500">{errors.phone1}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry1">產業/職務（選填）</Label>
                <Input
                  id="industry1"
                  value={formData.industry1}
                  onChange={(e) => setFormData({ ...formData, industry1: e.target.value })}
                  placeholder="例：科技業 / 產品經理"
                />
              </div>
            </div>
          </div>

          {/* 第二位學員資料（雙人方案） */}
          {formData.plan === "double" && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">第二位學員資料</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name2">姓名 *</Label>
                  <Input
                    id="name2"
                    value={formData.name2}
                    onChange={(e) => setFormData({ ...formData, name2: e.target.value })}
                    placeholder="請輸入姓名"
                  />
                  {errors.name2 && <p className="text-sm text-red-500">{errors.name2}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">Email *</Label>
                  <Input
                    id="email2"
                    type="email"
                    value={formData.email2}
                    onChange={(e) => setFormData({ ...formData, email2: e.target.value })}
                    placeholder="請輸入 Email"
                  />
                  {errors.email2 && <p className="text-sm text-red-500">{errors.email2}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone2">電話 *</Label>
                  <Input
                    id="phone2"
                    value={formData.phone2}
                    onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                    placeholder="請輸入手機號碼"
                  />
                  {errors.phone2 && <p className="text-sm text-red-500">{errors.phone2}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry2">產業/職務（選填）</Label>
                  <Input
                    id="industry2"
                    value={formData.industry2}
                    onChange={(e) => setFormData({ ...formData, industry2: e.target.value })}
                    placeholder="例：科技業 / 產品經理"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 優惠代碼 */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">優惠代碼（選填）</Label>
            <div className="space-y-2">
              <Input
                id="promoCode"
                value={formData.promoCode}
                onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                placeholder="請輸入優惠代碼"
                className="uppercase"
              />
              {formData.promoCode.toUpperCase() === "BNI" && formData.userType === "new" && formData.plan === "full" && (
                <p className="text-sm text-green-600 font-medium">✓ 優惠代碼已套用！全系列課程折扣為 NT$ 7,000</p>
              )}
              {formData.promoCode && !(formData.promoCode.toUpperCase() === "BNI" && formData.userType === "new" && formData.plan === "full") && (
                <p className="text-sm text-muted-foreground">此優惠代碼僅適用於新生全系列方案</p>
              )}
            </div>
          </div>

          {/* 三聯式發票 */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">三聯式發票（選填）</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="needInvoice"
                checked={formData.needInvoice}
                onCheckedChange={(checked) => setFormData({ ...formData, needInvoice: checked as boolean })}
              />
              <Label htmlFor="needInvoice" className="cursor-pointer">需要開立三聯式發票</Label>
            </div>
            {formData.needInvoice && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="taxId">統一編號 *</Label>
                  <Input
                    id="taxId"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="請輸入 8 位統一編號"
                    maxLength={8}
                  />
                  {errors.taxId && <p className="text-sm text-red-500">{errors.taxId}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceTitle">發票抬頭 *</Label>
                  <Input
                    id="invoiceTitle"
                    value={formData.invoiceTitle}
                    onChange={(e) => setFormData({ ...formData, invoiceTitle: e.target.value })}
                    placeholder="請輸入公司名稱"
                  />
                  {errors.invoiceTitle && <p className="text-sm text-red-500">{errors.invoiceTitle}</p>}
                </div>
              </div>
            )}
          </div>

          {/* 電子報訂閱 */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">電子報訂閱</Label>
            <div className="flex items-start space-x-2">
              <Checkbox
                id="subscribeNewsletter"
                checked={formData.subscribeNewsletter}
                onCheckedChange={(checked) => setFormData({ ...formData, subscribeNewsletter: checked as boolean })}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="subscribeNewsletter" className="cursor-pointer">
                  我同意訂閱 AI 峰哥電子報
                </Label>
                <p className="text-sm text-muted-foreground">
                  定期接收 AI 實戰技巧、工具推薦與課程優惠資訊
                </p>
              </div>
            </div>
          </div>

          {/* 付款方式 */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">付款方式</Label>
            <RadioGroup
              value={formData.paymentMethod}
              onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as "transfer" | "online" })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="transfer" id="transfer" />
                <Label htmlFor="transfer" className="cursor-pointer">銀行匯款</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="online" id="online" />
                <Label htmlFor="online" className="cursor-pointer">線上刷卡（藍新金流）</Label>
              </div>
            </RadioGroup>
            {errors.paymentMethod && <p className="text-sm text-red-500">{errors.paymentMethod}</p>}

            {/* 銀行匯款資訊 */}
            {formData.paymentMethod === "transfer" && (
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <p className="font-semibold">匯款資訊</p>
                <div className="text-sm space-y-1">
                  <p>【匯款銀行】台新銀行(812)</p>
                  <p>【匯款分行】三和分行(0698)</p>
                  <p>【匯款戶名】交點文化股份有限公司</p>
                  <p>【匯款帳號】20690100002452</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transferLast5">匯款帳號後五碼 *</Label>
                  <Input
                    id="transferLast5"
                    value={formData.transferLast5}
                    onChange={(e) => setFormData({ ...formData, transferLast5: e.target.value })}
                    placeholder="請輸入您的匯款帳號後五碼"
                    maxLength={5}
                  />
                  {errors.transferLast5 && <p className="text-sm text-red-500">{errors.transferLast5}</p>}
                </div>
              </div>
            )}
          </div>

          {/* 總金額 */}
          <div className="p-4 bg-primary/10 rounded-lg">
            <div className="space-y-2">
              {hasDiscount && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">原價</span>
                  <span className="text-muted-foreground line-through">NT$ {originalPrice.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">{hasDiscount ? "優惠價" : "總金額"}</span>
                <span className="text-2xl font-bold text-primary">NT$ {totalPrice.toLocaleString()}</span>
              </div>
              {hasDiscount && (
                <p className="text-sm text-green-600 font-medium">已套用 BNI 優惠代碼，省下 NT$ {(originalPrice - totalPrice).toLocaleString()}</p>
              )}
            </div>
          </div>

          {/* 提交按鈕 */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                處理中...
              </>
            ) : (
              "確認報名"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
