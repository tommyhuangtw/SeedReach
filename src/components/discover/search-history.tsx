"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import KolAvatar from "@/components/kols/kol-avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, ChevronDown, ChevronUp, Check, Plus, Mail, Filter, ExternalLink } from "lucide-react";
import {
  getSearchHistory,
  getSearchResults,
  addDiscoveredKol,
  updateDiscoveryResultAdded,
} from "@/lib/actions/discover-actions";
import { toast } from "sonner";

interface SearchRecord {
  id: string;
  query: string;
  searchType: string | null;
  resultsCount: number | null;
  createdAt: Date;
  results: { id: string; igHandle: string | null; name: string | null; isAdded: boolean }[];
}

interface DiscoveryResult {
  id: string;
  searchId: string;
  igHandle: string | null;
  name: string | null;
  followersCount: number | null;
  bio: string | null;
  avatarUrl: string | null;
  isAdded: boolean;
  rawData: unknown;
  createdAt: Date;
}

type FilterType = "all" | "added" | "not_added" | "has_email" | "has_line";

function getRawField(rawData: unknown, field: string): unknown {
  if (rawData && typeof rawData === "object" && !Array.isArray(rawData)) {
    return (rawData as Record<string, unknown>)[field];
  }
  return undefined;
}

function SearchResultsDetail({ searchId }: { searchId: string }) {
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [addingSet, setAddingSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    getSearchResults(searchId).then((data) => {
      setResults(data);
      setLoading(false);
    });
  }, [searchId]);

  if (loading) {
    return <p className="py-4 text-center text-sm text-muted-foreground">載入 KOL 資料中...</p>;
  }

  if (results.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">此搜尋無 KOL 結果</p>;
  }

  const filtered = results.filter((r) => {
    const email = getRawField(r.rawData, "email") as string | null;
    const line = getRawField(r.rawData, "line") as string | null;
    switch (filter) {
      case "added":
        return r.isAdded;
      case "not_added":
        return !r.isAdded;
      case "has_email":
        return !!email;
      case "has_line":
        return !!line;
      default:
        return true;
    }
  });

  const emailCount = results.filter((r) => getRawField(r.rawData, "email")).length;
  const lineCount = results.filter((r) => getRawField(r.rawData, "line")).length;
  const addedCount = results.filter((r) => r.isAdded).length;

  async function handleAdd(result: DiscoveryResult) {
    setAddingSet((prev) => new Set(prev).add(result.id));
    const email = getRawField(result.rawData, "email") as string | null;
    const line = getRawField(result.rawData, "line") as string | null;
    const profilePicUrl = (getRawField(result.rawData, "profilePicUrl") as string) || result.avatarUrl || "";
    const externalUrl = (getRawField(result.rawData, "externalUrl") as string) || "";

    const res = await addDiscoveredKol({
      username: result.igHandle || "",
      fullName: result.name || "",
      followersCount: result.followersCount || 0,
      biography: result.bio || "",
      email,
      line,
      profilePicUrl,
      externalUrl,
    });

    setAddingSet((prev) => {
      const next = new Set(prev);
      next.delete(result.id);
      return next;
    });

    if (res.success) {
      await updateDiscoveryResultAdded(result.id, true);
      setResults((prev) =>
        prev.map((r) => (r.id === result.id ? { ...r, isAdded: true } : r))
      );
      toast.success(res.updated ? `已更新 @${result.igHandle} 資料` : `已加入 @${result.igHandle}`);
    } else {
      toast.error(res.error || "新增失敗");
    }
  }

  const filters: { key: FilterType; label: string; count?: number }[] = [
    { key: "all", label: "全部", count: results.length },
    { key: "added", label: "已加入", count: addedCount },
    { key: "not_added", label: "未加入", count: results.length - addedCount },
    { key: "has_email", label: "有 Email", count: emailCount },
    { key: "has_line", label: "有 LINE", count: lineCount },
  ];

  return (
    <div className="space-y-3 pt-2">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setFilter(f.key)}
          >
            {f.label} ({f.count})
          </Button>
        ))}
      </div>

      {/* Results table */}
      <div className="max-h-96 overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>KOL</TableHead>
              <TableHead className="text-right">粉絲數</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>LINE</TableHead>
              <TableHead>Bio</TableHead>
              <TableHead className="w-20">狀態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((result) => {
              const email = getRawField(result.rawData, "email") as string | null;
              const line = getRawField(result.rawData, "line") as string | null;
              const isAdding = addingSet.has(result.id);

              return (
                <TableRow key={result.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <KolAvatar src={result.avatarUrl} name={result.igHandle || "?"} className="h-7 w-7" />
                      <div>
                        <a
                          href={`https://www.instagram.com/${result.igHandle}/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm font-medium hover:text-primary hover:underline"
                        >
                          @{result.igHandle}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        <p className="text-xs text-muted-foreground">{result.name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {(result.followersCount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {email ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-green-600" />
                        <span className="max-w-28 truncate" title={email || undefined}>{email}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {line ? (
                      <span className="text-sm">{line}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-40">
                    <p className="line-clamp-2 text-xs text-muted-foreground" title={result.bio || undefined}>
                      {result.bio || "-"}
                    </p>
                  </TableCell>
                  <TableCell>
                    {result.isAdded ? (
                      <Badge variant="secondary" className="gap-1">
                        <Check className="h-3 w-3" />
                        已加入
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleAdd(result)}
                        disabled={isAdding}
                      >
                        {isAdding ? "..." : (
                          <>
                            <Plus className="mr-1 h-3 w-3" />
                            加入
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                  沒有符合篩選條件的結果
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function SearchHistory() {
  const [searches, setSearches] = useState<SearchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getSearchHistory().then((data) => {
      setSearches(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <p className="py-8 text-center text-sm text-muted-foreground">載入中...</p>;
  }

  if (searches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 text-muted-foreground">
        <Clock className="h-12 w-12" />
        <p>尚無搜尋紀錄</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {searches.map((search) => {
        const isExpanded = expandedId === search.id;
        return (
          <Card key={search.id}>
            <CardHeader
              className="cursor-pointer pb-2"
              onClick={() => setExpandedId(isExpanded ? null : search.id)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  {search.query}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(search.createdAt).toLocaleString("zh-TW")}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-sm">
                <Badge variant="outline">{search.searchType || "hashtag"}</Badge>
                <span className="text-muted-foreground">
                  結果：{search.resultsCount ?? 0} 篇
                </span>
                {search.results.length > 0 && (
                  <span className="text-muted-foreground">
                    KOL：{search.results.length} 位
                    （已加入：{search.results.filter((r) => r.isAdded).length}）
                  </span>
                )}
              </div>

              {isExpanded && search.results.length > 0 && (
                <SearchResultsDetail searchId={search.id} />
              )}

              {isExpanded && search.results.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  此搜尋無 KOL 結果
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
