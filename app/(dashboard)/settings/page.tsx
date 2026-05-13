import { Header } from "@/components/layout/Header";
import { SectionCard } from "@/components/common/SectionCard";
import { getPageContext, type AppSearchParams } from "@/lib/page-context";
import { requireUser } from "@/services/auth-service";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const user = await requireUser();
  const context = await getPageContext(user.id, searchParams);

  return (
    <div className="space-y-6">
      <Header
        title="Ayarlar"
        stores={context.stores}
        currentStoreId={context.activeStoreId}
        notificationCount={context.notificationCount}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard>
          <h3 className="font-heading text-xl font-bold text-slate-900">Güvenlik</h3>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            API anahtarları frontend tarafına dönmez ve AES-GCM ile şifreli olarak saklanır.
          </p>
        </SectionCard>
        <SectionCard>
          <h3 className="font-heading text-xl font-bold text-slate-900">Senkronizasyon</h3>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Manuel tetikleme üst bar üzerinden yapılır. Arka plan senkronizasyonu cron endpoint’i ile tetiklenir.
          </p>
        </SectionCard>
      </div>
      <SectionCard className="max-w-2xl">
        <p className="text-sm text-slate-500">Saat dilimi</p>
        <p className="mt-2 font-semibold text-slate-900">{user.timezone}</p>
      </SectionCard>
    </div>
  );
}
