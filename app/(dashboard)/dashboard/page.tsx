import Link from "next/link";

import { EmptyState } from "@/components/common/EmptyState";
import { Header } from "@/components/layout/Header";
import { DateRangeTabs } from "@/components/dashboard/DateRangeTabs";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SalesTrendChart } from "@/components/dashboard/SalesTrendChart";
import { TopProducts } from "@/components/dashboard/TopProducts";
import { getPageContext, type AppSearchParams } from "@/lib/page-context";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { getDashboardData } from "@/services/dashboard-service";
import { requireUser } from "@/services/auth-service";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const user = await requireUser();
  const context = await getPageContext(user.id, searchParams);

  if (!context.activeStore) {
    return (
      <div className="space-y-6">
        <Header
          title="Dashboard"
          stores={context.stores}
          currentStoreId={context.activeStoreId}
          notificationCount={context.notificationCount}
        />
        <EmptyState
          title="Henüz Trendyol mağazası bağlı değil"
          description="Gerçek sipariş, ürün ve kârlılık metriklerini görebilmek için önce mağaza bağlantınızı ekleyin."
          action={
            <Link
              href="/integrations/trendyol"
              className="rounded-2xl bg-[#2f6bff] px-4 py-3 text-sm font-semibold text-white"
            >
              Trendyol Bağlantısını Aç
            </Link>
          }
        />
      </div>
    );
  }

  const dashboard = await getDashboardData(context.activeStore.id, context.range);

  return (
    <div className="space-y-6">
      <Header
        title="Dashboard"
        stores={context.stores}
        currentStoreId={context.activeStoreId}
        notificationCount={context.notificationCount}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeTabs current={context.range} />
        <p className="text-sm text-slate-500">
          Aktif mağaza: <span className="font-semibold text-slate-900">{context.activeStore.name}</span>
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        <MetricCard
          label="Siparişler"
          value={formatNumber(dashboard.metrics.orders)}
          detail={`${dashboard.range.label} aralığındaki toplam paket sayısı`}
        />
        <MetricCard
          label="Toplam Ciro"
          value={formatCurrency(dashboard.metrics.revenue)}
          detail="Siparişlerden elde edilen brüt satış toplamı"
        />
        <MetricCard
          label="Tahmini Kâr"
          value={formatCurrency(dashboard.metrics.estimatedProfit)}
          detail="Maliyet, komisyon ve operasyon giderleri düşüldü"
        />
        <MetricCard
          label="Ortalama Sepet"
          value={formatCurrency(dashboard.metrics.averageBasket)}
          detail="Sipariş başına ortalama ciro"
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <SalesTrendChart data={dashboard.chart} />
        <TopProducts products={dashboard.topProducts} />
      </div>
    </div>
  );
}
