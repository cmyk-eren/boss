"use client";

import { ChevronDown, ChevronUp, ExternalLink, RefreshCw, Send, UploadCloud } from "lucide-react";
import { Fragment, useState } from "react";

import { formatCurrency, formatNumber } from "@/lib/utils";

type FeedRecord = {
  id: string;
  name: string;
  sourceUrl: string;
  defaultCargoCompanyId: number | null;
  defaultShipmentAddressId: number | null;
  defaultReturningAddressId: number | null;
  defaultDeliveryDuration: number | null;
  status: string;
  lastSyncAt: string | Date | null;
  lastSuccessfulSyncAt: string | Date | null;
  lastError: string | null;
};

type SupplierProduct = {
  id: string;
  title: string;
  barcode: string;
  productCode: string | null;
  brandName: string | null;
  categoryPath: string | null;
  salePrice: number;
  listPrice: number;
  quantity: number;
  variantName1: string | null;
  variantValue1: string | null;
  variantName2: string | null;
  variantValue2: string | null;
  imageUrlsJson: unknown;
  selectedForExport: boolean;
  exportStatus: string;
  exportMessage: string | null;
  trendyolCategoryId: number | null;
  trendyolCategoryName: string | null;
  trendyolBrandId: number | null;
  productMainId: string | null;
  stockCode: string | null;
  dimensionalWeight: number;
  originCode: string;
  attributesJson: unknown;
};

type SupplierFeedResult = {
  feed: FeedRecord | null;
  items: SupplierProduct[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  stats: {
    total: number;
    selected: number;
    ready: number;
    synced: number;
    failed: number;
  };
};

type SupplierFeedManagerProps = {
  storeId: string;
  initialData: SupplierFeedResult;
  initialSourceUrl?: string;
  cargoCompanies: Array<{ id: number; code: string; name: string }>;
};

type RowDraft = {
  trendyolCategoryId: string;
  trendyolBrandId: string;
  productMainId: string;
  stockCode: string;
  dimensionalWeight: string;
  originCode: string;
  attributesJson: string;
};

function badgeClass(status: string) {
  switch (status) {
    case "SYNCED":
      return "bg-emerald-50 text-emerald-600";
    case "READY":
      return "bg-blue-50 text-blue-600";
    case "QUEUED":
      return "bg-amber-50 text-amber-600";
    case "FAILED":
      return "bg-rose-50 text-rose-600";
    default:
      return "bg-slate-100 text-slate-500";
  }
}

function buildDraft(product: SupplierProduct): RowDraft {
  return {
    trendyolCategoryId: product.trendyolCategoryId?.toString() ?? "",
    trendyolBrandId: product.trendyolBrandId?.toString() ?? "",
    productMainId: product.productMainId ?? product.productCode ?? product.barcode,
    stockCode: product.stockCode ?? product.productCode ?? product.barcode,
    dimensionalWeight: product.dimensionalWeight?.toString() ?? "1",
    originCode: product.originCode || "TR",
    attributesJson: JSON.stringify(product.attributesJson ?? [], null, 2),
  };
}

function firstImage(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const first = value.find((item) => typeof item === "string");
  return typeof first === "string" ? first : null;
}

export function SupplierFeedManager({
  storeId,
  initialData,
  initialSourceUrl,
  cargoCompanies,
}: SupplierFeedManagerProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, RowDraft>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [form, setForm] = useState({
    name: initialData.feed?.name ?? "Royal Tedarik XML",
    sourceUrl: initialData.feed?.sourceUrl ?? initialSourceUrl ?? "",
    defaultCargoCompanyId: initialData.feed?.defaultCargoCompanyId?.toString() ?? "17",
    defaultShipmentAddressId: initialData.feed?.defaultShipmentAddressId?.toString() ?? "",
    defaultReturningAddressId: initialData.feed?.defaultReturningAddressId?.toString() ?? "",
    defaultDeliveryDuration: initialData.feed?.defaultDeliveryDuration?.toString() ?? "",
  });

  async function loadProducts(page = 1, query = search) {
    try {
      setLoadingList(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(data.pageSize || 24),
      });

      if (query.trim()) {
        params.set("query", query.trim());
      }

      const response = await fetch(`/api/stores/${storeId}/supplier-feed/products?${params}`);
      const payload = (await response.json()) as SupplierFeedResult & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Tedarikçi ürünleri yüklenemedi.");
      }

      setData(payload);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Liste yüklenemedi.");
    } finally {
      setLoadingList(false);
    }
  }

  async function syncFeed() {
    try {
      setPending(true);
      setMessage(null);
      setError(null);

      const response = await fetch(`/api/stores/${storeId}/supplier-feed/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          sourceUrl: form.sourceUrl,
          defaultCargoCompanyId: form.defaultCargoCompanyId
            ? Number(form.defaultCargoCompanyId)
            : null,
          defaultShipmentAddressId: form.defaultShipmentAddressId
            ? Number(form.defaultShipmentAddressId)
            : null,
          defaultReturningAddressId: form.defaultReturningAddressId
            ? Number(form.defaultReturningAddressId)
            : null,
          defaultDeliveryDuration: form.defaultDeliveryDuration
            ? Number(form.defaultDeliveryDuration)
            : null,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "XML içe aktarma başarısız.");
      }

      setMessage(`${payload.importedCount} ürün XML feed’den hazırlandı.`);
      await loadProducts(1, search);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "XML aktarımı başarısız.");
    } finally {
      setPending(false);
    }
  }

  async function updateProduct(
    productId: string,
    payload: Record<string, unknown>,
    successMessage?: string,
  ) {
    const response = await fetch(`/api/stores/${storeId}/supplier-feed/products/${productId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error ?? "Ürün güncellenemedi.");
    }

    if (successMessage) {
      setMessage(successMessage);
    }

    await loadProducts(data.page, search);
  }

  async function saveRow(product: SupplierProduct) {
    const draft = drafts[product.id] ?? buildDraft(product);
    let attributesJson: unknown = [];

    try {
      attributesJson = draft.attributesJson.trim() ? JSON.parse(draft.attributesJson) : [];
    } catch {
      throw new Error("Attributes alanı geçerli JSON array olmalıdır.");
    }

    await updateProduct(
      product.id,
      {
        trendyolCategoryId: draft.trendyolCategoryId ? Number(draft.trendyolCategoryId) : null,
        trendyolBrandId: draft.trendyolBrandId ? Number(draft.trendyolBrandId) : null,
        productMainId: draft.productMainId,
        stockCode: draft.stockCode,
        dimensionalWeight: Number(draft.dimensionalWeight || "1"),
        originCode: draft.originCode || "TR",
        attributesJson,
      },
      "Ürün eşleme ayarları kaydedildi.",
    );
  }

  async function pushProducts(productIds?: string[]) {
    try {
      setPending(true);
      setMessage(null);
      setError(null);

      const response = await fetch(`/api/stores/${storeId}/supplier-feed/products/push`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          productIds?.length
            ? { productIds }
            : {
                selectedOnly: true,
              },
        ),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Trendyol aktarımı başarısız.");
      }

      setMessage(
        payload.batchRequestId
          ? `${payload.queued} ürün batch kuyruğuna gönderildi. Batch: ${payload.batchRequestId}`
          : `${payload.queued} ürün gönderildi.`,
      );
      await loadProducts(data.page, search);
    } catch (pushError) {
      setError(pushError instanceof Error ? pushError.message : "Aktarım başarısız.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="font-heading text-xl font-bold text-slate-900">
              XML tedarikçi entegrasyonu
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              XML feed’den ürünleri panele alın, seçin ve Trendyol’a kontrollü aktarın.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadProducts(data.page, search)}
              disabled={loadingList}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
            >
              <RefreshCw className="h-4 w-4" />
              Listeyi Yenile
            </button>
            <button
              type="button"
              onClick={() => pushProducts()}
              disabled={pending || !data.stats.selected}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Seçilileri Trendyol’a Aktar
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">Feed adı</span>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700"
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">XML linki</span>
              <input
                value={form.sourceUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sourceUrl: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700"
                placeholder="https://www.royaltedarik.com/export/..."
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Varsayılan kargo firması</span>
              <select
                value={form.defaultCargoCompanyId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultCargoCompanyId: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700"
              >
                {cargoCompanies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.id})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Teslim süresi</span>
              <input
                value={form.defaultDeliveryDuration}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultDeliveryDuration: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700"
                placeholder="Örn. 2"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Sevkiyat adres ID</span>
              <input
                value={form.defaultShipmentAddressId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultShipmentAddressId: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700"
                placeholder="Opsiyonel"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">İade adres ID</span>
              <input
                value={form.defaultReturningAddressId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    defaultReturningAddressId: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700"
                placeholder="Opsiyonel"
              />
            </label>
          </div>

          <div className="rounded-[24px] border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Feed Durumu
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(
                      data.feed?.status ?? "DRAFT",
                    )}`}
                  >
                    {data.feed?.status ?? "Bağlı değil"}
                  </span>
                  {data.feed?.sourceUrl ? (
                    <a
                      href={data.feed.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2f6bff]"
                    >
                      XML’i aç
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>
              </div>
              <button
                type="button"
                onClick={syncFeed}
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#2f6bff] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                <UploadCloud className="h-4 w-4" />
                XML’i İçe Al
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white px-4 py-3">
                <div className="text-xs text-slate-400">Toplam ürün</div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {formatNumber(data.stats.total)}
                </div>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <div className="text-xs text-slate-400">Seçili ürün</div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {formatNumber(data.stats.selected)}
                </div>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <div className="text-xs text-slate-400">Hazır</div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {formatNumber(data.stats.ready)}
                </div>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3">
                <div className="text-xs text-slate-400">Aktarıldı</div>
                <div className="mt-1 text-lg font-bold text-slate-900">
                  {formatNumber(data.stats.synced)}
                </div>
              </div>
            </div>

            {data.feed?.lastError ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {data.feed.lastError}
              </div>
            ) : null}
            {message ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}
            {error ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-heading text-xl font-bold text-slate-900">
              XML’den gelen ürünler
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              İstediğiniz ürünleri seçip Trendyol kategori ve marka eşlemesini doğrulayın.
            </p>
          </div>
          <div className="flex w-full gap-2 lg:w-[380px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  loadProducts(1, search);
                }
              }}
              className="h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700"
              placeholder="Ürün, barkod veya kategori ara"
            />
            <button
              type="button"
              onClick={() => loadProducts(1, search)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
            >
              Ara
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              <tr>
                <th className="px-5 py-4">Seç</th>
                <th className="px-5 py-4">Ürün</th>
                <th className="px-5 py-4">Kategori / Marka</th>
                <th className="px-5 py-4">Fiyat / Stok</th>
                <th className="px-5 py-4">Trendyol Eşleme</th>
                <th className="px-5 py-4">Durum</th>
                <th className="px-5 py-4">Aksiyon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-slate-500">
                    {loadingList
                      ? "Tedarikçi ürünleri yükleniyor..."
                      : "Henüz XML ürünleri içeri alınmadı."}
                  </td>
                </tr>
              ) : null}
              {data.items.map((product) => {
                const image = firstImage(product.imageUrlsJson);
                const draft = drafts[product.id] ?? buildDraft(product);
                const expanded = expandedId === product.id;

                return (
                  <Fragment key={product.id}>
                    <tr key={product.id}>
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={product.selectedForExport}
                          onChange={async (event) => {
                            try {
                              setError(null);
                              await updateProduct(product.id, {
                                selectedForExport: event.target.checked,
                              });
                            } catch (updateError) {
                              setError(
                                updateError instanceof Error
                                  ? updateError.message
                                  : "Seçim güncellenemedi.",
                              );
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-[#2f6bff]"
                        />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="h-14 w-14 overflow-hidden rounded-2xl bg-slate-100">
                            {image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={image}
                                alt={product.title}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900">{product.title}</div>
                            <div className="text-xs text-slate-400">Barkod: {product.barcode}</div>
                            {product.productCode ? (
                              <div className="text-xs text-slate-400">
                                Stok Kodu: {product.productCode}
                              </div>
                            ) : null}
                            {(product.variantValue1 || product.variantValue2) && (
                              <div className="text-xs font-medium text-slate-500">
                                {[
                                  product.variantName1 && product.variantValue1
                                    ? `${product.variantName1}: ${product.variantValue1}`
                                    : null,
                                  product.variantName2 && product.variantValue2
                                    ? `${product.variantName2}: ${product.variantValue2}`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(" / ")}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-700">
                          {product.categoryPath || "Kategori yok"}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {product.brandName || "Marka yok"}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {formatCurrency(product.salePrice)}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Liste: {formatCurrency(product.listPrice)}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">Stok: {product.quantity}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1 text-xs">
                          <div className="font-medium text-slate-700">
                            Kategori ID: {product.trendyolCategoryId ?? "eşleşmedi"}
                          </div>
                          <div className="text-slate-400">
                            Marka ID: {product.trendyolBrandId ?? "eşleşmedi"}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(
                            product.exportStatus,
                          )}`}
                        >
                          {product.exportStatus}
                        </span>
                        {product.exportMessage ? (
                          <div className="mt-2 max-w-[260px] text-xs text-slate-400">
                            {product.exportMessage}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId((current) =>
                                current === product.id ? null : product.id,
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                          >
                            {expanded ? (
                              <>
                                <ChevronUp className="h-4 w-4" />
                                Kapat
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4" />
                                Düzenle
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                setPending(true);
                                setError(null);
                                await saveRow(product);
                                await pushProducts([product.id]);
                              } catch (saveError) {
                                setError(
                                  saveError instanceof Error
                                    ? saveError.message
                                    : "Ürün aktarımı başarısız.",
                                );
                              } finally {
                                setPending(false);
                              }
                            }}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#2f6bff] px-3 py-2 text-xs font-semibold text-white"
                          >
                            <Send className="h-4 w-4" />
                            Tekli Aktar
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="bg-slate-50/70">
                        <td colSpan={7} className="px-5 py-5">
                          <div className="grid gap-4 lg:grid-cols-2">
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-slate-700">
                                Trendyol kategori ID
                              </span>
                              <input
                                value={draft.trendyolCategoryId}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [product.id]: {
                                      ...draft,
                                      trendyolCategoryId: event.target.value,
                                    },
                                  }))
                                }
                                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700"
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-slate-700">
                                Trendyol marka ID
                              </span>
                              <input
                                value={draft.trendyolBrandId}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [product.id]: {
                                      ...draft,
                                      trendyolBrandId: event.target.value,
                                    },
                                  }))
                                }
                                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700"
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-slate-700">
                                Product Main ID
                              </span>
                              <input
                                value={draft.productMainId}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [product.id]: {
                                      ...draft,
                                      productMainId: event.target.value,
                                    },
                                  }))
                                }
                                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700"
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-slate-700">Stock code</span>
                              <input
                                value={draft.stockCode}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [product.id]: {
                                      ...draft,
                                      stockCode: event.target.value,
                                    },
                                  }))
                                }
                                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700"
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-slate-700">
                                Desi / dimensionalWeight
                              </span>
                              <input
                                value={draft.dimensionalWeight}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [product.id]: {
                                      ...draft,
                                      dimensionalWeight: event.target.value,
                                    },
                                  }))
                                }
                                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700"
                              />
                            </label>
                            <label className="space-y-2">
                              <span className="text-sm font-medium text-slate-700">Menşei</span>
                              <input
                                value={draft.originCode}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [product.id]: {
                                      ...draft,
                                      originCode: event.target.value,
                                    },
                                  }))
                                }
                                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700"
                              />
                            </label>
                            <label className="space-y-2 lg:col-span-2">
                              <span className="text-sm font-medium text-slate-700">
                                Attributes JSON
                              </span>
                              <textarea
                                value={draft.attributesJson}
                                onChange={(event) =>
                                  setDrafts((current) => ({
                                    ...current,
                                    [product.id]: {
                                      ...draft,
                                      attributesJson: event.target.value,
                                    },
                                  }))
                                }
                                className="min-h-[180px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs text-slate-700"
                              />
                            </label>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  setPending(true);
                                  setError(null);
                                  await saveRow(product);
                                } catch (saveError) {
                                  setError(
                                    saveError instanceof Error
                                      ? saveError.message
                                      : "Kayıt başarısız.",
                                  );
                                } finally {
                                  setPending(false);
                                }
                              }}
                              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                            >
                              Kaydet
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDrafts((current) => ({
                                  ...current,
                                  [product.id]: buildDraft(product),
                                }))
                              }
                              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
                            >
                              Sıfırla
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {data.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 text-sm text-slate-500">
            <span>
              Sayfa {data.page} / {data.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadProducts(Math.max(1, data.page - 1), search)}
                disabled={data.page <= 1}
                className="rounded-xl border border-slate-200 px-3 py-2 disabled:opacity-50"
              >
                Geri
              </button>
              <button
                type="button"
                onClick={() => loadProducts(Math.min(data.totalPages, data.page + 1), search)}
                disabled={data.page >= data.totalPages}
                className="rounded-xl border border-slate-200 px-3 py-2 disabled:opacity-50"
              >
                İleri
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
