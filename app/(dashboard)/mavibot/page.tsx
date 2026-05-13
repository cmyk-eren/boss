import { Header } from "@/components/layout/Header";
import { SectionCard } from "@/components/common/SectionCard";
import { getPageContext, type AppSearchParams } from "@/lib/page-context";
import { formatCurrency } from "@/lib/utils";
import { requireUser } from "@/services/auth-service";
import { getAnalyticsData } from "@/services/dashboard-service";

export default async function MavibotPage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const user = await requireUser();
  const context = await getPageContext(user.id, searchParams);
  const analytics = context.activeStore
    ? await getAnalyticsData(context.activeStore.id, context.range)
    : null;

  const suggestions = analytics
    ? [
        `Kâr marjınız ${analytics.summary.profitMargin.toFixed(1)}%. En yüksek cirolu kategorilere odaklı fiyat revizyonu planlayın.`,
        analytics.lowStock[0]
          ? `${analytics.lowStock[0].title} ürünü kritik stok seviyesinde. Yeniden tedarik aksiyonu alın.`
          : "Düşük stoklu ürün görünmüyor; mevcut stok seviyesi sağlıklı.",
        analytics.priceRisk[0]
          ? `${analytics.priceRisk[0].title} ürününde satış fiyatı maliyete çok yakın. Marjı yeniden gözden geçirin.`
          : "Marj riski taşıyan ürün görünmüyor.",
      ]
    : [];

  return (
    <div className="space-y-6">
      <Header
        title="BOSS Bot"
        stores={context.stores}
        currentStoreId={context.activeStoreId}
        notificationCount={context.notificationCount}
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard>
          <h3 className="font-heading text-xl font-bold text-slate-900">Akıllı operasyon önerileri</h3>
          <div className="mt-5 space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                {suggestion}
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard>
          <h3 className="font-heading text-xl font-bold text-slate-900">Öne çıkan fırsat</h3>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {analytics?.topProducts[0]
              ? `${analytics.topProducts[0].title} ürünü ${formatCurrency(
                  analytics.topProducts[0].revenue,
                )} ciro ile öne çıkıyor. Bu ürün için reklam ve stok planını güçlendirin.`
              : "Analiz oluşturmak için sipariş verisinin senkronize edilmesi gerekiyor."}
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
