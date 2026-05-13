export default function LoginPage() {

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="card-shadow grid w-full max-w-5xl overflow-hidden rounded-[32px] bg-white lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden bg-[#0f2a68] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <span className="inline-flex rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">
              BOSS Panel
            </span>
            <div className="space-y-4">
              <h1 className="max-w-md font-heading text-4xl font-bold leading-tight">
                Trendyol performansinizi tek merkezden yonetin.
              </h1>
              <p className="max-w-md text-sm leading-7 text-blue-100/88">
                Siparisler, karlilik, stok, fiyat ve kategori bazli komisyon yonetimi ayni
                ekranda birlesir.
              </p>
            </div>
          </div>
          <div className="grid gap-4 text-sm text-blue-50">
            <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
              Gercek Trendyol magaza verileriyle calisacak sekilde tasarlanmistir.
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/6 p-5">
              API anahtarlari yalnizca sunucu tarafinda sifreli saklanir.
            </div>
          </div>
        </section>
        <section className="px-6 py-8 sm:px-10 sm:py-10">
          <div className="mx-auto max-w-md space-y-8">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2f6bff]">
                Giris
              </p>
              <div className="space-y-2">
                <h2 className="font-heading text-3xl font-bold text-slate-900">
                  Hesabiniza giris yapin
                </h2>
                <p className="text-sm leading-6 text-slate-500">
                  Magazalarinizin siparis, ciro ve karlilik gorunumune erisin.
                </p>
              </div>
            </div>
            <form action="/api/auth/login" method="post" className="space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">E-posta</span>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-[#2f6bff] focus:bg-white"
                  placeholder="ornek@magaza.com"
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Sifre</span>
                <input
                  name="password"
                  type="password"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition focus:border-[#2f6bff] focus:bg-white"
                  placeholder="••••••••"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-2xl bg-[#2f6bff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2158d9]"
              >
                Giris Yap
              </button>
            </form>
            <p className="text-sm text-slate-500">
              Hesabiniz yok mu?{" "}
              <a className="font-semibold text-[#2f6bff]" href="/register">
                Yeni hesap olusturun
              </a>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
