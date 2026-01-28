import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Turnstile, { useTurnstile } from "react-turnstile";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [inquiryType, setInquiryType] = useState<"enterprise" | "public" | "coaching" | "other">("enterprise");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstile = useTurnstile();

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      toast.success("訊息已送出！我們會盡快與您聯繫。");
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setInquiryType("enterprise");
      setMessage("");
      setTurnstileToken(null);
      // Reset Turnstile widget
      turnstile.reset();
    },
    onError: (error) => {
      toast.error(`送出失敗：${error.message}`);
      // Reset Turnstile on error
      turnstile.reset();
      setTurnstileToken(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("請填寫所有必填欄位");
      return;
    }

    if (!turnstileToken) {
      toast.error("請完成人機驗證");
      return;
    }

    submitMutation.mutate({
      name,
      email,
      phone: phone || undefined,
      inquiryType,
      message,
      turnstileToken,
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="請輸入您的姓名"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">電子郵件 *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone">聯絡電話</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912-345-678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquiryType">需求類型 *</Label>
              <Select value={inquiryType} onValueChange={(value: any) => setInquiryType(value)}>
                <SelectTrigger id="inquiryType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enterprise">企業內訓</SelectItem>
                  <SelectItem value="public">公開課程</SelectItem>
                  <SelectItem value="coaching">1對1教練</SelectItem>
                  <SelectItem value="other">其他諮詢</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">訊息內容 *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="請描述您的需求、想了解的課程內容，或任何問題..."
              rows={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              至少需要 10 個字元
            </p>
          </div>

          {/* Cloudflare Turnstile CAPTCHA */}
          <div className="flex justify-center">
            <Turnstile
              sitekey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
              onVerify={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken(null)}
              onError={() => {
                setTurnstileToken(null);
                toast.error("驗證載入失敗，請重新整理頁面");
              }}
              theme="light"
            />
          </div>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full"
            disabled={submitMutation.isPending || !turnstileToken}
          >
            {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            送出諮詢
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
