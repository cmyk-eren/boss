import { Header } from "@/components/layout/Header";
import { SectionCard } from "@/components/common/SectionCard";
import { getPageContext, type AppSearchParams } from "@/lib/page-context";
import { requireUser } from "@/services/auth-service";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const user = await requireUser();
  const context = await getPageContext(user.id, searchParams);

  return (
    <div className="space-y-6">
      <Header
        title="Profil"
        stores={context.stores}
        currentStoreId={context.activeStoreId}
        notificationCount={context.notificationCount}
      />
      <SectionCard className="max-w-2xl">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-500">Ad Soyad</p>
            <p className="font-semibold text-slate-900">{user.name || "Belirtilmedi"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">E-posta</p>
            <p className="font-semibold text-slate-900">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Plan</p>
            <p className="font-semibold text-slate-900">{user.plan}</p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
            >
              Oturumu Kapat
            </button>
          </form>
        </div>
      </SectionCard>
    </div>
  );
}
