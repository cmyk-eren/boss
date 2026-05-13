export function TrendyolConnectForm() {
  return (
    <form
      action="/api/integrations/trendyol/connect"
      method="post"
      className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-6"
    >
      <div>
        <h3 className="font-heading text-xl font-bold text-slate-900">
          Trendyol mağazası bağla
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          supplierId, apiKey ve apiSecret bilgileri sunucu tarafında şifreli saklanır.
        </p>
        <p className="mt-2 text-xs leading-6 text-slate-400">
          storeFrontCode değerini Trendyol Seller Panel&apos;den alın. Resmi dokümanda görünen
          uluslararası storefront kodları: DE, SA, AE, GR, SK, RO, CZ, BG ve KW. Türkiye iç
          pazar mağazalarında bu alan boş bırakılabilir.
        </p>
      </div>
      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-700">Mağaza Adı</span>
        <input
          name="name"
          required
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          placeholder="Mavikon Trendyol Mağazası"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">supplierId</span>
          <input
            name="supplierId"
            required
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">storeFrontCode</span>
          <input
            name="storeFrontCode"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
            placeholder="Türkiye iç pazar için boş bırakın"
          />
        </label>
      </div>
      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-700">apiKey</span>
        <input
          name="apiKey"
          required
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
        />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-700">apiSecret</span>
        <input
          name="apiSecret"
          type="password"
          required
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
        />
      </label>
      <button
        type="submit"
        className="rounded-2xl bg-[#2f6bff] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2158d9]"
      >
        Mağazayı Bağla
      </button>
    </form>
  );
}
