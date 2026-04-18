import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pencil, ArrowLeft, Tag, Users, BarChart3, ExternalLink } from "lucide-react";
import KolAvatar from "@/components/kols/kol-avatar";
import KolStatusBadge from "@/components/kols/kol-status-badge";
import KolStatusManager from "@/components/kols/kol-status-manager";
import KolActivityTimeline from "@/components/kols/kol-activity-timeline";

export default async function KolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kol = await prisma.kol.findUnique({
    where: { id },
    include: { activities: { orderBy: { createdAt: "desc" } } },
  });

  if (!kol) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/kols" />}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <KolAvatar src={kol.avatarUrl} name={kol.igHandle} className="h-12 w-12" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">
                {kol.name || `@${kol.igHandle}`}
              </h2>
              <KolStatusBadge status={kol.status} />
            </div>
            <a
              href={`https://www.instagram.com/${kol.igHandle}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-muted-foreground hover:text-primary hover:underline"
            >
              @{kol.igHandle}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <Button render={<Link href={`/kols/${kol.id}/edit`} />}>
          <Pencil className="mr-2 h-4 w-4" />
          編輯
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: main info + timeline */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">粉絲數</p>
                  <p className="text-lg font-bold">
                    {kol.followersCount?.toLocaleString() || "-"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">互動率</p>
                  <p className="text-lg font-bold">
                    {kol.engagementRate
                      ? `${Number(kol.engagementRate).toFixed(2)}%`
                      : "-"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <Tag className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">分類</p>
                  <p className="text-lg font-bold">{kol.category || "-"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Timeline */}
          <KolActivityTimeline activities={kol.activities} kolId={kol.id} />
        </div>

        {/* Right column: status + contact + tags + notes */}
        <div className="space-y-6">
          <KolStatusManager kolId={kol.id} currentStatus={kol.status} />

          {/* Contact info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">聯絡資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span>{kol.contactEmail || "-"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Line</span>
                <span>{kol.contactLine || "-"}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">電話</span>
                <span>{kol.contactPhone || "-"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          {kol.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">標籤</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1">
                {kol.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {kol.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">備註</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{kol.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Meta info */}
          <Card>
            <CardContent className="space-y-2 pt-6 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>來源</span>
                <span>{kol.source || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span>建立時間</span>
                <span>
                  {new Date(kol.createdAt).toLocaleDateString("zh-TW")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>更新時間</span>
                <span>
                  {new Date(kol.updatedAt).toLocaleDateString("zh-TW")}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
