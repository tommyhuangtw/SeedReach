"use server";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { revalidatePath } from "next/cache";

// ====== Templates ======

export async function getTemplates() {
  return prisma.emailTemplate.findMany({
    orderBy: { updatedAt: "desc" },
  });
}

export async function createTemplate({
  name,
  subject,
  body,
}: {
  name: string;
  subject: string;
  body: string;
}) {
  const variables = extractVariables(subject + " " + body);
  const template = await prisma.emailTemplate.create({
    data: { name, subject, body, variables },
  });
  revalidatePath("/outreach");
  return template;
}

export async function updateTemplate(
  id: string,
  { name, subject, body }: { name: string; subject: string; body: string }
) {
  const variables = extractVariables(subject + " " + body);
  await prisma.emailTemplate.update({
    where: { id },
    data: { name, subject, body, variables },
  });
  revalidatePath("/outreach");
}

export async function deleteTemplate(id: string) {
  // Check if template has sent emails
  const count = await prisma.outreachEmail.count({
    where: { templateId: id, status: "已寄送" },
  });
  if (count > 0) {
    return { success: false, error: `此模板已有 ${count} 封已寄出的信件，無法刪除` };
  }
  await prisma.outreachEmail.deleteMany({ where: { templateId: id } });
  await prisma.emailTemplate.delete({ where: { id } });
  revalidatePath("/outreach");
  return { success: true };
}

// ====== KOLs for outreach ======

export async function getKolsForOutreach(filter?: {
  search?: string;
  status?: string;
  category?: string;
}) {
  const where: Record<string, unknown> = {
    contactEmail: { not: null },
  };

  if (filter?.search) {
    where.OR = [
      { igHandle: { contains: filter.search, mode: "insensitive" } },
      { name: { contains: filter.search, mode: "insensitive" } },
    ];
  }
  if (filter?.status && filter.status !== "全部") {
    where.status = filter.status;
  }
  if (filter?.category && filter.category !== "全部") {
    where.category = filter.category;
  }

  return prisma.kol.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      igHandle: true,
      name: true,
      avatarUrl: true,
      contactEmail: true,
      followersCount: true,
      category: true,
      status: true,
    },
  });
}

// ====== Send emails ======

export async function sendOutreachEmails({
  templateId,
  kolIds,
}: {
  templateId: string;
  kolIds: string[];
}): Promise<{ sent: number; failed: number; errors: string[] }> {
  const template = await prisma.emailTemplate.findUnique({
    where: { id: templateId },
  });
  if (!template) throw new Error("模板不存在");

  const kols = await prisma.kol.findMany({
    where: { id: { in: kolIds }, contactEmail: { not: null } },
    select: {
      id: true,
      igHandle: true,
      name: true,
      contactEmail: true,
      status: true,
    },
  });

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < kols.length; i++) {
    const kol = kols[i];
    const kolName = kol.name || kol.igHandle;
    const subject = substituteVariables(template.subject, kolName);
    const body = substituteVariables(template.body, kolName);

    const result = await sendEmail({
      to: kol.contactEmail!,
      subject,
      body,
    });

    const status = result.success ? "已寄送" : "失敗";

    // Save outreach email record
    await prisma.outreachEmail.create({
      data: {
        kolId: kol.id,
        templateId: template.id,
        toEmail: kol.contactEmail!,
        subject,
        body,
        status,
        sentAt: result.success ? new Date() : null,
        errorMessage: result.error || null,
      },
    });

    // Create activity log
    await prisma.kolActivity.create({
      data: {
        kolId: kol.id,
        action: "寄送開發信",
        description: result.success
          ? `已寄送開發信至 ${kol.contactEmail}`
          : `開發信寄送失敗: ${result.error}`,
      },
    });

    // Update KOL status to "已聯繫" if currently "潛在"
    if (result.success && kol.status === "潛在") {
      await prisma.kol.update({
        where: { id: kol.id },
        data: { status: "已聯繫" },
      });
    }

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`@${kol.igHandle}: ${result.error}`);
    }

    // 1s delay between sends (skip after last)
    if (i < kols.length - 1) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  revalidatePath("/outreach");
  revalidatePath("/kols");
  return { sent, failed, errors };
}

// ====== History ======

export async function getOutreachHistory() {
  return prisma.outreachEmail.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      kol: { select: { igHandle: true, name: true, avatarUrl: true } },
      template: { select: { name: true } },
    },
  });
}

// ====== Helpers ======

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
}

function substituteVariables(text: string, kolName: string): string {
  return text.replace(/\{\{kol_name\}\}/gi, kolName);
}
