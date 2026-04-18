import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { extractInfoFromBios } from "@/lib/llm-extract";
import { downloadAvatarAsDataUri } from "@/lib/download-avatar";
import { startRun, waitForRun, getDatasetItems } from "@/lib/apify";

function extractEmailFromText(text: string): string | null {
  if (!text) return null;
  const match = text.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
  return match ? match[0] : null;
}

function extractLineFromText(text: string): string | null {
  if (!text) return null;
  const patterns = [
    /line\s*(?:id|ID|Id)?\s*[:：]\s*@?([a-zA-Z0-9_.@-]+)/i,
    /LINE\s*[:：]\s*@?([a-zA-Z0-9_.@-]+)/,
    /(?:加|加入|聯繫)\s*LINE?\s*[:：]\s*@?([a-zA-Z0-9_.@-]+)/i,
    /L\s*I\s*N\s*E.*?[:：]\s*@?\s*([a-zA-Z0-9_.@-]+)/i,
    /官方\s*L\s*I?\s*N?\s*E?.*?@\s*([a-zA-Z0-9_.@-]+)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

interface ProfileData {
  username?: string;
  fullName?: string;
  followersCount?: number;
  followsCount?: number;
  biography?: string;
  externalUrl?: string;
  businessEmail?: string;
  publicEmail?: string;
  profilePicUrl?: string;
  profilePicUrlHD?: string;
  postsCount?: number;
  isVerified?: boolean;
  isBusinessAccount?: boolean;
  [key: string]: unknown;
}

export const maxDuration = 120;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  try {
    const { username } = (await request.json()) as { username: string };
    if (!username?.trim()) {
      return NextResponse.json({ error: "請提供 IG 帳號" }, { status: 400 });
    }

    // Clean up username - remove @ prefix, URL parts, trailing slashes
    const cleanUsername = username
      .trim()
      .replace(/^@/, "")
      .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
      .replace(/\/.*$/, "")
      .trim();

    if (!cleanUsername) {
      return NextResponse.json({ error: "無效的 IG 帳號" }, { status: 400 });
    }

    // Scrape profile via Apify
    const runId = await startRun("apify~instagram-profile-scraper", {
      usernames: [cleanUsername],
      includeAboutSection: false,
    });
    await waitForRun(runId);
    const items = (await getDatasetItems(runId)) as ProfileData[];

    if (items.length === 0) {
      return NextResponse.json({ error: "找不到此 IG 帳號" }, { status: 404 });
    }

    const profile = items[0];
    const bio = profile.biography || "";

    // LLM extraction + download avatar (in parallel)
    const rawPicUrl = profile.profilePicUrlHD || profile.profilePicUrl || "";
    const [llmResults, avatarDataUri] = await Promise.all([
      extractInfoFromBios([
        {
          username: profile.username || cleanUsername,
          biography: bio,
          externalUrl: profile.externalUrl || "",
        },
      ]),
      downloadAvatarAsDataUri(rawPicUrl),
    ]);
    const llm = llmResults.get(profile.username || cleanUsername);

    const email =
      profile.businessEmail ||
      profile.publicEmail ||
      llm?.email ||
      extractEmailFromText(bio) ||
      null;
    const line = llm?.lineId || extractLineFromText(bio) || null;
    const phone = llm?.phone || null;

    return NextResponse.json({
      username: profile.username || cleanUsername,
      fullName: profile.fullName || "",
      followersCount: profile.followersCount || 0,
      biography: bio,
      email,
      line,
      phone,
      profilePicUrl: avatarDataUri || rawPicUrl,
      externalUrl: profile.externalUrl || "",
      postsCount: profile.postsCount || 0,
      isVerified: profile.isVerified || false,
      isBusinessAccount: profile.isBusinessAccount || false,
      categories: llm?.categories || [],
      contentType: llm?.contentType || null,
    });
  } catch (error) {
    console.error("Profile scrape error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "取得 KOL 資料失敗" },
      { status: 500 }
    );
  }
}
