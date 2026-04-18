"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import KolAvatar from "@/components/kols/kol-avatar";
import { Mail, Send, ArrowLeft, ArrowRight, Search, Check } from "lucide-react";
import {
  getTemplates,
  getKolsForOutreach,
  sendOutreachEmails,
} from "@/lib/actions/outreach-actions";
import { toast } from "sonner";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
}

interface KolForOutreach {
  id: string;
  igHandle: string;
  name: string | null;
  avatarUrl: string | null;
  contactEmail: string | null;
  followersCount: number | null;
  category: string | null;
  status: string;
}

type Step = "template" | "kols" | "preview" | "sending" | "done";

export default function SendEmailForm() {
  const [step, setStep] = useState<Step>("template");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [kols, setKols] = useState<KolForOutreach[]>([]);
  const [selectedKolIds, setSelectedKolIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    sent: number;
    failed: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    Promise.all([getTemplates(), getKolsForOutreach()]).then(
      ([tpls, kolList]) => {
        setTemplates(tpls);
        setKols(kolList);
        setLoading(false);
      }
    );
  }, []);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const filteredKols = kols.filter((k) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !k.igHandle.toLowerCase().includes(q) &&
        !(k.name || "").toLowerCase().includes(q)
      )
        return false;
    }
    if (statusFilter !== "全部" && k.status !== statusFilter) return false;
    return true;
  });

  function toggleKol(id: string) {
    setSelectedKolIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedKolIds.size === filteredKols.length) {
      setSelectedKolIds(new Set());
    } else {
      setSelectedKolIds(new Set(filteredKols.map((k) => k.id)));
    }
  }

  function substitutePreview(text: string, kolName: string) {
    return text.replace(/\{\{kol_name\}\}/gi, kolName);
  }

  async function handleSend() {
    if (!selectedTemplateId || selectedKolIds.size === 0) return;
    setSending(true);
    setStep("sending");
    try {
      const result = await sendOutreachEmails({
        templateId: selectedTemplateId,
        kolIds: Array.from(selectedKolIds),
      });
      setSendResult(result);
      setStep("done");
      if (result.failed === 0) {
        toast.success(`成功寄出 ${result.sent} 封開發信`);
      } else {
        toast.warning(
          `寄出 ${result.sent} 封，${result.failed} 封失敗`
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "寄送失敗");
      setStep("preview");
    }
    setSending(false);
  }

  function handleReset() {
    setStep("template");
    setSelectedTemplateId("");
    setSelectedKolIds(new Set());
    setSendResult(null);
  }

  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">載入中...</p>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-muted-foreground">
        <Mail className="h-12 w-12" />
        <p>請先在「模板管理」建立一個信件模板</p>
      </div>
    );
  }

  // ===== Step 1: Select template =====
  if (step === "template") {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">第一步：選擇信件模板</h3>
        <div className="grid gap-2">
          {templates.map((tpl) => (
            <Card
              key={tpl.id}
              className={`cursor-pointer transition-colors ${
                selectedTemplateId === tpl.id
                  ? "border-primary ring-1 ring-primary"
                  : "hover:border-muted-foreground/30"
              }`}
              onClick={() => setSelectedTemplateId(tpl.id)}
            >
              <CardContent className="py-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-4 w-4 rounded-full border-2 ${
                      selectedTemplateId === tpl.id
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{tpl.name}</p>
                    <p className="text-sm text-muted-foreground">
                      主旨：{tpl.subject}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() => setStep("kols")}
            disabled={!selectedTemplateId}
          >
            下一步
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ===== Step 2: Select KOLs =====
  if (step === "kols") {
    const statuses = ["全部", ...new Set(kols.map((k) => k.status))];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            第二步：選擇 KOL（僅顯示有 Email 的 KOL）
          </h3>
          <Badge variant="outline">
            已選 {selectedKolIds.size} / {filteredKols.length}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              className="h-8 pl-8"
              placeholder="搜尋 KOL..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {statuses.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </Button>
          ))}
        </div>

        <div className="max-h-96 overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredKols.length > 0 &&
                      selectedKolIds.size === filteredKols.length
                    }
                    onChange={toggleAll}
                    className="h-4 w-4"
                  />
                </TableHead>
                <TableHead>KOL</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">粉絲數</TableHead>
                <TableHead>狀態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKols.map((kol) => (
                <TableRow
                  key={kol.id}
                  className="cursor-pointer"
                  onClick={() => toggleKol(kol.id)}
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedKolIds.has(kol.id)}
                      onChange={() => toggleKol(kol.id)}
                      className="h-4 w-4"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <KolAvatar
                        src={kol.avatarUrl}
                        name={kol.igHandle}
                        className="h-7 w-7"
                      />
                      <div>
                        <p className="text-sm font-medium">@{kol.igHandle}</p>
                        <p className="text-xs text-muted-foreground">
                          {kol.name}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {kol.contactEmail}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {(kol.followersCount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {kol.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {filteredKols.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    沒有符合條件的 KOL（需有 Email）
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep("template")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            上一步
          </Button>
          <Button
            onClick={() => setStep("preview")}
            disabled={selectedKolIds.size === 0}
          >
            預覽
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ===== Step 3: Preview =====
  if (step === "preview" && selectedTemplate) {
    const previewKol = kols.find((k) => selectedKolIds.has(k.id));
    const previewName = previewKol
      ? previewKol.name || previewKol.igHandle
      : "KOL 名稱";

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">第三步：預覽信件</h3>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">信件預覽（以第一位 KOL 為例）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground">主旨</p>
              <p className="font-medium">
                {substitutePreview(selectedTemplate.subject, previewName)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">內容</p>
              <div className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
                {substitutePreview(selectedTemplate.body, previewName)}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-md bg-muted/50 p-3 text-sm">
          將寄送給 <span className="font-semibold">{selectedKolIds.size}</span> 位
          KOL，每封信的 {"{{kol_name}}"} 會自動替換為該 KOL 的名稱。
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep("kols")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            上一步
          </Button>
          <Button onClick={handleSend}>
            <Send className="mr-2 h-4 w-4" />
            確認寄送 ({selectedKolIds.size} 封)
          </Button>
        </div>
      </div>
    );
  }

  // ===== Step 4: Sending =====
  if (step === "sending") {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">
          正在寄送開發信，請勿關閉頁面...
        </p>
      </div>
    );
  }

  // ===== Step 5: Done =====
  if (step === "done" && sendResult) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium">寄送完成</p>
            <p className="mt-1 text-sm text-muted-foreground">
              成功：{sendResult.sent} 封
              {sendResult.failed > 0 && `，失敗：${sendResult.failed} 封`}
            </p>
          </div>
        </div>

        {sendResult.errors.length > 0 && (
          <Card>
            <CardContent className="py-3">
              <p className="mb-2 text-sm font-medium text-destructive">
                失敗紀錄
              </p>
              {sendResult.errors.map((err, i) => (
                <p key={i} className="text-xs text-muted-foreground">
                  {err}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <Button onClick={handleReset} variant="outline">
            寄送新一批
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
