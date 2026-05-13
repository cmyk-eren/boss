import { PriceCalculator } from "@/components/common/PriceCalculator";
import { Header } from "@/components/layout/Header";
import { getPageContext, type AppSearchParams } from "@/lib/page-context";
import { requireUser } from "@/services/auth-service";

export default async function PriceCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const user = await requireUser();
  const context = await getPageContext(user.id, searchParams);

  return (
    <div className="space-y-6">
      <Header
        title="Fiyat Hesaplayıcı"
        stores={context.stores}
        currentStoreId={context.activeStoreId}
        notificationCount={context.notificationCount}
      />
      <PriceCalculator />
    </div>
  );
}
