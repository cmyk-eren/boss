import { Header } from "@/components/layout/Header";
import { SectionCard } from "@/components/common/SectionCard";
import { getPageContext, type AppSearchParams } from "@/lib/page-context";
import { requireUser } from "@/services/auth-service";

const plans = [
  { name: "STARTER", price: "₺0", detail: "Tek mağaza, temel senkronizasyon ve kârlılık görünümü" },
  { name: "GROWTH", price: "₺1.490", detail: "Çoklu mağaza, komisyon yönetimi ve gelişmiş analitik" },
  { name: "SCALE", price: "₺3.990", detail: "Arka plan senkronizasyonu ve operasyon otomasyonları" },
];

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const user = await requireUser();
  const context = await getPageContext(user.id, searchParams);

  return (
    <div className="space-y-6">
      <Header
        title="Abonelik"
        stores={context.stores}
        currentStoreId={context.activeStoreId}
        notificationCount={context.notificationCount}
      />
      <div className="grid gap-4 xl:grid-cols-3">
        {plans.map((plan) => (
          <SectionCard key={plan.name} className={plan.name === user.plan ? "border-[#2f6bff]" : ""}>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              {plan.name}
            </p>
            <p className="mt-4 font-heading text-4xl font-bold text-slate-900">{plan.price}</p>
            <p className="mt-3 text-sm leading-6 text-slate-500">{plan.detail}</p>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
