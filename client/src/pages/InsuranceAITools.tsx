import { useEffect, useMemo, useState, type ComponentType } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/Breadcrumb";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Calculator,
  ClipboardList,
  Copy,
  FileText,
  HeartHandshake,
  MessageCircle,
  MessagesSquare,
  PiggyBank,
  ShieldCheck,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

type ToolId =
  | "fire"
  | "protectionGap"
  | "interviewQuestions"
  | "policySummary"
  | "lineFollowup"
  | "objectionPractice";

type FieldConfig = {
  key: string;
  label: string;
  placeholder: string;
  type?: "input" | "textarea";
};

type ToolConfig = {
  id: ToolId;
  name: string;
  shortName: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  fields: FieldConfig[];
};

const tools: ToolConfig[] = [
  {
    id: "fire",
    name: "FIRE 退休目標系統",
    shortName: "FIRE 系統",
    description: "整理退休目標、現金流、資產與保障風險，產出客戶討論草稿。",
    icon: PiggyBank,
    fields: [
      { key: "age", label: "目前年齡", placeholder: "例：42 歲" },
      { key: "targetAge", label: "希望退休年齡", placeholder: "例：60 歲" },
      { key: "monthlyExpense", label: "每月理想生活費", placeholder: "例：退休後每月 8 萬元" },
      { key: "assets", label: "目前資產概況", placeholder: "例：存款 200 萬、基金 150 萬、房貸未清償", type: "textarea" },
      { key: "savings", label: "每月可投入金額", placeholder: "例：每月可投入 3 萬元" },
      { key: "responsibility", label: "家庭責任", placeholder: "例：兩個小孩、父母需照顧、仍有房貸", type: "textarea" },
      { key: "concern", label: "客戶最擔心的事", placeholder: "例：怕醫療支出、怕退休金不夠、怕收入中斷", type: "textarea" },
    ],
  },
  {
    id: "protectionGap",
    name: "家庭保障缺口盤點器",
    shortName: "保障缺口",
    description: "把家庭責任、負債、教育費與緊急預備金整理成保障討論清單。",
    icon: ShieldCheck,
    fields: [
      { key: "family", label: "家庭成員", placeholder: "例：夫妻加兩名子女，父母偶爾需支援" },
      { key: "income", label: "主要收入來源", placeholder: "例：先生月收入 12 萬，太太月收入 6 萬" },
      { key: "debt", label: "負債與固定支出", placeholder: "例：房貸 900 萬，每月房貸 3.8 萬", type: "textarea" },
      { key: "education", label: "子女教育或照顧責任", placeholder: "例：小孩 6 歲與 9 歲，希望準備大學教育金", type: "textarea" },
      { key: "coverage", label: "現有保障概況", placeholder: "請用去識別化摘要，不要貼保單號碼或完整個資", type: "textarea" },
      { key: "concern", label: "主要擔心", placeholder: "例：收入中斷、重大疾病、意外、長照", type: "textarea" },
    ],
  },
  {
    id: "interviewQuestions",
    name: "客戶訪談提問產生器",
    shortName: "訪談提問",
    description: "依客戶背景產生初談、複談、成交前確認問題。",
    icon: ClipboardList,
    fields: [
      { key: "customer", label: "客戶背景", placeholder: "例：35 歲科技業主管，已婚，剛有第一個小孩", type: "textarea" },
      { key: "stage", label: "目前階段", placeholder: "例：第一次接觸、已約第二次見面、準備成交前確認" },
      { key: "goal", label: "這次會談目標", placeholder: "例：了解家庭責任、釐清退休目標、建立信任" },
      { key: "concern", label: "已知顧慮", placeholder: "例：覺得保險很複雜、怕被推銷、預算有限", type: "textarea" },
    ],
  },
  {
    id: "policySummary",
    name: "保單健檢摘要器",
    shortName: "保單健檢",
    description: "把去識別化保單重點改成白話摘要與待確認問題。",
    icon: FileText,
    fields: [
      { key: "policyNotes", label: "保單重點", placeholder: "請貼去識別化摘要，不要貼保單號碼、身分證、完整生日或病歷", type: "textarea" },
      { key: "customerQuestion", label: "客戶想問的問題", placeholder: "例：我保障夠嗎？這張還需要留嗎？醫療險是不是太少？", type: "textarea" },
      { key: "context", label: "客戶現況", placeholder: "例：剛成家、有房貸、準備生小孩、工作收入不穩定", type: "textarea" },
    ],
  },
  {
    id: "lineFollowup",
    name: "LINE 跟進訊息產生器",
    shortName: "LINE 跟進",
    description: "產生溫和、不壓迫的客戶跟進訊息。",
    icon: MessageCircle,
    fields: [
      { key: "stage", label: "客戶階段", placeholder: "例：初談後、提案後、生日、保單週年、節稅季" },
      { key: "relationship", label: "關係與語氣", placeholder: "例：朋友介紹的新客戶，語氣要禮貌自然" },
      { key: "purpose", label: "這次跟進目的", placeholder: "例：約下次會議、補資料、提醒年度檢視、分享觀念" },
      { key: "keyPoint", label: "想帶到的重點", placeholder: "例：上次提到擔心小孩教育金，所以想補一份整理", type: "textarea" },
    ],
  },
  {
    id: "objectionPractice",
    name: "異議處理練習器",
    shortName: "異議處理",
    description: "把客戶異議拆成理解、釐清、教育與下一步。",
    icon: MessagesSquare,
    fields: [
      { key: "objection", label: "客戶說法", placeholder: "例：太貴了、我再想想、我已經有保險了、我想問家人", type: "textarea" },
      { key: "customer", label: "客戶背景", placeholder: "例：年輕家庭、預算有限、剛買房、對保險信任度低", type: "textarea" },
      { key: "topic", label: "討論主題", placeholder: "例：醫療保障、家庭責任、退休規劃、保單健檢" },
      { key: "nextStep", label: "希望引導的下一步", placeholder: "例：約下一次 20 分鐘整理、請客戶補資料、先做保障缺口盤點" },
    ],
  },
];

type InsuranceToolResult = {
  title: string;
  output: string;
  generatedAt: string;
};

export default function InsuranceAITools() {
  const [selectedToolId, setSelectedToolId] = useState<ToolId>("fire");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [result, setResult] = useState<InsuranceToolResult | null>(null);

  const selectedTool = useMemo(
    () => tools.find((tool) => tool.id === selectedToolId) || tools[0],
    [selectedToolId]
  );

  useEffect(() => {
    document.title = "保險業務 AI 工具箱 | AI峰哥";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "給保險業務員使用的 AI 工具箱，包含 FIRE 退休目標系統、保障缺口盤點、客戶訪談提問、LINE 跟進訊息與異議處理練習。"
      );
    }
  }, []);

  const generateMutation = trpc.insuranceTools.generate.useMutation({
    onSuccess: (data) => {
      setResult(data);
      toast.success("工具草稿已產生");
    },
    onError: (error) => {
      toast.error(`產生失敗：${error.message}`);
    },
  });

  const selectTool = (toolId: ToolId) => {
    setSelectedToolId(toolId);
    setFields({});
    setResult(null);
  };

  const updateField = (key: string, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
  };

  const buildPayloadFields = () => {
    return Object.fromEntries(
      selectedTool.fields.map((field) => [field.label, fields[field.key] || ""])
    );
  };

  const handleGenerate = () => {
    const payloadFields = buildPayloadFields();
    if (!Object.values(payloadFields).some((value) => value.trim())) {
      toast.error("請先填寫至少一個欄位");
      return;
    }

    generateMutation.mutate({
      tool: selectedTool.id,
      fields: payloadFields,
    });
  };

  const handleCopy = async () => {
    if (!result?.output) return;
    try {
      await navigator.clipboard.writeText(result.output);
      toast.success("已複製工具輸出");
    } catch {
      toast.error("複製失敗，請手動選取內容");
    }
  };

  const ActiveIcon = selectedTool.icon;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <Breadcrumb items={[{ label: "保險業務 AI 工具箱" }]} />

      <main className="flex-1 bg-slate-50">
        <section className="border-b bg-white">
          <div className="container py-8">
            <div className="max-w-4xl space-y-4">
              <Badge variant="secondary" className="w-fit">
                保險業務員專用
              </Badge>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                  保險業務 AI 工具箱
                </h1>
                <p className="text-muted-foreground md:text-lg">
                  協助業務員整理客戶需求、產生訪談問題、撰寫跟進訊息與做教育型說明。所有輸出都是草稿，請依公司規範確認後使用。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-8">
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="space-y-3">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = tool.id === selectedTool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => selectTool(tool.id)}
                    className={`w-full rounded-lg border p-4 text-left transition-colors ${
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-white hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 flex-none" />
                      <div className="min-w-0">
                        <p className="font-semibold">{tool.shortName}</p>
                        <p className={`mt-1 text-sm ${isActive ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              <Card className="border-dashed bg-white">
                <CardContent className="pt-6 text-sm text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                    <p>
                      不要輸入身分證、完整生日、病歷、保單號碼或其他敏感個資。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </aside>

            <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.9fr)_minmax(420px,1.1fr)]">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ActiveIcon className="h-5 w-5" />
                    {selectedTool.name}
                  </CardTitle>
                  <CardDescription>{selectedTool.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {selectedTool.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      {field.type === "textarea" ? (
                        <Textarea
                          id={field.key}
                          value={fields[field.key] || ""}
                          onChange={(event) => updateField(field.key, event.target.value)}
                          placeholder={field.placeholder}
                          rows={4}
                        />
                      ) : (
                        <Input
                          id={field.key}
                          value={fields[field.key] || ""}
                          onChange={(event) => updateField(field.key, event.target.value)}
                          placeholder={field.placeholder}
                        />
                      )}
                    </div>
                  ))}

                  <Button
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                    className="w-full"
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    {generateMutation.isPending ? "產生中..." : "產生服務草稿"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader className="gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      工具輸出
                    </CardTitle>
                    <CardDescription>
                      輸出可複製，建議再依客戶狀況與公司規範調整。
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={!result?.output}
                    className="shrink-0"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    複製
                  </Button>
                </CardHeader>
                <CardContent>
                  <Textarea
                    readOnly
                    value={
                      result?.output ||
                      "請先選擇左側工具並填入資料，產生後會在這裡看到可修改的服務草稿。"
                    }
                    rows={24}
                    className="min-h-[520px] resize-y bg-slate-50 font-mono text-sm leading-6"
                  />
                  {result?.generatedAt && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      產生時間：{new Date(result.generatedAt).toLocaleString("zh-TW")}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="border-t bg-white">
          <div className="container grid gap-4 py-8 md:grid-cols-3">
            <div className="flex gap-3">
              <HeartHandshake className="mt-1 h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold">服務輔助</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  用來整理需求、提問與跟進，不是自動成交工具。
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold">合規優先</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  不做商品推薦、不保證結果、不取代公司核准資料。
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Wand2 className="mt-1 h-5 w-5 text-primary" />
              <div>
                <h2 className="font-semibold">課後可用</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  適合搭配 AI 超級業務與保險業務 AI 課程延伸使用。
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
