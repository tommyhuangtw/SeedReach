"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

interface DiscoveredKolData {
  username: string;
  fullName: string;
  followersCount: number;
  biography: string;
  email: string | null;
  line: string | null;
  profilePicUrl: string;
  externalUrl: string;
}

export async function addDiscoveredKol(data: DiscoveredKolData) {
  try {
    // Check if KOL already exists
    const existing = await prisma.kol.findUnique({
      where: { igHandle: data.username },
    });

    if (existing) {
      // Update existing KOL with fresh data (only overwrite non-empty fields)
      await prisma.kol.update({
        where: { id: existing.id },
        data: {
          name: data.fullName || existing.name,
          avatarUrl: data.profilePicUrl || existing.avatarUrl,
          followersCount: data.followersCount || existing.followersCount,
          contactEmail: data.email || existing.contactEmail,
          contactLine: data.line || existing.contactLine,
          notes: data.biography || existing.notes,
        },
      });

      await prisma.kolActivity.create({
        data: {
          kolId: existing.id,
          action: "資料更新",
          description: `透過 Apify 更新 KOL 資料: @${existing.igHandle}`,
        },
      });

      revalidatePath("/kols");
      revalidatePath(`/kols/${existing.id}`);
      revalidatePath("/dashboard");
      return { success: true, kolId: existing.id, updated: true };
    }

    // Create new KOL
    const kol = await prisma.kol.create({
      data: {
        igHandle: data.username,
        name: data.fullName || null,
        avatarUrl: data.profilePicUrl || null,
        followersCount: data.followersCount || null,
        contactEmail: data.email || null,
        contactLine: data.line || null,
        notes: data.biography || null,
        source: "Apify發掘",
        status: "潛在",
      },
    });

    await prisma.kolActivity.create({
      data: {
        kolId: kol.id,
        action: "Apify 發掘",
        description: `透過 Apify 發掘新增 KOL: @${kol.igHandle}`,
      },
    });

    revalidatePath("/kols");
    revalidatePath("/dashboard");
    return { success: true, kolId: kol.id, updated: false };
  } catch {
    return { success: false, error: "新增失敗" };
  }
}

export async function getSearchHistory() {
  const searches = await prisma.discoverySearch.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      results: {
        select: { id: true, igHandle: true, name: true, isAdded: true },
      },
    },
  });
  return searches;
}

export async function getSearchResults(searchId: string) {
  const results = await prisma.discoveryResult.findMany({
    where: { searchId },
    orderBy: { createdAt: "desc" },
  });
  return results;
}

export async function updateDiscoveryResultAdded(resultId: string, isAdded: boolean) {
  await prisma.discoveryResult.update({
    where: { id: resultId },
    data: { isAdded },
  });
  revalidatePath("/discover");
}
