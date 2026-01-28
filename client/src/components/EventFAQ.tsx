import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

interface EventFAQProps {
  faqs: FAQItem[];
  title?: string;
}

export function EventFAQ({ faqs, title = "常見問題" }: EventFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  if (faqs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-border rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium pr-4">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform flex-shrink-0",
                    openIndex === index && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  openIndex === index ? "max-h-96" : "max-h-0"
                )}
              >
                <div className="p-4 pt-0 text-muted-foreground whitespace-pre-wrap">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 預設的 NotebookLM 課程 FAQ
export const NOTEBOOKLM_FAQS: FAQItem[] = [
  {
    question: "這堂課適合什麼程度的學員？",
    answer: "這堂課適合所有想要提升工作效率的職場人士，無論您是 AI 新手還是有經驗的使用者都能有所收穫。課程會從基礎功能開始，逐步進階到高階應用技巧。"
  },
  {
    question: "講師是誰？有什麼背景？",
    answer: "本課程由阿峰老師主講。阿峰老師是交點文化創辦人，擁有豐富的 AI 工具教學經驗，已舉辦超過 50 場 AI 相關課程與工作坊，累積學員超過 3000 人，專精於將複雜的 AI 工具轉化為實用的職場技能。"
  },
  {
    question: "課程時長多久？",
    answer: "課程時長為 2 小時（19:30 - 21:30），包含實作演練與 Q&A 時間。課後提供 3 個月內無限次數的錄影回放，讓您可以隨時複習。"
  },
  {
    question: "課程費用是多少？有優惠嗎？",
    answer: "原價 NT$ 2,000，新年早鳥價 NT$ 699（限量 50 名）。早鳥優惠額滿即恢復原價，建議盡早報名以享優惠價格。"
  },
  {
    question: "報名後會收到什麼？",
    answer: "報名成功後，您會收到確認信件。課程當天會透過 Email 發送 Google Meet 連結。此外，報名即贈送：NotebookLM 2.0 完整操作簡報、課程完整錄影回放、專屬學員社群。"
  },
  {
    question: "如果當天無法參加怎麼辦？",
    answer: "沒問題！課程提供 3 個月內無限次數的錄影回放，您可以在方便的時間觀看。同時也歡迎加入學員社群，課後有任何問題都可以提問。"
  },
  {
    question: "需要先準備什麼嗎？",
    answer: "建議您在上課前先註冊 NotebookLM 帳號（https://notebooklm.google/），這樣可以在課程中同步操作練習。NotebookLM 是免費使用的，只需要 Google 帳號即可。"
  },
  {
    question: "可以開立發票嗎？",
    answer: "可以的，付款完成後系統會自動開立電子發票並寄送到您的信箱。如需統編或其他發票需求，請在報名時備註或聯繫我們。"
  }
];
