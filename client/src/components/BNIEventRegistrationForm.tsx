import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BNIEventRegistrationFormProps {
  eventId: number;
  onSuccess?: () => void;
}

const AI_TOOLS = [
  { id: "chatgpt", label: "ChatGPT" },
  { id: "gemini", label: "Gemini" },
  { id: "claude", label: "Claude" },
  { id: "midjourney", label: "Midjourney" },
  { id: "notebooklm", label: "NotebookLM" },
  { id: "other", label: "其他" },
];

export function BNIEventRegistrationForm({ eventId, onSuccess }: BNIEventRegistrationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    attendeeCount: "1",
    profession: "",
    referralPerson: "",
    hasAiExperience: "",
    aiToolsUsed: [] as string[],
    hasTakenAiCourse: "",
    courseExpectations: "",
  });

  const registerMutation = trpc.events.registerBNI.useMutation({
    onSuccess: () => {
      toast.success("報名成功！我們將透過 Email 與您聯繫。");
      setFormData({
        name: "",
        email: "",
        phone: "",
        attendeeCount: "1",
        profession: "",
        referralPerson: "",
        hasAiExperience: "",
        aiToolsUsed: [],
        hasTakenAiCourse: "",
        courseExpectations: "",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`報名失敗：${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 驗證必填欄位
    if (!formData.name || !formData.email || !formData.phone || !formData.profession) {
      toast.error("請填寫所有必填欄位");
      return;
    }

    if (!formData.hasAiExperience) {
      toast.error("請選擇是否有 AI 工具使用經驗");
      return;
    }

    if (!formData.hasTakenAiCourse) {
      toast.error("請選擇是否上過其他 AI 相關課程");
      return;
    }

    registerMutation.mutate({
      eventId,
      ...formData,
      attendeeCount: parseInt(formData.attendeeCount),
      hasAiExperience: formData.hasAiExperience === "yes",
      hasTakenAiCourse: formData.hasTakenAiCourse === "yes",
      aiToolsUsed: formData.aiToolsUsed.join(", "),
    });
  };

  const handleAiToolsChange = (toolId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      aiToolsUsed: checked
        ? [...prev.aiToolsUsed, toolId]
        : prev.aiToolsUsed.filter(id => id !== toolId)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 姓名 */}
      <div className="space-y-2">
        <Label htmlFor="name">
          姓名 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      {/* 電子信箱 */}
      <div className="space-y-2">
        <Label htmlFor="email">
          電子信箱 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="用於寄送課前通知及講義"
          required
        />
      </div>

      {/* 聯絡電話 */}
      <div className="space-y-2">
        <Label htmlFor="phone">
          聯絡電話 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
      </div>

      {/* 參加人數 */}
      <div className="space-y-2">
        <Label htmlFor="attendeeCount">
          參加人數 <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.attendeeCount}
          onValueChange={(value) => setFormData({ ...formData, attendeeCount: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1人</SelectItem>
            <SelectItem value="2">2人</SelectItem>
            <SelectItem value="3">3人以上</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 所屬產業/專業別 */}
      <div className="space-y-2">
        <Label htmlFor="profession">
          所屬產業/專業別 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="profession"
          value={formData.profession}
          onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
          placeholder="例如：室內設計、保險規劃、商務律師..."
          required
        />
      </div>

      {/* 推薦人 */}
      <div className="space-y-2">
        <Label htmlFor="referralPerson">推薦人</Label>
        <Input
          id="referralPerson"
          value={formData.referralPerson}
          onChange={(e) => setFormData({ ...formData, referralPerson: e.target.value })}
          placeholder="是哪位夥伴推薦您來上課的呢？(若無可免填)"
        />
      </div>

      {/* AI 工具使用經驗調查 */}
      <div className="space-y-3">
        <Label>
          過去是否有使用過 AI 工具（Gemini, NotebookLM...）？ <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={formData.hasAiExperience}
          onValueChange={(value) => setFormData({ ...formData, hasAiExperience: value, aiToolsUsed: value === "no" ? [] : formData.aiToolsUsed })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="has-experience-yes" />
            <Label htmlFor="has-experience-yes" className="font-normal cursor-pointer">
              有，我有使用經驗
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="has-experience-no" />
            <Label htmlFor="has-experience-no" className="font-normal cursor-pointer">
              沒有，我是完全新手
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* 使用過哪些工具 - 條件式顯示 */}
      {formData.hasAiExperience === "yes" && (
        <div className="space-y-3">
          <Label>請問使用過哪些？</Label>
          <div className="space-y-2">
            {AI_TOOLS.map((tool) => (
              <div key={tool.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`tool-${tool.id}`}
                  checked={formData.aiToolsUsed.includes(tool.id)}
                  onCheckedChange={(checked) => handleAiToolsChange(tool.id, checked as boolean)}
                />
                <Label htmlFor={`tool-${tool.id}`} className="font-normal cursor-pointer">
                  {tool.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 過去是否上過其他 AI 相關課程 */}
      <div className="space-y-3">
        <Label>
          過去是否上過其他 AI 相關課程？ <span className="text-red-500">*</span>
        </Label>
        <RadioGroup
          value={formData.hasTakenAiCourse}
          onValueChange={(value) => setFormData({ ...formData, hasTakenAiCourse: value })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="taken-course-yes" />
            <Label htmlFor="taken-course-yes" className="font-normal cursor-pointer">
              是
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="taken-course-no" />
            <Label htmlFor="taken-course-no" className="font-normal cursor-pointer">
              否
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* 課程期待與提問 */}
      <div className="space-y-2">
        <Label htmlFor="courseExpectations">課程期待與提問</Label>
        <Textarea
          id="courseExpectations"
          value={formData.courseExpectations}
          onChange={(e) => setFormData({ ...formData, courseExpectations: e.target.value })}
          placeholder="您希望在這堂課解決什麼具體問題？或想學到什麼特定內容？"
          rows={4}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            提交中...
          </>
        ) : (
          "立即報名"
        )}
      </Button>
    </form>
  );
}
