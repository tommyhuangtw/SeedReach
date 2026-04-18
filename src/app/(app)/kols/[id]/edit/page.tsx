import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import KolForm from "@/components/kols/kol-form";

export default async function EditKolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const kol = await prisma.kol.findUnique({ where: { id } });
  if (!kol) notFound();

  return (
    <div className="max-w-3xl">
      <h2 className="mb-6 text-2xl font-bold">編輯 KOL</h2>
      <KolForm
        kolId={kol.id}
        initialData={{
          igHandle: kol.igHandle,
          name: kol.name,
          followersCount: kol.followersCount,
          engagementRate: kol.engagementRate?.toString() ?? null,
          category: kol.category,
          tags: kol.tags,
          contactEmail: kol.contactEmail,
          contactLine: kol.contactLine,
          contactPhone: kol.contactPhone,
          status: kol.status,
          notes: kol.notes,
          source: kol.source,
        }}
      />
    </div>
  );
}
