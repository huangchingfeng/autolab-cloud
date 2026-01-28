import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Tag, Plus, CheckCircle2, Loader2 } from "lucide-react";

const REFERRAL_SOURCES = [
  { value: "teacher_afeng", label: "阿峰老師" },
  { value: "friend", label: "朋友推薦" },
  { value: "facebook", label: "Facebook" },
  { value: "threads", label: "Threads" },
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "other", label: "其他" },
];

const INTERESTED_TOPICS = [
  "ChatGPT 進階應用",
  "AI 圖像生成",
  "AI 影片製作",
  "AI 自動化工作流程",
  "AI Agent 應用",
  "企業 AI 導入策略",
  "AI 簡報製作",
  "AI 數據分析",
  "其他",
];

interface PaymentFormProps {
  eventId: number;
  eventTitle: string;
  eventSlug: string;
  originalPrice: number;
  onSuccess?: () => void;
}

export function PaymentForm({ eventId, eventTitle, eventSlug, originalPrice, onSuccess }: PaymentFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountType: "percentage" | "fixed";
    discountValue: number;
    description?: string | null;
  } | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    MerchantID: string;
    TradeInfo: string;
    TradeSha: string;
    Version: string;
    PayGateWay: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    referralSource: "",
    referralSourceOther: "",
    interestedTopics: [] as string[],
    // 發票資訊
    needInvoice: false,
    taxId: "",
    invoiceTitle: "",
  });

  const validatePromoMutation = trpc.payment.validatePromoCode.useMutation({
    onSuccess: (result) => {
      if (result.valid && result.promoCode) {
        setAppliedPromo(result.promoCode);
        toast.success("優惠代碼套用成功！");
      } else {
        toast.error(result.message || "優惠代碼無效");
      }
    },
    onError: (error) => {
      toast.error(`驗證失敗：${error.message}`);
    },
  });

  const createOrderMutation = trpc.payment.createOrder.useMutation({
    onSuccess: (result) => {
      if (result.paymentRequired && result.paymentData) {
        setPaymentData(result.paymentData);
        // Auto submit to Newebpay
        setTimeout(() => {
          formRef.current?.submit();
        }, 100);
      } else {
        // Free order (100% discount)
        setShowSuccessDialog(true);
        onSuccess?.();
      }
    },
    onError: (error) => {
      toast.error(`訂單建立失敗：${error.message}`);
    },
  });

  const handleApplyPromo = () => {
    if (!promoCode.trim()) {
      toast.error("請輸入優惠代碼");
      return;
    }
    validatePromoMutation.mutate({
      code: promoCode.trim(),
      eventId,
      amount: originalPrice,
    });
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
  };

  const handleTopicToggle = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      interestedTopics: prev.interestedTopics.includes(topic)
        ? prev.interestedTopics.filter(t => t !== topic)
        : [...prev.interestedTopics, topic],
    }));
  };

  const calculateDiscount = () => {
    if (!appliedPromo) return 0;
    if (appliedPromo.discountType === "percentage") {
      return Math.floor(originalPrice * appliedPromo.discountValue / 100);
    }
    return Math.min(appliedPromo.discountValue, originalPrice);
  };

  const discountAmount = calculateDiscount();
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("請填寫必填欄位：姓名、Email、電話");
      return;
    }

    // 驗證發票資訊
    if (formData.needInvoice) {
      if (!formData.taxId || formData.taxId.length !== 8) {
        toast.error("請輸入正確的 8 位統一編號");
        return;
      }
      if (!formData.invoiceTitle) {
        toast.error("請輸入發票抬頭");
        return;
      }
    }

    createOrderMutation.mutate({
      eventId,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      company: formData.company || undefined,
      jobTitle: formData.jobTitle || undefined,
      referralSource: formData.referralSource as any || undefined,
      referralSourceOther: formData.referralSourceOther || undefined,
      interestedTopics: formData.interestedTopics.length > 0 ? formData.interestedTopics : undefined,
      promoCode: appliedPromo?.code,
      // 發票資訊
      needInvoice: formData.needInvoice,
      taxId: formData.needInvoice ? formData.taxId : undefined,
      invoiceTitle: formData.needInvoice ? formData.invoiceTitle : undefined,
    });
  };

  return (
    <>
      <Card className="sticky top-6">
        <CardHeader>
          <CardTitle>立即購買</CardTitle>
          <CardDescription>
            <div className="space-y-1">
              {appliedPromo ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="line-through text-muted-foreground">原價：NT$ {originalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Tag className="h-4 w-4" />
                    <span>折扣：-NT$ {discountAmount.toLocaleString()}</span>
                  </div>
                  <div className="text-lg font-bold text-primary">
                    優惠價：NT$ {finalPrice.toLocaleString()}
                  </div>
                </>
              ) : (
                <span className="text-lg font-bold">費用：NT$ {originalPrice.toLocaleString()}</span>
              )}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="請輸入您的 Email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">電話 *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="請輸入您的電話"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">公司名稱</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="請輸入您的公司名稱（選填）"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">職稱</Label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="請輸入您的職稱（選填）"
              />
            </div>

            <div className="space-y-2">
              <Label>如何得知此課程</Label>
              <Select
                value={formData.referralSource}
                onValueChange={(value) => setFormData({ ...formData, referralSource: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="請選擇（選填）" />
                </SelectTrigger>
                <SelectContent>
                  {REFERRAL_SOURCES.map((source) => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.referralSource === "other" && (
              <div className="space-y-2">
                <Label htmlFor="referralSourceOther">請說明</Label>
                <Input
                  id="referralSourceOther"
                  value={formData.referralSourceOther}
                  onChange={(e) => setFormData({ ...formData, referralSourceOther: e.target.value })}
                  placeholder="請說明如何得知此課程"
                />
              </div>
            )}

            <div className="space-y-3">
              <Label>對哪些議題有興趣？（可複選）</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {INTERESTED_TOPICS.map((topic) => (
                  <div key={topic} className="flex items-center space-x-2">
                    <Checkbox
                      id={`topic-${topic}`}
                      checked={formData.interestedTopics.includes(topic)}
                      onCheckedChange={() => handleTopicToggle(topic)}
                    />
                    <label
                      htmlFor={`topic-${topic}`}
                      className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {topic}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* 發票資訊 */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="needInvoice"
                  checked={formData.needInvoice}
                  onCheckedChange={(checked) => setFormData({ ...formData, needInvoice: checked === true })}
                />
                <label
                  htmlFor="needInvoice"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  需要三聯發票
                </label>
              </div>
              
              {formData.needInvoice && (
                <div className="space-y-3 pl-6 border-l-2 border-primary/20">
                  <div className="space-y-2">
                    <Label htmlFor="taxId">統一編號 *</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      placeholder="請輸入 8 位統一編號"
                      maxLength={8}
                      pattern="[0-9]{8}"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceTitle">發票抬頭 *</Label>
                    <Input
                      id="invoiceTitle"
                      value={formData.invoiceTitle}
                      onChange={(e) => setFormData({ ...formData, invoiceTitle: e.target.value })}
                      placeholder="請輸入公司名稱"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Promo Code Section */}
            <div className="border-t pt-4">
              {!showPromoInput && !appliedPromo ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                  onClick={() => setShowPromoInput(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  輸入優惠代碼
                </Button>
              ) : appliedPromo ? (
                <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      {appliedPromo.code}
                    </span>
                    {appliedPromo.description && (
                      <span className="text-xs text-green-600 dark:text-green-500">
                        ({appliedPromo.description})
                      </span>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={handleRemovePromo}
                  >
                    移除
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="promoCode">優惠代碼</Label>
                  <div className="flex gap-2">
                    <Input
                      id="promoCode"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      placeholder="輸入優惠代碼"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyPromo}
                      disabled={validatePromoMutation.isPending}
                    >
                      {validatePromoMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "套用"
                      )}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => {
                      setShowPromoInput(false);
                      setPromoCode("");
                    }}
                  >
                    取消
                  </Button>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  處理中...
                </>
              ) : (
                `前往付款 NT$ ${finalPrice.toLocaleString()}`
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Hidden form for Newebpay redirect */}
      {paymentData && (
        <form
          ref={formRef}
          method="POST"
          action={paymentData.PayGateWay}
          style={{ display: 'none' }}
        >
          <input type="hidden" name="MerchantID" value={paymentData.MerchantID} />
          <input type="hidden" name="TradeInfo" value={paymentData.TradeInfo} />
          <input type="hidden" name="TradeSha" value={paymentData.TradeSha} />
          <input type="hidden" name="Version" value={paymentData.Version} />
        </form>
      )}

      {/* Success Dialog for free orders */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              報名成功！
            </DialogTitle>
            <DialogDescription asChild>
              <div className="pt-4 space-y-4">
                <p>
                  感謝您報名「{eventTitle}」！您已使用優惠代碼完成報名，我們已經將確認信寄到您的信箱。
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium">請先註冊 NotebookLM</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    建議您在上課前先註冊 NotebookLM 帳號，以便在課程中同步操作練習。
                  </p>
                  <Button className="w-full mt-3" size="sm" asChild>
                    <a
                      href="https://notebooklm.google/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      前往註冊 NotebookLM →
                    </a>
                  </Button>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowSuccessDialog(false)}
            >
              關閉
            </Button>
            <Button
              className="flex-1"
              asChild
            >
              <a
                href="https://line.me/ti/g2/o6oRaGIHTzZ1nEofxnT9Rbv7_ZHAX-rylbJfKA"
                target="_blank"
                rel="noopener noreferrer"
              >
                加入 AI 學員社群
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
