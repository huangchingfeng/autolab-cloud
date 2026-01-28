import { Mail, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubstackBanner() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTMwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHpNNiAzNGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      <div className="container relative mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* 左側：標題和描述 */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <Sparkles className="h-6 w-6 text-yellow-300" />
              <h2 className="text-2xl md:text-3xl font-bold">
                訂閱 AI峰哥電子報
              </h2>
            </div>
            <p className="text-blue-100 text-base md:text-lg mb-4 md:mb-0">
              每週收到最新 AI 實戰技巧、產業趨勢分析與獨家課程優惠
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-sm text-blue-100">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>每週精選內容</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>產業趨勢洞察</span>
              </div>
            </div>
          </div>

          {/* 右側：訂閱按鈕 */}
          <div className="flex-shrink-0">
            <Button
              asChild
              size="lg"
              className="bg-white text-indigo-600 hover:bg-blue-50 font-semibold text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <a
                href="https://startupforyou.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Mail className="mr-2 h-5 w-5" />
                立即免費訂閱
              </a>
            </Button>
            <p className="text-center text-xs text-blue-100 mt-2">
              隨時可取消訂閱
            </p>
          </div>
        </div>
      </div>

      {/* 底部波浪裝飾 */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 48h1440V0s-120 48-360 48S720 0 720 0 600 48 360 48 0 0 0 0v48z" fill="currentColor" className="text-background" />
        </svg>
      </div>
    </div>
  );
}
