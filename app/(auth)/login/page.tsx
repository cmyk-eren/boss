export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2f6bff]">
            BOSS
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Giris yapin</h1>
          <p className="text-sm text-slate-500">Trendyol panelinize erisin.</p>
        </div>

        <form action="/api/auth/login" method="post" className="mt-8 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">E-posta</span>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="ornek@magaza.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Sifre</span>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#2f6bff] px-4 py-3 text-sm font-semibold text-white"
          >
            Giris Yap
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Hesabiniz yok mu?{" "}
          <a className="font-semibold text-[#2f6bff]" href="/register">
            Hesap olusturun
          </a>
        </p>
      </div>
    </main>
  );
}
