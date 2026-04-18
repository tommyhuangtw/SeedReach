import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  潛在: { variant: "secondary", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
  已聯繫: { variant: "secondary", className: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  洽談中: { variant: "secondary", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  合作中: { variant: "secondary", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  結案: { variant: "secondary", className: "bg-slate-100 text-slate-500 hover:bg-slate-100" },
};

export default function KolStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig["潛在"];
  return (
    <Badge variant={config.variant} className={config.className}>
      {status}
    </Badge>
  );
}
