"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./sidebar";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/kols": "KOL 管理",
  "/discover": "KOL 發掘",
  "/outreach": "開發信",
  "/settings": "設定",
};

function getPageTitle(pathname: string): string {
  if (pathname.match(/^\/kols\/[^/]+\/edit$/)) return "編輯 KOL";
  if (pathname.match(/^\/kols\/[^/]+$/)) return "KOL 詳情";
  if (pathname === "/kols/new") return "新增 KOL";
  return pageTitles[pathname] || "SeedReach";
}

export default function Topbar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
      <Sheet>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="lg:hidden" />}>
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>
      <h1 className="text-lg font-semibold">{title}</h1>
    </header>
  );
}
