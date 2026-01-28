import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

interface PromptComparisonTableProps {
  /** 提示詞標題（例如：1. 客製化運動週期規劃） */
  title: string;
  /** 阿峰老師的解析說明 */
  analysis?: string;
  /** 中文提示詞（台灣版） */
  chinesePrompt: string;
  /** 英文提示詞 */
  englishPrompt: string;
  /** 是否顯示編號 */
  showNumber?: boolean;
  /** 編號 */
  number?: number;
}

export default function PromptComparisonTable({
  title,
  analysis,
  chinesePrompt,
  englishPrompt,
  showNumber = false,
  number,
}: PromptComparisonTableProps) {
  const [copiedChinese, setCopiedChinese] = useState(false);
  const [copiedEnglish, setCopiedEnglish] = useState(false);

  const handleCopy = async (text: string, language: "chinese" | "english") => {
    try {
      await navigator.clipboard.writeText(text);
      if (language === "chinese") {
        setCopiedChinese(true);
        setTimeout(() => setCopiedChinese(false), 2000);
        toast.success("已複製中文提示詞");
      } else {
        setCopiedEnglish(true);
        setTimeout(() => setCopiedEnglish(false), 2000);
        toast.success("已複製英文提示詞");
      }
    } catch (err) {
      toast.error("複製失敗，請手動複製");
    }
  };

  return (
    <Card className="mb-8 border-2 border-primary/10 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 pb-4">
        <CardTitle className="text-xl md:text-2xl font-bold text-foreground flex items-start gap-3">
          {showNumber && number && (
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
              {number}
            </span>
          )}
          <span className="flex-1">{title}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* 阿峰老師解析 */}
        {analysis && (
          <div className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary">
            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              <span className="text-primary">💡</span>
              阿峰老師解析
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {analysis}
            </p>
          </div>
        )}

        {/* 中英文對照表格 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border p-3 text-left font-semibold text-foreground w-1/2">
                  中文提示詞（台灣版）
                </th>
                <th className="border border-border p-3 text-left font-semibold text-foreground w-1/2">
                  英文提示詞
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {/* 中文提示詞 */}
                <td className="border border-border p-4 align-top bg-background">
                  <div className="space-y-3">
                    <div className="bg-muted/20 rounded-md p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {chinesePrompt}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(chinesePrompt, "chinese")}
                      className="w-full sm:w-auto"
                    >
                      {copiedChinese ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          已複製
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          複製中文提示詞
                        </>
                      )}
                    </Button>
                  </div>
                </td>

                {/* 英文提示詞 */}
                <td className="border border-border p-4 align-top bg-background">
                  <div className="space-y-3">
                    <div className="bg-muted/20 rounded-md p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {englishPrompt}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(englishPrompt, "english")}
                      className="w-full sm:w-auto"
                    >
                      {copiedEnglish ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy English Prompt
                        </>
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 手機版響應式提示 */}
        <div className="block md:hidden text-xs text-muted-foreground text-center mt-4">
          💡 提示：在手機上可以左右滑動查看完整表格
        </div>
      </CardContent>
    </Card>
  );
}
