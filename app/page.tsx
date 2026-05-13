import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="card-shadow w-full max-w-3xl rounded-[32px] bg-white p-8 sm:p-12">
        <div className="space-y-5 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2f6bff]">
            BOSS
          </p>
          <div className="space-y-3">
            <h1 className="font-heading text-4xl font-bold text-slate-900">
              Trendyol operasyon merkezinize hos geldiniz
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-500">
              Siparis, ciro, karlilik, urun performansi ve Trendyol entegrasyonlarinizi
              tek panelde yonetin.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-3 pt-3 sm:flex-row">
            <Link
              href="/login"
              className="rounded-2xl bg-[#2f6bff] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2158d9]"
            >
              Giris Yap
            </Link>
            <Link
              href="/register"
              className="rounded-2xl border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Hesap Olustur
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
