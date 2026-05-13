import Link from "next/link";

import { EmptyState } from "@/components/common/EmptyState";
import { SectionCard } from "@/components/common/SectionCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Header } from "@/components/layout/Header";
import { getPageContext, type AppSearchParams } from "@/lib/page-context";
import { requireUser } from "@/services/auth-service";

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const user = await requireUser();
  const context = await getPageContext(user.id, searchParams);

  return (
    <div className="space-y-6">
      <Header
        title="Mağazalar"
        stores={context.stores}
        currentStoreId={context.activeStoreId}
        notificationCount={context.notificationCount}
      />
      {context.stores.length === 0 ? (
        <EmptyState
          title="Bağlı mağaza bulunamadı"
          description="Trendyol entegrasyonunu eklediğinizde burada mağaza kartlarını ve bağlantı durumlarını göreceksiniz."
          action={
            <Link
              href="/integrations/trendyol"
              className="rounded-2xl bg-[#2f6bff] px-4 py-3 text-sm font-semibold text-white"
            >
              Mağaza Bağla
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {context.stores.map((store) => (
            <SectionCard key={store.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-heading text-xl font-bold text-slate-900">{store.name}</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    supplierId: {store.supplierId} / storeFrontCode: {store.storeFrontCode}
                  </p>
                </div>
                <StatusBadge
                  label={store.integrationStatus}
                  tone={
                    store.integrationStatus === "CONNECTED"
                      ? "green"
                      : store.integrationStatus === "ERROR"
                        ? "red"
                        : "amber"
                  }
                />
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-slate-400">Ürün Sayısı</p>
                  <p className="mt-2 font-semibold text-slate-900">{store.productCount}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-slate-400">Sipariş Sayısı</p>
                  <p className="mt-2 font-semibold text-slate-900">{store.orderCount}</p>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
