import { prisma } from "@/lib/prisma";
import StatCard from "@/components/dashboard/stat-card";

export default async function DashboardPage() {
  const [totalKols, activeKols, contactedKols, collaboratingKols] =
    await Promise.all([
      prisma.kol.count(),
      prisma.kol.count({ where: { status: { not: "結案" } } }),
      prisma.kol.count({ where: { status: "已聯繫" } }),
      prisma.kol.count({ where: { status: "合作中" } }),
    ]);

  const stats = [
    { title: "KOL 總數", value: totalKols, icon: "Users" },
    { title: "進行中", value: activeKols, icon: "UserCheck" },
    { title: "已聯繫", value: contactedKols, icon: "Mail" },
    { title: "合作中", value: collaboratingKols, icon: "Handshake" },
  ];

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">總覽</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>
    </div>
  );
}
