import { Header } from "@/components/layout/Header";
import { CommissionRateManager } from "@/components/common/CommissionRateManager";
import { getPageContext, type AppSearchParams } from "@/lib/page-context";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { requireUser } from "@/services/auth-service";

export default async function CommissionRatesPage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const user = await requireUser();
  const context = await getPageContext(user.id, searchParams);
  const rates = context.activeStore
    ? await prisma.commissionRate.findMany({
        where: { storeId: context.activeStore.id },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <Header
        title="Komisyon Oranları"
        stores={context.stores}
        currentStoreId={context.activeStoreId}
        notificationCount={context.notificationCount}
      />
      {context.activeStore ? (
        <CommissionRateManager
          storeId={context.activeStore.id}
          initialRates={rates.map((rate) => ({
            id: rate.id,
            categoryName: rate.categoryName,
            rate: toNumber(rate.rate),
            shippingCost: toNumber(rate.shippingCost),
            serviceFee: toNumber(rate.serviceFee),
            otherCosts: toNumber(rate.otherCosts),
          }))}
        />
      ) : null}
    </div>
  );
}
