export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2f6bff]">
            BOSS
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Hesap olusturun</h1>
          <p className="text-sm text-slate-500">
            Trendyol magazanizi baglayip panele erisin.
          </p>
        </div>

        <form action="/api/auth/register" method="post" className="mt-8 space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Ad Soyad</span>
            <input
              name="name"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="Eren Yilmaz"
            />
          </label>

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
              minLength={8}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
              placeholder="En az 8 karakter"
            />
          </label>

          <input name="timezone" type="hidden" value="Europe/Istanbul" />

          <button
            type="submit"
            className="w-full rounded-2xl bg-[#2f6bff] px-4 py-3 text-sm font-semibold text-white"
          >
            Hesap Olustur
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-500">
          Zaten hesabinız var mi?{" "}
          <a className="font-semibold text-[#2f6bff]" href="/login">
            Giris yapin
          </a>
        </p>
      </div>
    </main>
  );
}
