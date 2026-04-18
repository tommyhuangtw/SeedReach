"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const KolSchema = z.object({
  igHandle: z.string().min(1, "IG 帳號為必填"),
  name: z.string().optional().default(""),
  followersCount: z.coerce.number().int().nonnegative().optional().nullable(),
  engagementRate: z.coerce.number().nonnegative().optional().nullable(),
  category: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
  contactEmail: z.string().optional().default(""),
  contactLine: z.string().optional().default(""),
  contactPhone: z.string().optional().default(""),
  status: z
    .enum(["潛在", "已聯繫", "洽談中", "合作中", "結案"])
    .default("潛在"),
  notes: z.string().optional().default(""),
  source: z.string().optional().default("手動新增"),
});

export type KolFormState = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createKol(
  _prevState: KolFormState,
  formData: FormData
): Promise<KolFormState> {
  const raw = Object.fromEntries(formData.entries());
  const tagsStr = (raw.tags as string) || "";
  const parsed = KolSchema.safeParse({
    ...raw,
    tags: tagsStr
      ? tagsStr.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [],
    followersCount: raw.followersCount || null,
    engagementRate: raw.engagementRate || null,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "表單驗證失敗",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const kol = await prisma.kol.create({
      data: {
        igHandle: parsed.data.igHandle,
        name: parsed.data.name || null,
        followersCount: parsed.data.followersCount ?? null,
        engagementRate: parsed.data.engagementRate ?? null,
        category: parsed.data.category || null,
        tags: parsed.data.tags,
        contactEmail: parsed.data.contactEmail || null,
        contactLine: parsed.data.contactLine || null,
        contactPhone: parsed.data.contactPhone || null,
        status: parsed.data.status,
        notes: parsed.data.notes || null,
        source: parsed.data.source || "手動新增",
      },
    });

    await prisma.kolActivity.create({
      data: {
        kolId: kol.id,
        action: "新增 KOL",
        description: `新增 KOL: @${kol.igHandle}`,
      },
    });

    revalidatePath("/kols");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e: unknown) {
    const error = e as { code?: string };
    if (error.code === "P2002") {
      return { success: false, error: "此 IG 帳號已存在" };
    }
    return { success: false, error: "建立失敗，請稍後再試" };
  }
}

export async function updateKol(
  id: string,
  _prevState: KolFormState,
  formData: FormData
): Promise<KolFormState> {
  const raw = Object.fromEntries(formData.entries());
  const tagsStr = (raw.tags as string) || "";
  const parsed = KolSchema.safeParse({
    ...raw,
    tags: tagsStr
      ? tagsStr.split(",").map((t: string) => t.trim()).filter(Boolean)
      : [],
    followersCount: raw.followersCount || null,
    engagementRate: raw.engagementRate || null,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: "表單驗證失敗",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await prisma.kol.update({
      where: { id },
      data: {
        igHandle: parsed.data.igHandle,
        name: parsed.data.name || null,
        followersCount: parsed.data.followersCount ?? null,
        engagementRate: parsed.data.engagementRate ?? null,
        category: parsed.data.category || null,
        tags: parsed.data.tags,
        contactEmail: parsed.data.contactEmail || null,
        contactLine: parsed.data.contactLine || null,
        contactPhone: parsed.data.contactPhone || null,
        status: parsed.data.status,
        notes: parsed.data.notes || null,
        source: parsed.data.source || null,
      },
    });

    revalidatePath("/kols");
    revalidatePath(`/kols/${id}`);
    return { success: true };
  } catch (e: unknown) {
    const error = e as { code?: string };
    if (error.code === "P2002") {
      return { success: false, error: "此 IG 帳號已存在" };
    }
    return { success: false, error: "更新失敗，請稍後再試" };
  }
}

export async function deleteKol(id: string) {
  await prisma.kol.delete({ where: { id } });
  revalidatePath("/kols");
  revalidatePath("/dashboard");
}

export async function updateKolStatus(id: string, newStatus: string) {
  await prisma.kol.update({
    where: { id },
    data: { status: newStatus },
  });

  await prisma.kolActivity.create({
    data: {
      kolId: id,
      action: "狀態變更",
      description: `狀態更新為「${newStatus}」`,
    },
  });

  revalidatePath(`/kols/${id}`);
  revalidatePath("/kols");
  revalidatePath("/dashboard");
}

export async function addKolNote(kolId: string, note: string) {
  await prisma.kolActivity.create({
    data: {
      kolId,
      action: "新增備註",
      description: note,
    },
  });
  revalidatePath(`/kols/${kolId}`);
}

export async function importKolsFromCsv(
  rows: Record<string, string>[]
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      const kol = await prisma.kol.create({
        data: {
          igHandle: row.ig_handle?.trim(),
          name: row.name?.trim() || null,
          followersCount: row.followers_count
            ? parseInt(row.followers_count)
            : null,
          engagementRate: row.engagement_rate
            ? parseFloat(row.engagement_rate)
            : null,
          category: row.category?.trim() || null,
          tags: row.tags
            ? row.tags.split(";").map((t: string) => t.trim()).filter(Boolean)
            : [],
          contactEmail: row.contact_email?.trim() || null,
          contactLine: row.contact_line?.trim() || null,
          contactPhone: row.contact_phone?.trim() || null,
          notes: row.notes?.trim() || null,
          source: "CSV匯入",
        },
      });

      await prisma.kolActivity.create({
        data: {
          kolId: kol.id,
          action: "CSV 匯入",
          description: `透過 CSV 匯入 KOL: @${kol.igHandle}`,
        },
      });

      success++;
    } catch {
      failed++;
      errors.push(`@${row.ig_handle || "未知"}: 匯入失敗（可能重複）`);
    }
  }

  revalidatePath("/kols");
  revalidatePath("/dashboard");
  return { success, failed, errors };
}
