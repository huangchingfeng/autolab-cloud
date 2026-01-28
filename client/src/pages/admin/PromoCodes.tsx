import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tag, Loader2, Calendar, Percent, DollarSign } from "lucide-react";

interface PromoCodeForm {
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minAmount: number | undefined;
  maxUses: number | undefined;
  eventId: number | undefined;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

const defaultForm: PromoCodeForm = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: 10,
  minAmount: undefined,
  maxUses: undefined,
  eventId: undefined,
  validFrom: "",
  validUntil: "",
  isActive: true,
};

export default function AdminPromoCodes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<PromoCodeForm>(defaultForm);

  const utils = trpc.useUtils();
  const { data: promoCodes, isLoading } = trpc.promoCodes.getAll.useQuery();
  const { data: events } = trpc.events.getPublishedEvents.useQuery({});

  const createMutation = trpc.promoCodes.create.useMutation({
    onSuccess: () => {
      toast.success("優惠代碼建立成功！");
      utils.promoCodes.getAll.invalidate();
      setIsDialogOpen(false);
      setForm(defaultForm);
    },
    onError: (error) => {
      toast.error(`建立失敗：${error.message}`);
    },
  });

  const updateMutation = trpc.promoCodes.update.useMutation({
    onSuccess: () => {
      toast.success("優惠代碼更新成功！");
      utils.promoCodes.getAll.invalidate();
      setIsDialogOpen(false);
      setEditingId(null);
      setForm(defaultForm);
    },
    onError: (error) => {
      toast.error(`更新失敗：${error.message}`);
    },
  });

  const deleteMutation = trpc.promoCodes.delete.useMutation({
    onSuccess: () => {
      toast.success("優惠代碼已刪除！");
      utils.promoCodes.getAll.invalidate();
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (promoCode: any) => {
    setEditingId(promoCode.id);
    setForm({
      code: promoCode.code,
      description: promoCode.description || "",
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      minAmount: promoCode.minAmount || undefined,
      maxUses: promoCode.maxUses || undefined,
      eventId: promoCode.eventId || undefined,
      validFrom: promoCode.validFrom ? new Date(promoCode.validFrom).toISOString().split("T")[0] : "",
      validUntil: promoCode.validUntil ? new Date(promoCode.validUntil).toISOString().split("T")[0] : "",
      isActive: promoCode.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.code.trim()) {
      toast.error("請輸入優惠代碼");
      return;
    }
    if (form.discountValue <= 0) {
      toast.error("折扣金額必須大於 0");
      return;
    }

    const data = {
      code: form.code.toUpperCase(),
      description: form.description || undefined,
      discountType: form.discountType,
      discountValue: form.discountValue,
      minAmount: form.minAmount || undefined,
      maxUses: form.maxUses || undefined,
      eventId: form.eventId || undefined,
      validFrom: form.validFrom ? new Date(form.validFrom) : undefined,
      validUntil: form.validUntil ? new Date(form.validUntil) : undefined,
      isActive: form.isActive,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteMutation.mutate({ id: deletingId });
    }
  };

  const formatDiscount = (type: string, value: number) => {
    if (type === "percentage") {
      return `${value}% 折扣`;
    }
    return `NT$ ${value} 折扣`;
  };

  const isExpired = (validUntil: Date | null) => {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">優惠代碼管理</h1>
          <p className="text-muted-foreground">管理所有優惠代碼</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          新增優惠代碼
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            優惠代碼列表
          </CardTitle>
          <CardDescription>
            共 {promoCodes?.length || 0} 個優惠代碼
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : promoCodes && promoCodes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>代碼</TableHead>
                  <TableHead>折扣</TableHead>
                  <TableHead>使用次數</TableHead>
                  <TableHead>有效期限</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <div>
                        <span className="font-mono font-bold">{promo.code}</span>
                        {promo.description && (
                          <p className="text-sm text-muted-foreground">{promo.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {promo.discountType === "percentage" ? (
                          <Percent className="h-4 w-4 text-green-600" />
                        ) : (
                          <DollarSign className="h-4 w-4 text-green-600" />
                        )}
                        <span>{formatDiscount(promo.discountType, promo.discountValue)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span>{promo.usedCount || 0}</span>
                      {promo.maxUses && (
                        <span className="text-muted-foreground"> / {promo.maxUses}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {promo.validFrom || promo.validUntil ? (
                        <div className="text-sm">
                          {promo.validFrom && (
                            <div>{new Date(promo.validFrom).toLocaleDateString("zh-TW")} 起</div>
                          )}
                          {promo.validUntil && (
                            <div className={isExpired(promo.validUntil) ? "text-red-500" : ""}>
                              {new Date(promo.validUntil).toLocaleDateString("zh-TW")} 止
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">無限制</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!promo.isActive ? (
                        <Badge variant="secondary">停用</Badge>
                      ) : isExpired(promo.validUntil) ? (
                        <Badge variant="destructive">已過期</Badge>
                      ) : promo.maxUses && (promo.usedCount || 0) >= promo.maxUses ? (
                        <Badge variant="destructive">已用完</Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-600">啟用中</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(promo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleOpenDelete(promo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              尚無優惠代碼，點擊上方按鈕新增
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "編輯優惠代碼" : "新增優惠代碼"}</DialogTitle>
            <DialogDescription>
              {editingId ? "修改優惠代碼的設定" : "建立新的優惠代碼"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">優惠代碼 *</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="例如：NEWYEAR2026"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="例如：新年優惠"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>折扣類型</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(value: "percentage" | "fixed") => setForm({ ...form, discountType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">百分比折扣</SelectItem>
                    <SelectItem value="fixed">固定金額折扣</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  折扣{form.discountType === "percentage" ? "（%）" : "（NT$）"} *
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                  min={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minAmount">最低消費金額</Label>
                <Input
                  id="minAmount"
                  type="number"
                  value={form.minAmount || ""}
                  onChange={(e) => setForm({ ...form, minAmount: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="無限制"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses">最大使用次數</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={form.maxUses || ""}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="無限制"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>限定活動</Label>
              <Select
                value={form.eventId?.toString() || "all"}
                onValueChange={(value) => setForm({ ...form, eventId: value === "all" ? undefined : Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇活動（選填）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有活動</SelectItem>
                  {events?.map((event) => (
                    <SelectItem key={event.id} value={event.id.toString()}>
                      {event.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">開始日期</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={form.validFrom}
                  onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">結束日期</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">啟用狀態</Label>
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {editingId ? "更新" : "建立"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              確定要刪除這個優惠代碼嗎？此操作無法復原。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
