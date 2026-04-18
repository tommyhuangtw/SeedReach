"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import Papa from "papaparse";
import { importKolsFromCsv } from "@/lib/actions/kol-actions";
import { toast } from "sonner";

export default function CsvImportDialog() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const data = results.data as Record<string, string>[];
        const valid = data.filter((r) => r.ig_handle?.trim());
        setRows(valid);
      },
    });
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    const result = await importKolsFromCsv(rows);
    setImporting(false);
    toast.success(`匯入完成：${result.success} 筆成功，${result.failed} 筆失敗`);
    if (result.errors.length > 0) {
      result.errors.forEach((err) => toast.error(err));
    }
    setOpen(false);
    setRows([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Upload className="mr-2 h-4 w-4" />
        CSV 匯入
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>CSV 批次匯入 KOL</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              CSV 欄位格式：ig_handle, name, followers_count, engagement_rate,
              category, tags (分號分隔), contact_email, contact_line,
              contact_phone, notes
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {rows.length > 0 && (
            <div>
              <p className="text-sm font-medium">
                已解析 {rows.length} 筆資料
              </p>
              <div className="mt-2 max-h-48 overflow-auto rounded border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="px-2 py-1 text-left">IG 帳號</th>
                      <th className="px-2 py-1 text-left">名稱</th>
                      <th className="px-2 py-1 text-left">分類</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-b">
                        <td className="px-2 py-1">@{row.ig_handle}</td>
                        <td className="px-2 py-1">{row.name || "-"}</td>
                        <td className="px-2 py-1">{row.category || "-"}</td>
                      </tr>
                    ))}
                    {rows.length > 20 && (
                      <tr>
                        <td colSpan={3} className="px-2 py-1 text-center text-muted-foreground">
                          ... 還有 {rows.length - 20} 筆
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleImport}
              disabled={rows.length === 0 || importing}
            >
              {importing ? "匯入中..." : `匯入 ${rows.length} 筆`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
