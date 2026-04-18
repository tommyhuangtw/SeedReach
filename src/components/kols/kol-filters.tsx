"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statuses = ["全部", "潛在", "已聯繫", "洽談中", "合作中", "結案"];
const categories = [
  "全部",
  "美妝",
  "母嬰",
  "健康",
  "時尚",
  "美食",
  "生活",
  "科技",
  "其他",
];

export default function KolFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "全部") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`/kols?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        placeholder="搜尋 IG 帳號或名稱..."
        defaultValue={searchParams.get("search") || ""}
        onChange={(e) => {
          const value = e.target.value;
          // debounce
          const timer = setTimeout(() => updateParam("search", value), 300);
          return () => clearTimeout(timer);
        }}
        className="w-64"
      />
      <Select
        defaultValue={searchParams.get("status") || "全部"}
        onValueChange={(v) => updateParam("status", v ?? "")}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="狀態" />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        defaultValue={searchParams.get("category") || "全部"}
        onValueChange={(v) => updateParam("category", v ?? "")}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="分類" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
