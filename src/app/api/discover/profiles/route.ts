import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const APIFY_TOKEN = process.env.APIFY_API_TOKEN!;
const PROFILE_SCRAPER_URL = `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

function extractEmailFromBio(bio: string): string | null {
  if (!bio) return null;
  const emailRegex = /[\w.-]+@[\w.-]+\.\w{2,}/g;
  const matches = bio.match(emailRegex);
  return matches ? matches[0] : null;
}

function getEmail(profile: ProfileData): string | null {
  if (profile.businessEmail) return profile.businessEmail;
  if (profile.publicEmail) return profile.publicEmail;
  if (profile.biography) return extractEmailFromBio(profile.biography);
  return null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { usernames, searchId } = body as {
      usernames: string[];
      searchId?: string;
    };

    if (!usernames || usernames.length === 0) {
      return NextResponse.json({ error: "請提供至少一個 username" }, { status: 400 });
    }

    // Call Apify profile scraper
    const res = await fetch(PROFILE_SCRAPER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: usernames.map((u) => u.replace(/\/$/, "")),
        includeAboutSection: false,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Apify profile scraper failed: ${res.status} - ${text}`);
    }

    const profiles: ProfileData[] = await res.json();

    // Check which usernames already exist in KOL database
    const existingKols = await prisma.kol.findMany({
      where: {
        igHandle: { in: profiles.map((p) => p.username).filter(Boolean) as string[] },
      },
      select: { igHandle: true },
    });
    const existingHandles = new Set(existingKols.map((k) => k.igHandle));

    // Map profile data
    const results = profiles.map((profile) => {
      const email = getEmail(profile);
      return {
        username: profile.username || "",
        fullName: profile.fullName || "",
        followersCount: profile.followersCount || 0,
        followsCount: profile.followsCount || 0,
        biography: profile.biography || "",
        externalUrl: profile.externalUrl || "",
        email,
        profilePicUrl: profile.profilePicUrlHD || profile.profilePicUrl || "",
        postsCount: profile.postsCount || 0,
        isVerified: profile.isVerified || false,
        isBusinessAccount: profile.isBusinessAccount || false,
        alreadyAdded: existingHandles.has(profile.username || ""),
      };
    });

    // Save to discovery_results if searchId provided
    if (searchId) {
      for (const result of results) {
        await prisma.discoveryResult.create({
          data: {
            searchId,
            igHandle: result.username,
            name: result.fullName,
            followersCount: result.followersCount,
            bio: result.biography,
            avatarUrl: result.profilePicUrl,
            isAdded: result.alreadyAdded,
            rawData: JSON.parse(JSON.stringify(result)),
          },
        });
      }

      // Update search results count
      await prisma.discoverySearch.update({
        where: { id: searchId },
        data: { resultsCount: results.length },
      });
    }

    return NextResponse.json({ profiles: results });
  } catch (error) {
    console.error("Profile scraper error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "取得 KOL 資料失敗" },
      { status: 500 }
    );
  }
}
