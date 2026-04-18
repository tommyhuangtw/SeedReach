"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

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

interface SearchResultsProps {
  posts: Post[];
  totalRaw: number;
}

export default function SearchResults({ posts, totalRaw }: SearchResultsProps) {
  // Count unique usernames
  const uniqueUsers = new Set(posts.map((p) => p.ownerUsername)).size;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        共爬取 {totalRaw} 篇，通過過濾 (likes &gt; 200)：
        <span className="ml-1 font-semibold text-foreground">{posts.length} 篇</span>
        ，來自
        <span className="ml-1 font-semibold text-foreground">{uniqueUsers} 位</span>
        唯一創作者
      </p>

      <div className="max-h-80 overflow-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>創作者</TableHead>
              <TableHead>內容</TableHead>
              <TableHead className="text-right">讚數</TableHead>
              <TableHead className="text-right">留言</TableHead>
              <TableHead>類型</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">
                  <div>
                    <p className="text-sm">@{post.ownerUsername}</p>
                    <p className="text-xs text-muted-foreground">{post.ownerFullName}</p>
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <p className="truncate text-sm" title={post.caption || undefined}>{post.caption || "-"}</p>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {post.likesCount?.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {post.commentsCount?.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {post.type || "post"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
