import Link from "next/link";

import { DateRangeTabs } from "@/components/dashboard/DateRangeTabs";
import { EmptyState } from "@/components/common/EmptyState";
import { Header } from "@/components/layout/Header";
import { SectionCard } from "@/components/common/SectionCard";
import { getPageContext, type AppSearchParams } from "@/lib/page-context";
import { formatCurrency, formatNumber, formatPercent, toNumber } from "@/lib/utils";
import { requireUser } from "@/services/auth-service";
import { getAnalyticsData } from "@/services/dashboard-service";

export default async function AnalyticsPage({
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
          title="Analitik"
          stores={context.stores}
          currentStoreId={context.activeStoreId}
          notificationCount={context.notificationCount}
        />
        <EmptyState
          title="Analitik görünümü için mağaza bağlantısı gerekli"
          description="Kategori bazlı kârlılık ve stok risklerini hesaplayabilmek için mağaza senkronizasyonu gereklidir."
          action={
            <Link
              href="/integrations/trendyol"
              className="rounded-2xl bg-[#2f6bff] px-4 py-3 text-sm font-semibold text-white"
            >
              Entegrasyona Git
            </Link>
          }
        />
      </div>
    );
  }

  const analytics = await getAnalyticsData(context.activeStore.id, context.range);

  return (
    <div className="space-y-6">
      <Header
        title="Analitik"
        stores={context.stores}
        currentStoreId={context.activeStoreId}
        notificationCount={context.notificationCount}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateRangeTabs current={context.range} />
        <p className="text-sm text-slate-500">
          Kâr marjı:{" "}
          <span className="font-semibold text-slate-900">
            {formatPercent(analytics.summary.profitMargin)}
          </span>
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard>
          <p className="text-sm text-slate-500">Toplam Ciro</p>
          <p className="mt-3 font-heading text-3xl font-bold text-slate-900">
            {formatCurrency(analytics.metrics.revenue)}
          </p>
        </SectionCard>
        <SectionCard>
          <p className="text-sm text-slate-500">Düşük Stoklu Ürün</p>
          <p className="mt-3 font-heading text-3xl font-bold text-slate-900">
            {formatNumber(analytics.summary.lowStockCount)}
          </p>
        </SectionCard>
        <SectionCard>
          <p className="text-sm text-slate-500">Fiyat Riski</p>
          <p className="mt-3 font-heading text-3xl font-bold text-slate-900">
            {formatNumber(analytics.summary.priceRiskCount)}
          </p>
        </SectionCard>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard>
          <h3 className="font-heading text-xl font-bold text-slate-900">Kategori bazlı kârlılık</h3>
          <div className="mt-5 space-y-4">
            {analytics.categories.slice(0, 8).map((category) => (
              <div key={category.categoryName} className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{category.categoryName}</p>
                  <p className="text-sm text-slate-500">{category.quantity} adet satış</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(category.revenue)}
                  </p>
                  <p className="text-sm text-emerald-600">
                    {formatCurrency(category.estimatedProfit)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard>
          <h3 className="font-heading text-xl font-bold text-slate-900">Stok ve fiyat uyarıları</h3>
          <div className="mt-5 grid gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Düşük stok</p>
              <div className="mt-3 space-y-3">
                {analytics.lowStock.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{product.title}</span>
                    <span className="font-semibold text-amber-600">{product.quantity} adet</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Marj riski</p>
              <div className="mt-3 space-y-3">
                {analytics.priceRisk.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{product.title}</span>
                    <span className="font-semibold text-rose-600">
                      {formatCurrency(toNumber(product.salePrice))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
