"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
import { createKol, updateKol, type KolFormState } from "@/lib/actions/kol-actions";
import { toast } from "sonner";

const statuses = ["潛在", "已聯繫", "洽談中", "合作中", "結案"];
const categories = ["美妝", "母嬰", "健康", "時尚", "美食", "生活", "科技", "其他"];

interface KolFormProps {
  kolId?: string;
  initialData?: {
    igHandle: string;
    name: string | null;
    followersCount: number | null;
    engagementRate: string | number | null;
    category: string | null;
    tags: string[];
    contactEmail: string | null;
    contactLine: string | null;
    contactPhone: string | null;
    status: string;
    notes: string | null;
    source: string | null;
  };
}

export default function KolForm({ kolId, initialData }: KolFormProps) {
  const router = useRouter();
  const isEdit = !!kolId;

  const action = isEdit
    ? updateKol.bind(null, kolId)
    : createKol;

  const [state, formAction, pending] = useActionState<KolFormState, FormData>(
    action,
    { success: false }
  );

  useEffect(() => {
    if (state.success) {
      toast.success(isEdit ? "KOL 已更新" : "KOL 已新增");
      router.push("/kols");
    }
  }, [state.success, isEdit, router]);

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="igHandle">IG 帳號 *</Label>
              <Input
                id="igHandle"
                name="igHandle"
                placeholder="example_ig"
                defaultValue={initialData?.igHandle || ""}
                required
              />
              {state.fieldErrors?.igHandle && (
                <p className="text-sm text-destructive">
                  {state.fieldErrors.igHandle[0]}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">名稱</Label>
              <Input
                id="name"
                name="name"
                placeholder="KOL 名稱"
                defaultValue={initialData?.name || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="followersCount">粉絲數</Label>
              <Input
                id="followersCount"
                name="followersCount"
                type="number"
                placeholder="10000"
                defaultValue={initialData?.followersCount?.toString() || ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="engagementRate">互動率 (%)</Label>
              <Input
                id="engagementRate"
                name="engagementRate"
                type="number"
                step="0.01"
                placeholder="3.5"
                defaultValue={
                  initialData?.engagementRate?.toString() || ""
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">分類</Label>
              <Select
                name="category"
                defaultValue={initialData?.category || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇分類" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">狀態</Label>
              <Select
                name="status"
                defaultValue={initialData?.status || "潛在"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇狀態" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">標籤</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="標籤1, 標籤2, 標籤3"
                defaultValue={initialData?.tags?.join(", ") || ""}
              />
              <p className="text-xs text-muted-foreground">以逗號分隔</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">來源</Label>
              <Select
                name="source"
                defaultValue={initialData?.source || "手動新增"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇來源" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="手動新增">手動新增</SelectItem>
                  <SelectItem value="Apify發掘">Apify 發掘</SelectItem>
                  <SelectItem value="CSV匯入">CSV 匯入</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">聯絡 Email</Label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                placeholder="email@example.com"
                defaultValue={initialData?.contactEmail || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactLine">聯絡 Line</Label>
              <Input
                id="contactLine"
                name="contactLine"
                placeholder="Line ID"
                defaultValue={initialData?.contactLine || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">聯絡電話</Label>
              <Input
                id="contactPhone"
                name="contactPhone"
                placeholder="0912345678"
                defaultValue={initialData?.contactPhone || ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">備註</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="備註..."
              rows={3}
              defaultValue={initialData?.notes || ""}
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "處理中..." : isEdit ? "更新" : "新增"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
