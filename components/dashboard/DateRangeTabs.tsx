"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { RANGE_OPTIONS, type DashboardRange } from "@/lib/date-range";
import { cn } from "@/lib/utils";

type DateRangeTabsProps = {
  current: DashboardRange;
};

export function DateRangeTabs({ current }: DateRangeTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="inline-flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-sm">
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("range", option.value);
            router.push(`${pathname}?${params.toString()}`);
          }}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-medium transition",
            current === option.value
              ? "bg-[#2f6bff] text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
