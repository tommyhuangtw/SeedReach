"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "@/lib/actions/outreach-actions";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", body: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    const data = await getTemplates();
    setTemplates(data);
    setLoading(false);
  }

  function handleEdit(template: Template) {
    setEditingId(template.id);
    setForm({ name: template.name, subject: template.subject, body: template.body });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", subject: "", body: "" });
  }

  async function handleSave() {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) {
      toast.error("請填寫所有欄位");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateTemplate(editingId, form);
        toast.success("模板已更新");
      } else {
        await createTemplate(form);
        toast.success("模板已建立");
      }
      handleCancel();
      await loadTemplates();
    } catch {
      toast.error("儲存失敗");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("確定要刪除此模板？")) return;
    const result = await deleteTemplate(id);
    if (result.success) {
      toast.success("模板已刪除");
      await loadTemplates();
    } else {
      toast.error(result.error || "刪除失敗");
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">載入中...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 {templates.length} 個模板
        </p>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            新增模板
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {editingId ? "編輯模板" : "新增模板"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="tpl-name">模板名稱</Label>
              <Input
                id="tpl-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例：首次合作邀約"
              />
            </div>
            <div>
              <Label htmlFor="tpl-subject">信件主旨</Label>
              <Input
                id="tpl-subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="例：合作邀約 - {{kol_name}} 您好"
              />
            </div>
            <div>
              <Label htmlFor="tpl-body">信件內容</Label>
              <Textarea
                id="tpl-body"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="例：{{kol_name}} 您好，我們是..."
                rows={8}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                使用 {"{{kol_name}}"} 來自動帶入 KOL 名稱
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} size="sm">
                {saving ? "儲存中..." : "儲存"}
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                <X className="mr-1 h-3 w-3" />
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {templates.map((tpl) => (
          <Card key={tpl.id}>
            <CardContent className="flex items-start justify-between py-4">
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{tpl.name}</p>
                  {tpl.variables.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {tpl.variables.length} 個變數
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">主旨：{tpl.subject}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {tpl.body}
                </p>
                <p className="text-xs text-muted-foreground">
                  更新：{new Date(tpl.updatedAt).toLocaleString("zh-TW")}
                </p>
              </div>
              <div className="ml-4 flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(tpl)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(tpl.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && !showForm && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            尚未建立模板，請先新增一個模板
          </p>
        )}
      </div>
    </div>
  );
}
