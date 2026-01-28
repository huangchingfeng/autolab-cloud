import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, FileText, CheckCircle, Loader2 } from "lucide-react";

interface DownloadFormProps {
  resourceSlug: string;
  resourceTitle: string;
  downloadUrl: string;
  downloadUrl2?: string; // 可選的第二個下載連結
  buttonText?: string;
  description?: string;
}

export function DownloadForm({
  resourceSlug,
  resourceTitle,
  downloadUrl,
  downloadUrl2,
  buttonText = "免費下載簡報",
  description = "填寫以下資訊即可免費下載完整簡報",
}: DownloadFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [actualDownloadUrl, setActualDownloadUrl] = useState("");
  const [actualDownloadUrl2, setActualDownloadUrl2] = useState("");

  const registerMutation = trpc.download.register.useMutation({
    onSuccess: (data) => {
      setIsSuccess(true);
      setActualDownloadUrl(data.downloadUrl);
      // 如果有第二個下載連結，也設定它
      if (downloadUrl2) {
        setActualDownloadUrl2(downloadUrl2);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate({
      name,
      email,
      resourceSlug,
      resourceTitle,
      downloadUrl,
    });
  };

  const handleDownload = () => {
    window.open(actualDownloadUrl, "_blank");
    // 如果有第二個檔案，延遲一下再下載
    if (actualDownloadUrl2) {
      setTimeout(() => {
        window.open(actualDownloadUrl2, "_blank");
      }, 500);
    }
    setOpen(false);
    // Reset form after download
    setTimeout(() => {
      setIsSuccess(false);
      setName("");
      setEmail("");
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
          <Download className="h-5 w-5" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {!isSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                {resourceTitle}
              </DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  placeholder="請輸入您的姓名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="請輸入您的 Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    處理中...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    立即下載
                  </>
                )}
              </Button>
              {registerMutation.isError && (
                <p className="text-sm text-red-500 text-center">
                  {registerMutation.error.message || "發生錯誤，請稍後再試"}
                </p>
              )}
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <DialogTitle className="mb-2">感謝您的註冊！</DialogTitle>
            <DialogDescription className="mb-6">
              {downloadUrl2 
                ? "您的資料已準備就緒，點擊下方按鈕開始下載（將自動下載兩個檔案）"
                : "您的簡報已準備就緒，點擊下方按鈕開始下載"
              }
            </DialogDescription>
            <Button onClick={handleDownload} size="lg" className="gap-2">
              <Download className="h-5 w-5" />
              {downloadUrl2 ? "下載資料包" : "下載簡報"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
