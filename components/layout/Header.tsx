import { Bell, Sparkles } from "lucide-react";

import { StoreSwitcher } from "@/components/common/StoreSwitcher";
import { SyncButton } from "@/components/common/SyncButton";

type HeaderProps = {
  title: string;
  stores: Array<{ id: string; name: string }>;
  currentStoreId?: string;
  notificationCount: number;
};

export function Header({
  title,
  stores,
  currentStoreId,
  notificationCount,
}: HeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/85 px-5 py-5 shadow-sm backdrop-blur sm:px-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf1ff] px-3 py-1 text-xs font-semibold text-[#2f6bff]">
          <Sparkles className="h-3.5 w-3.5" />
          Canlı SaaS Operasyon Paneli
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">
            Sipariş, ciro, kâr ve stok görünümünüz burada birleşir.
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <StoreSwitcher stores={stores} currentStoreId={currentStoreId} />
        <button
          type="button"
          className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 ? (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#2f6bff]" />
          ) : null}
        </button>
        <SyncButton storeId={currentStoreId} />
      </div>
    </header>
  );
}
