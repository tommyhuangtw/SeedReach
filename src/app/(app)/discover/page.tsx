"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Search, Loader2 } from "lucide-react";
import HashtagConfig from "@/components/discover/hashtag-config";
import SearchResults from "@/components/discover/search-results";
import ProfileResults, { type ProfileResult } from "@/components/discover/profile-results";
import SearchHistory from "@/components/discover/search-history";
import { toast } from "sonner";

const DEFAULT_HASHTAGS = [
  "保健",
  "魚油",
  "育兒",
  "鐵人三項",
  "男人保養",
  "益生菌",
  "營養師",
];

type Stage = "idle" | "searching" | "done" | "error";

interface Post {
  ownerUsername: string;
  ownerFullName: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  url: string;
  timestamp: string;
  type?: string;
}

export default function DiscoverPage() {
  const [hashtags, setHashtags] = useState<string[]>(DEFAULT_HASHTAGS);
  const [resultsLimit, setResultsLimit] = useState(50);
  const [stage, setStage] = useState<Stage>("idle");
  const [progressText, setProgressText] = useState("");

  // Results state
  const [posts, setPosts] = useState<Post[]>([]);
  const [totalRaw, setTotalRaw] = useState(0);
  const [profiles, setProfiles] = useState<ProfileResult[]>([]);

  async function handleSearch() {
    if (hashtags.length === 0) {
      toast.error("請至少輸入一個 hashtag");
      return;
    }

    setStage("searching");
    setProgressText("正在啟動 Apify 爬蟲，搜尋 Posts + Reels... (約需 2-5 分鐘)");
    setPosts([]);
    setProfiles([]);

    try {
      // Single API call that does everything: search → filter → profile scrape
      const res = await fetch("/api/discover/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hashtags, resultsLimit }),
        signal: AbortSignal.timeout(600_000), // 10 min timeout
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "搜尋失敗");
      }

      const data = await res.json();
      setPosts(data.posts || []);
      setTotalRaw(data.totalRaw || 0);
      setProfiles(data.profiles || []);
      setStage("done");

      const emailCount = (data.profiles || []).filter(
        (p: ProfileResult) => p.email
      ).length;
      const lineCount = (data.profiles || []).filter(
        (p: ProfileResult) => p.line
      ).length;

      toast.success(
        `完成！${data.totalRaw} 篇 → ${data.totalFiltered} 篇通過 → ${(data.profiles || []).length} 位 KOL (${emailCount} 有 Email, ${lineCount} 有 LINE)`
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "搜尋失敗";
      toast.error(msg);
      setStage("error");
      setProgressText(`錯誤：${msg}`);
    }
  }

  const isSearching = stage === "searching";

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">KOL 發掘</h2>

      <Tabs defaultValue="search">
        <TabsList>
          <TabsTrigger value="search">搜尋</TabsTrigger>
          <TabsTrigger value="history">搜尋歷史</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          {/* Search Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">搜尋設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Hashtags</Label>
                <HashtagConfig hashtags={hashtags} onChange={setHashtags} />
              </div>

              <div className="flex items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="resultsLimit">每個 hashtag 抓取上限</Label>
                  <Input
                    id="resultsLimit"
                    type="number"
                    min={10}
                    max={200}
                    value={resultsLimit}
                    onChange={(e) => setResultsLimit(parseInt(e.target.value) || 50)}
                    className="w-32"
                  />
                </div>

                <Button
                  onClick={handleSearch}
                  disabled={isSearching || hashtags.length === 0}
                  className="gap-2"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      搜尋中...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      開始搜尋
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                系統會自動：搜尋 Posts + Reels → 過濾 likes &gt; 200 → 取得 KOL Profile（含 Email / LINE）→ 全部存入資料庫
              </p>
            </CardContent>
          </Card>

          {/* Progress indicator */}
          {isSearching && (
            <Card>
              <CardContent className="flex items-center justify-center gap-3 py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <div className="text-center">
                  <p className="font-medium">{progressText}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    請勿關閉此頁面，Apify 爬蟲需要一些時間
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error state */}
          {stage === "error" && (
            <Card className="border-destructive">
              <CardContent className="py-6 text-center text-destructive">
                <p>{progressText}</p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => setStage("idle")}
                >
                  重試
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {stage === "done" && (
            <>
              {/* Search Results (posts) */}
              {posts.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-4 text-lg font-semibold">
                      搜尋結果（likes &gt; 200）
                    </h3>
                    <SearchResults
                      posts={posts}
                      totalRaw={totalRaw}
                    />
                  </div>
                </>
              )}

              {/* Profile Results */}
              {profiles.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-4 text-lg font-semibold">
                      KOL 詳細資料
                    </h3>
                    <ProfileResults profiles={profiles} />
                  </div>
                </>
              )}

              {profiles.length === 0 && posts.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    沒有找到符合條件的結果（likes &gt; 200）
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="history">
          <SearchHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
