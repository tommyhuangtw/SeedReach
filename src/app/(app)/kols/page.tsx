import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import KolTable from "@/components/kols/kol-table";
import KolFilters from "@/components/kols/kol-filters";
import CsvImportDialog from "@/components/kols/csv-import-dialog";
import type { Prisma } from "@/generated/prisma/client";

const PAGE_SIZE = 20;

export default async function KolsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    category?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));

  const where: Prisma.KolWhereInput = {};

  if (params.search) {
    where.OR = [
      { igHandle: { contains: params.search, mode: "insensitive" } },
      { name: { contains: params.search, mode: "insensitive" } },
    ];
  }

  if (params.status && params.status !== "全部") {
    where.status = params.status;
  }

  if (params.category && params.category !== "全部") {
    where.category = params.category;
  }

  const [kols, total] = await Promise.all([
    prisma.kol.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        igHandle: true,
        name: true,
        avatarUrl: true,
        followersCount: true,
        engagementRate: true,
        contactEmail: true,
        contactLine: true,
        category: true,
        status: true,
      },
    }),
    prisma.kol.count({ where }),
  ]);

  const serializedKols = kols.map((k) => ({
    ...k,
    engagementRate: k.engagementRate ? k.engagementRate.toString() : null,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">KOL 管理</h2>
        <div className="flex gap-2">
          <CsvImportDialog />
          <Button render={<Link href="/kols/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            新增 KOL
          </Button>
        </div>
      </div>

      <Suspense fallback={null}>
        <KolFilters />
      </Suspense>

      <KolTable
        kols={serializedKols}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
