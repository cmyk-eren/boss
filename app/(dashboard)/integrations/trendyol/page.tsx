import { Header } from "@/components/layout/Header";
import { TrendyolConnectForm } from "@/components/integrations/TrendyolConnectForm";
import { TrendyolStatusCard } from "@/components/integrations/TrendyolStatusCard";
import { getPageContext, type AppSearchParams } from "@/lib/page-context";
import { requireUser } from "@/services/auth-service";

export default async function TrendyolIntegrationPage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const user = await requireUser();
  const context = await getPageContext(user.id, searchParams);
  const params = context.searchParams as AppSearchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <div className="space-y-6">
      <Header
        title="Trendyol Entegrasyonu"
        stores={context.stores}
        currentStoreId={context.activeStoreId}
        notificationCount={context.notificationCount}
      />
      {error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <TrendyolStatusCard store={context.activeStore} />
      <TrendyolConnectForm />
    </div>
  );
}
