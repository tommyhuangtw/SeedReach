import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractInfoFromBios } from "@/lib/llm-extract";
import { downloadAvatars } from "@/lib/download-avatar";
import { startRun, waitForRun, getDatasetItems } from "@/lib/apify";

// --- Contact extraction ---

function extractEmailFromText(text: string): string | null {
  if (!text) return null;
  const match = text.match(/[\w.-]+@[\w.-]+\.\w{2,}/);
  return match ? match[0] : null;
}

function extractLineFromText(text: string): string | null {
  if (!text) return null;
  // Common patterns: LINE: xxx, LINE ID: xxx, Line @xxx, line id xxx
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

// --- Types ---

interface HashtagPost {
  caption?: string;
  ownerFullName?: string;
  ownerUsername?: string;
  url?: string;
  commentsCount?: number;
  likesCount?: number;
  timestamp?: string;
  hashtags?: string[];
  type?: string;
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

// --- Route config ---

export const maxDuration = 300; // Allow up to 5 min for this route

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { hashtags, resultsLimit = 50 } = body as {
      hashtags: string[];
      resultsLimit?: number;
    };

    if (!hashtags || hashtags.length === 0) {
      return NextResponse.json({ error: "請提供至少一個 hashtag" }, { status: 400 });
    }

    // ===== STEP 1: Scrape hashtags (posts + reels in parallel) =====
    const [postsRunId, reelsRunId] = await Promise.all([
      startRun("apify~instagram-hashtag-scraper", {
        hashtags,
        keywordSearch: true,
        resultsLimit,
        resultsType: "posts",
      }),
      startRun("apify~instagram-hashtag-scraper", {
        hashtags,
        keywordSearch: true,
        resultsLimit,
        resultsType: "reels",
      }),
    ]);

    // Wait for both runs to finish
    await Promise.all([waitForRun(postsRunId), waitForRun(reelsRunId)]);

    // Get results
    const [postsRaw, reelsRaw] = await Promise.all([
      getDatasetItems(postsRunId),
      getDatasetItems(reelsRunId),
    ]);

    const postsResults = postsRaw as HashtagPost[];
    const reelsResults = reelsRaw as HashtagPost[];
    const allResults = [...postsResults, ...reelsResults];

    // ===== STEP 2: Filter likes > 200 & extract unique usernames =====
    const filtered = allResults.filter((post) => (post.likesCount ?? 0) > 200);

    const usernameSet = new Set<string>();
    for (const post of filtered) {
      const username = post.ownerUsername?.trim();
      if (username) usernameSet.add(username);
    }
    const uniqueUsernames = Array.from(usernameSet);

    if (uniqueUsernames.length === 0) {
      // Save search record even if no results
      const search = await prisma.discoverySearch.create({
        data: {
          query: hashtags.join(", "),
          searchType: "hashtag",
          resultsCount: 0,
        },
      });
      return NextResponse.json({
        searchId: search.id,
        totalRaw: allResults.length,
        totalFiltered: filtered.length,
        posts: [],
        profiles: [],
      });
    }

    // ===== STEP 3: Scrape profiles =====
    const profileRunId = await startRun("apify~instagram-profile-scraper", {
      usernames: uniqueUsernames,
      includeAboutSection: false,
    });
    await waitForRun(profileRunId);
    const profilesRaw = (await getDatasetItems(profileRunId)) as ProfileData[];

    // Check which already exist in KOL database
    const existingKols = await prisma.kol.findMany({
      where: {
        igHandle: {
          in: profilesRaw
            .map((p) => p.username)
            .filter(Boolean) as string[],
        },
      },
      select: { igHandle: true },
    });
    const existingHandles = new Set(existingKols.map((k) => k.igHandle));

    // ===== STEP 3.5: LLM extraction + download avatars (in parallel) =====
    const [llmResults, avatarMap] = await Promise.all([
      extractInfoFromBios(
        profilesRaw.map((p) => ({
          username: p.username || "",
          biography: p.biography || "",
          externalUrl: p.externalUrl || "",
        }))
      ),
      downloadAvatars(
        profilesRaw.map((p) => ({
          username: p.username || "",
          profilePicUrl: p.profilePicUrlHD || p.profilePicUrl || "",
        }))
      ),
    ]);

    // Map profile data with contact extraction (regex + LLM)
    const profiles = profilesRaw.map((profile) => {
      const bio = profile.biography || "";
      const username = profile.username || "";
      const llm = llmResults.get(username);

      // Email: Apify fields > LLM > regex
      const email =
        profile.businessEmail ||
        profile.publicEmail ||
        llm?.email ||
        extractEmailFromText(bio) ||
        null;

      // LINE: LLM > regex
      const line = llm?.lineId || extractLineFromText(bio) || null;

      // Phone: LLM only
      const phone = llm?.phone || null;

      return {
        username,
        fullName: profile.fullName || "",
        followersCount: profile.followersCount || 0,
        followsCount: profile.followsCount || 0,
        biography: bio,
        externalUrl: profile.externalUrl || "",
        email,
        line,
        phone,
        categories: llm?.categories || [],
        contentType: llm?.contentType || null,
        collaboration: llm?.collaboration || null,
        profilePicUrl:
          avatarMap.get(username) || profile.profilePicUrlHD || profile.profilePicUrl || "",
        postsCount: profile.postsCount || 0,
        isVerified: profile.isVerified || false,
        isBusinessAccount: profile.isBusinessAccount || false,
        alreadyAdded: existingHandles.has(username),
      };
    });

    // ===== STEP 4: Save everything to DB =====
    const search = await prisma.discoverySearch.create({
      data: {
        query: hashtags.join(", "),
        searchType: "hashtag",
        resultsCount: profiles.length,
        apifyRunId: `posts:${postsRunId},reels:${reelsRunId},profiles:${profileRunId}`,
      },
    });

    // Save all profiles to discovery_results
    for (const profile of profiles) {
      await prisma.discoveryResult.create({
        data: {
          searchId: search.id,
          igHandle: profile.username,
          name: profile.fullName,
          followersCount: profile.followersCount,
          bio: profile.biography,
          avatarUrl: profile.profilePicUrl,
          isAdded: profile.alreadyAdded,
          rawData: JSON.parse(JSON.stringify(profile)),
        },
      });
    }

    return NextResponse.json({
      searchId: search.id,
      totalRaw: allResults.length,
      totalFiltered: filtered.length,
      posts: filtered.map((post) => ({
        ownerUsername: post.ownerUsername,
        ownerFullName: post.ownerFullName,
        caption: post.caption?.slice(0, 200),
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        url: post.url,
        timestamp: post.timestamp,
        hashtags: post.hashtags,
        type: post.type,
      })),
      profiles,
    });
  } catch (error) {
    console.error("Discover search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "搜尋失敗" },
      { status: 500 }
    );
  }
}
