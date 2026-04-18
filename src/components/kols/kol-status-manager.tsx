"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import KolStatusBadge from "./kol-status-badge";
import { updateKolStatus } from "@/lib/actions/kol-actions";
import { toast } from "sonner";

const statusFlow = ["潛在", "已聯繫", "洽談中", "合作中", "結案"];

interface KolStatusManagerProps {
  kolId: string;
  currentStatus: string;
}

export default function KolStatusManager({
  kolId,
  currentStatus,
}: KolStatusManagerProps) {
  const currentIndex = statusFlow.indexOf(currentStatus);

  async function handleStatusChange(newStatus: string) {
    await updateKolStatus(kolId, newStatus);
    toast.success(`狀態已更新為「${newStatus}」`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">狀態管理</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <span className="text-sm text-muted-foreground">目前狀態：</span>
          <KolStatusBadge status={currentStatus} />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFlow.map((status, index) => (
            <Button
              key={status}
              variant={status === currentStatus ? "default" : "outline"}
              size="sm"
              disabled={status === currentStatus}
              onClick={() => handleStatusChange(status)}
              className={index < currentIndex ? "opacity-60" : ""}
            >
              {status}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
