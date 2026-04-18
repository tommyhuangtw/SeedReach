"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import KolAvatar from "@/components/kols/kol-avatar";
import { Clock, Filter } from "lucide-react";
import { getOutreachHistory } from "@/lib/actions/outreach-actions";

interface OutreachRecord {
  id: string;
  toEmail: string;
  subject: string;
  status: string;
  sentAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  kol: { igHandle: string; name: string | null; avatarUrl: string | null } | null;
  template: { name: string } | null;
}

type StatusFilter = "all" | "已寄送" | "失敗" | "草稿";

export default function OutreachHistory() {
  const [records, setRecords] = useState<OutreachRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    getOutreachHistory().then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">載入中...</p>;
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-muted-foreground">
        <Clock className="h-12 w-12" />
        <p>尚無寄送紀錄</p>
      </div>
    );
  }

  const filtered = filter === "all" ? records : records.filter((r) => r.status === filter);
  const sentCount = records.filter((r) => r.status === "已寄送").length;
  const failedCount = records.filter((r) => r.status === "失敗").length;

  const filters: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "全部", count: records.length },
    { key: "已寄送", label: "已寄送", count: sentCount },
    { key: "失敗", label: "失敗", count: failedCount },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {filters.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            className="h-7 text-xs"
            onClick={() => setFilter(f.key)}
          >
            {f.label} ({f.count})
          </Button>
        ))}
      </div>

      <div className="max-h-[500px] overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>KOL</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>主旨</TableHead>
              <TableHead>模板</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>時間</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  {record.kol ? (
                    <div className="flex items-center gap-2">
                      <KolAvatar
                        src={record.kol.avatarUrl}
                        name={record.kol.igHandle}
                        className="h-7 w-7"
                      />
                      <div>
                        <p className="text-sm font-medium">
                          @{record.kol.igHandle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {record.kol.name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">{record.toEmail}</TableCell>
                <TableCell className="max-w-48">
                  <p className="truncate text-sm" title={record.subject}>
                    {record.subject}
                  </p>
                </TableCell>
                <TableCell>
                  {record.template ? (
                    <Badge variant="outline" className="text-xs">
                      {record.template.name}
                    </Badge>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={record.status === "已寄送" ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {record.status}
                  </Badge>
                  {record.errorMessage && (
                    <p
                      className="mt-0.5 max-w-32 truncate text-xs text-destructive"
                      title={record.errorMessage}
                    >
                      {record.errorMessage}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {record.sentAt
                    ? new Date(record.sentAt).toLocaleString("zh-TW")
                    : new Date(record.createdAt).toLocaleString("zh-TW")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
