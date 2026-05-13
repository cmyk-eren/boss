import { Header } from "@/components/layout/Header";
import { SectionCard } from "@/components/common/SectionCard";
import { getPageContext, type AppSearchParams } from "@/lib/page-context";
import { getBaseUrl } from "@/lib/env";
import { requireUser } from "@/services/auth-service";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const user = await requireUser();
  const context = await getPageContext(user.id, searchParams);
  const inviteLink = `${getBaseUrl()}/register?ref=${user.id}`;

  return (
    <div className="space-y-6">
      <Header
        title="Davet Et"
        stores={context.stores}
        currentStoreId={context.activeStoreId}
        notificationCount={context.notificationCount}
      />
      <SectionCard className="max-w-3xl">
        <h3 className="font-heading text-xl font-bold text-slate-900">Paylaşılabilir davet bağlantısı</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Ekip arkadaşlarınızı veya çözüm ortaklarınızı davet etmek için bağlantıyı paylaşabilirsiniz.
        </p>
        <div className="mt-5 rounded-2xl bg-slate-50 p-4 font-mono text-sm text-slate-700">
          {inviteLink}
        </div>
      </SectionCard>
    </div>
  );
}
