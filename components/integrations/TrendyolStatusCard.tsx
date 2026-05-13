import { RefreshCw, ShieldCheck, Store } from "lucide-react";

import { StatusBadge } from "@/components/common/StatusBadge";
import { SyncButton } from "@/components/common/SyncButton";

type TrendyolStatusCardProps = {
  store?: {
    id: string;
    name: string;
    supplierId: string;
    storeFrontCode: string;
    integrationStatus: string;
    environment: string;
    lastSyncAt?: Date | null;
    lastError?: string | null;
  };
};

export function TrendyolStatusCard({ store }: TrendyolStatusCardProps) {
  if (!store) {
    return null;
  }

  const tone =
    store.integrationStatus === "CONNECTED"
      ? "green"
      : store.integrationStatus === "ERROR"
        ? "red"
        : "amber";

  return (
    <div className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-6 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[#eaf1ff] p-3 text-[#2f6bff]">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Mağaza</p>
            <p className="font-semibold text-slate-900">{store.name}</p>
            <p className="text-xs text-slate-400">supplierId: {store.supplierId}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Bağlantı Durumu</p>
            <div className="mt-1">
              <StatusBadge label={store.integrationStatus} tone={tone} />
            </div>
            <p className="mt-2 text-xs text-slate-400">{store.environment} / {store.storeFrontCode}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Son Senkronizasyon</p>
            <p className="font-semibold text-slate-900">
              {store.lastSyncAt ? store.lastSyncAt.toLocaleString("tr-TR") : "Henüz çalışmadı"}
            </p>
            {store.lastError ? (
              <p className="mt-1 text-xs text-rose-600">{store.lastError}</p>
            ) : null}
          </div>
        </div>
      </div>
      <SyncButton storeId={store.id} />
    </div>
  );
}
