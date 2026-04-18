"use client";

import { useState } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Plus, ExternalLink, Mail } from "lucide-react";
import { addDiscoveredKol } from "@/lib/actions/discover-actions";
import { toast } from "sonner";

export interface ProfileResult {
  username: string;
  fullName: string;
  followersCount: number;
  followsCount: number;
  biography: string;
  externalUrl: string;
  email: string | null;
  line: string | null;
  phone: string | null;
  categories: string[];
  contentType: string | null;
  collaboration: string | null;
  profilePicUrl: string;
  postsCount: number;
  isVerified: boolean;
  isBusinessAccount: boolean;
  alreadyAdded: boolean;
}

interface ProfileResultsProps {
  profiles: ProfileResult[];
}

export default function ProfileResults({ profiles }: ProfileResultsProps) {
  const [addedSet, setAddedSet] = useState<Set<string>>(
    new Set(profiles.filter((p) => p.alreadyAdded).map((p) => p.username))
  );
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set());

  async function handleAdd(profile: ProfileResult) {
    setLoadingSet((prev) => new Set(prev).add(profile.username));
    const result = await addDiscoveredKol({
      username: profile.username,
      fullName: profile.fullName,
      followersCount: profile.followersCount,
      biography: profile.biography,
      email: profile.email,
      line: profile.line,
      profilePicUrl: profile.profilePicUrl,
      externalUrl: profile.externalUrl,
    });
    setLoadingSet((prev) => {
      const next = new Set(prev);
      next.delete(profile.username);
      return next;
    });

    if (result.success) {
      setAddedSet((prev) => new Set(prev).add(profile.username));
      toast.success(result.updated ? `已更新 @${profile.username} 資料` : `已加入 @${profile.username}`);
    } else {
      toast.error(result.error || "新增失敗");
    }
  }

  async function handleAddAll() {
    const toAdd = profiles.filter((p) => !addedSet.has(p.username));
    let success = 0;
    let failed = 0;
    for (const profile of toAdd) {
      const result = await addDiscoveredKol({
        username: profile.username,
        fullName: profile.fullName,
        followersCount: profile.followersCount,
        biography: profile.biography,
        email: profile.email,
        line: profile.line,
        profilePicUrl: profile.profilePicUrl,
        externalUrl: profile.externalUrl,
      });
      if (result.success) {
        setAddedSet((prev) => new Set(prev).add(profile.username));
        success++;
      } else {
        failed++;
      }
    }
    toast.success(`已加入 ${success} 位 KOL${failed > 0 ? `，${failed} 位失敗` : ""}`);
  }

  const notAddedCount = profiles.filter((p) => !addedSet.has(p.username)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共找到 <span className="font-semibold text-foreground">{profiles.length}</span> 位 KOL
          {profiles.filter((p) => p.email).length > 0 && (
            <span>
              ，其中{" "}
              <span className="font-semibold text-foreground">
                {profiles.filter((p) => p.email).length}
              </span>{" "}
              位有 Email
            </span>
          )}
          {profiles.filter((p) => p.line).length > 0 && (
            <span>
              ，
              <span className="font-semibold text-foreground">
                {profiles.filter((p) => p.line).length}
              </span>{" "}
              位有 LINE
            </span>
          )}
        </p>
        {notAddedCount > 0 && (
          <Button onClick={handleAddAll} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            全部加入 ({notAddedCount})
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>KOL</TableHead>
              <TableHead className="text-right">粉絲數</TableHead>
              <TableHead className="text-right">貼文數</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>LINE</TableHead>
              <TableHead>類型</TableHead>
              <TableHead>Bio</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => {
              const isAdded = addedSet.has(profile.username);
              const isLoading = loadingSet.has(profile.username);
              return (
                <TableRow key={profile.username}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.profilePicUrl} />
                        <AvatarFallback>
                          {profile.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1">
                          <a
                            href={`https://www.instagram.com/${profile.username}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm font-medium hover:text-primary hover:underline"
                          >
                            @{profile.username}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {profile.isVerified && (
                            <Badge variant="secondary" className="px-1 py-0 text-xs">
                              V
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{profile.fullName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {profile.followersCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {profile.postsCount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {profile.email ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-green-600" />
                        <span className="max-w-32 truncate" title={profile.email || undefined}>{profile.email}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">未找到</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {profile.line ? (
                      <span className="text-sm">{profile.line}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">未找到</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {profile.contentType && (
                      <p className="text-xs font-medium">{profile.contentType}</p>
                    )}
                    {profile.categories.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap gap-0.5">
                        {profile.categories.map((c) => (
                          <Badge key={c} variant="outline" className="px-1 py-0 text-[10px]">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {!profile.contentType && profile.categories.length === 0 && (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-48">
                    <p className="line-clamp-2 text-xs text-muted-foreground" title={profile.biography || undefined}>
                      {profile.biography || "-"}
                    </p>
                  </TableCell>
                  <TableCell>
                    {isAdded ? (
                      <Badge variant="secondary" className="gap-1">
                        <Check className="h-3 w-3" />
                        已加入
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdd(profile)}
                        disabled={isLoading}
                      >
                        {isLoading ? "..." : "加入"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
