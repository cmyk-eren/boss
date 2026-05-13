"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

type StoreSwitcherProps = {
  stores: Array<{ id: string; name: string }>;
  currentStoreId?: string;
};

export function StoreSwitcher({ stores, currentStoreId }: StoreSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("storeId", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  if (stores.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
        Mağaza bağlantısı yok
      </div>
    );
  }

  return (
    <div className="relative min-w-[220px]">
      <select
        value={currentStoreId ?? stores[0]?.id}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 shadow-sm"
      >
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}
