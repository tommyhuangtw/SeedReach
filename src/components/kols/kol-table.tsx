"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import KolAvatar from "./kol-avatar";
import { MoreHorizontal, Eye, Pencil, Trash2, ExternalLink, Mail } from "lucide-react";
import KolStatusBadge from "./kol-status-badge";
import { deleteKol } from "@/lib/actions/kol-actions";
import { toast } from "sonner";

interface KolRow {
  id: string;
  igHandle: string;
  name: string | null;
  avatarUrl: string | null;
  followersCount: number | null;
  engagementRate: string | number | null;
  contactEmail: string | null;
  contactLine: string | null;
  category: string | null;
  status: string;
}

interface KolTableProps {
  kols: KolRow[];
  total: number;
  page: number;
  pageSize: number;
}

export default function KolTable({ kols, total, page, pageSize }: KolTableProps) {
  const router = useRouter();
  const totalPages = Math.ceil(total / pageSize);

  async function handleDelete(id: string, handle: string) {
    if (!confirm(`確定要刪除 @${handle} 嗎？此操作無法復原。`)) return;
    await deleteKol(id);
    toast.success(`已刪除 @${handle}`);
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>KOL</TableHead>
              <TableHead className="text-right">粉絲數</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>LINE</TableHead>
              <TableHead>分類</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {kols.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  尚無 KOL 資料
                </TableCell>
              </TableRow>
            ) : (
              kols.map((kol) => (
                <TableRow key={kol.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <KolAvatar src={kol.avatarUrl} name={kol.igHandle} />
                      <div>
                        <Link
                          href={`/kols/${kol.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          @{kol.igHandle}
                        </Link>
                        <p className="text-xs text-muted-foreground">{kol.name || ""}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {kol.followersCount?.toLocaleString() || "-"}
                  </TableCell>
                  <TableCell>
                    {kol.contactEmail ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-green-600" />
                        <span className="max-w-28 truncate">{kol.contactEmail}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {kol.contactLine ? (
                      <span className="text-sm">{kol.contactLine}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{kol.category || "-"}</TableCell>
                  <TableCell>
                    <KolStatusBadge status={kol.status} />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon" className="h-8 w-8" />}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => window.open(`https://www.instagram.com/${kol.igHandle}/`, "_blank")}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          IG 主頁
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/kols/${kol.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          檢視
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/kols/${kol.id}/edit`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          編輯
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(kol.id, kol.igHandle)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          刪除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {total} 筆，第 {page} / {totalPages} 頁
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => router.push(`/kols?page=${page - 1}`)}
            >
              上一頁
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => router.push(`/kols?page=${page + 1}`)}
            >
              下一頁
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
