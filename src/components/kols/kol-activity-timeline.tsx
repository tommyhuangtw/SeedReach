"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  MessageSquare,
  Mail,
  Plus,
  Clock,
} from "lucide-react";
import { addKolNote } from "@/lib/actions/kol-actions";
import { toast } from "sonner";

interface Activity {
  id: string;
  action: string;
  description: string | null;
  createdAt: Date;
}

const actionIcons: Record<string, typeof ArrowRight> = {
  狀態變更: ArrowRight,
  新增備註: MessageSquare,
  發送開發信: Mail,
  "新增 KOL": Plus,
  "CSV 匯入": Plus,
};

function formatDate(date: Date) {
  return new Date(date).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function KolActivityTimeline({
  activities,
  kolId,
}: {
  activities: Activity[];
  kolId: string;
}) {
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAddNote() {
    if (!note.trim()) return;
    setAdding(true);
    await addKolNote(kolId, note.trim());
    setNote("");
    setAdding(false);
    toast.success("備註已新增");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">活動紀錄</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Textarea
            placeholder="新增備註..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="flex-1"
          />
          <button
            onClick={handleAddNote}
            disabled={!note.trim() || adding}
            className="self-end rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {adding ? "..." : "新增"}
          </button>
        </div>

        <div className="space-y-0">
          {activities.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              尚無活動紀錄
            </p>
          ) : (
            activities.map((activity, index) => {
              const Icon = actionIcons[activity.action] || Clock;
              return (
                <div key={activity.id} className="flex gap-3 py-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {index < activities.length - 1 && (
                      <div className="mt-1 w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="text-sm font-medium">{activity.action}</p>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
