export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="card-shadow w-full max-w-3xl rounded-[32px] bg-white p-6 sm:p-10">
        <div className="mx-auto max-w-xl space-y-8">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2f6bff]">
              Hesap Oluştur
            </p>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-bold text-slate-900">
                Mavikon hesabınızı oluşturun
              </h1>
              <p className="text-sm leading-6 text-slate-500">
                Trendyol mağaza bağlantılarınızı güvenli şekilde ekleyip canlı verilerle
                çalışmaya başlayın.
              </p>
            </div>
          </div>
          <form action="/api/auth/register" method="post" className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Ad Soyad</span>
              <input
                name="name"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-[#2f6bff] focus:bg-white"
                placeholder="Eren Yılmaz"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">E-posta</span>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-[#2f6bff] focus:bg-white"
                placeholder="ornek@magaza.com"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Şifre</span>
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-[#2f6bff] focus:bg-white"
                placeholder="En az 8 karakter"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Saat Dilimi</span>
              <input
                name="timezone"
                defaultValue="Europe/Istanbul"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-[#2f6bff] focus:bg-white"
              />
            </label>
            <button
              type="submit"
              className="sm:col-span-2 rounded-2xl bg-[#2f6bff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2158d9]"
            >
              Hesap Oluştur
            </button>
          </form>
          {error ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
          ) : null}
          <p className="text-sm text-slate-500">
            Zaten hesabınız var mı?{" "}
            <a className="font-semibold text-[#2f6bff]" href="/login">
              Giriş yapın
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
