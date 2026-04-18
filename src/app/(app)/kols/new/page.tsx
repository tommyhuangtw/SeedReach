"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, ExternalLink, Check } from "lucide-react";
import { addDiscoveredKol } from "@/lib/actions/discover-actions";
import { toast } from "sonner";

const statuses = ["潛在", "已聯繫", "洽談中", "合作中", "結案"];
const categories = ["美妝", "母嬰", "健康", "時尚", "美食", "生活", "科技", "其他"];

interface ScrapedProfile {
  username: string;
  fullName: string;
  followersCount: number;
  biography: string;
  email: string | null;
  line: string | null;
  phone: string | null;
  profilePicUrl: string;
  externalUrl: string;
  postsCount: number;
  isVerified: boolean;
  isBusinessAccount: boolean;
  categories: string[];
  contentType: string | null;
}

export default function NewKolPage() {
  const router = useRouter();
  const [igInput, setIgInput] = useState("");
  const [scraping, setScraping] = useState(false);
  const [profile, setProfile] = useState<ScrapedProfile | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable fields after scrape
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("潛在");
  const [tags, setTags] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactLine, setContactLine] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");

  async function handleScrape() {
    if (!igInput.trim()) {
      toast.error("請輸入 IG 帳號");
      return;
    }

    setScraping(true);
    setProfile(null);

    try {
      const res = await fetch("/api/kols/scrape-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: igInput.trim() }),
        signal: AbortSignal.timeout(120_000),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "取得資料失敗");
      }

      const data: ScrapedProfile = await res.json();
      setProfile(data);

      // Pre-fill editable fields
      setContactEmail(data.email || "");
      setContactLine(data.line || "");
      setContactPhone(data.phone || "");
      setNotes(data.biography || "");
      if (data.categories.length > 0) {
        // Try to match a known category
        const matched = categories.find((c) =>
          data.categories.some((dc) => dc.includes(c) || c.includes(dc))
        );
        if (matched) setCategory(matched);
      }

      toast.success(`已取得 @${data.username} 的資料`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "取得資料失敗";
      toast.error(msg);
    } finally {
      setScraping(false);
    }
  }

  async function handleSave() {
    if (!profile) return;

    setSaving(true);
    try {
      const result = await addDiscoveredKol({
        username: profile.username,
        fullName: profile.fullName,
        followersCount: profile.followersCount,
        biography: notes,
        email: contactEmail || null,
        line: contactLine || null,
        profilePicUrl: profile.profilePicUrl,
        externalUrl: profile.externalUrl,
      });

      if (result.success) {
        toast.success(result.updated ? `已更新 @${profile.username} 資料` : `已新增 @${profile.username}`);
        router.push("/kols");
      } else {
        toast.error(result.error || "新增失敗");
      }
    } catch {
      toast.error("新增失敗");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="text-2xl font-bold">新增 KOL</h2>

      {/* Step 1: Enter IG handle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">輸入 IG 帳號</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="例如: ai.lanrenbao 或 https://www.instagram.com/ai.lanrenbao/"
              value={igInput}
              onChange={(e) => setIgInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScrape()}
              disabled={scraping}
              className="flex-1"
            />
            <Button onClick={handleScrape} disabled={scraping || !igInput.trim()} className="gap-2">
              {scraping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  取得中...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  自動取得資料
                </>
              )}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            輸入 IG 帳號或完整網址，系統會自動爬取 Profile 資料、Email、LINE 等
          </p>
        </CardContent>
      </Card>

      {/* Loading state */}
      {scraping && (
        <Card>
          <CardContent className="flex items-center justify-center gap-3 py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">正在透過 Apify 取得 IG Profile...</p>
              <p className="mt-1 text-sm text-muted-foreground">約需 30-60 秒</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Review & Edit scraped data */}
      {profile && !scraping && (
        <>
          {/* Profile preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">KOL 資料預覽</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profile.profilePicUrl}
                  alt={profile.username}
                  className="h-16 w-16 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://www.instagram.com/${profile.username}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-lg font-semibold hover:text-primary hover:underline"
                    >
                      @{profile.username}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    {profile.isVerified && <Badge variant="secondary">已驗證</Badge>}
                    {profile.isBusinessAccount && <Badge variant="outline">商業帳號</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{profile.fullName}</p>
                  <div className="flex gap-4 text-sm">
                    <span><strong>{profile.followersCount.toLocaleString()}</strong> 粉絲</span>
                    <span><strong>{profile.postsCount.toLocaleString()}</strong> 貼文</span>
                  </div>
                  {profile.contentType && (
                    <div className="flex gap-1 pt-1">
                      <Badge variant="secondary">{profile.contentType}</Badge>
                      {profile.categories.map((c) => (
                        <Badge key={c} variant="outline">{c}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editable fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">編輯 KOL 資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>分類</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇分類" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>狀態</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v ?? "潛在")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>標籤</Label>
                <Input
                  placeholder="標籤1, 標籤2, 標籤3"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">以逗號分隔</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>聯絡 Email {contactEmail && <Check className="inline h-3 w-3 text-green-600" />}</Label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>聯絡 LINE {contactLine && <Check className="inline h-3 w-3 text-green-600" />}</Label>
                  <Input
                    placeholder="LINE ID"
                    value={contactLine}
                    onChange={(e) => setContactLine(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>聯絡電話 {contactPhone && <Check className="inline h-3 w-3 text-green-600" />}</Label>
                  <Input
                    placeholder="0912345678"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>備註（Bio）</Label>
                <Textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      新增中...
                    </>
                  ) : (
                    "新增 KOL"
                  )}
                </Button>
                <Button variant="outline" onClick={() => router.back()}>
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
