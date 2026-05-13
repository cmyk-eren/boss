import Link from "next/link";

import { EmptyState } from "@/components/common/EmptyState";
import { Header } from "@/components/layout/Header";
import { ProductCostEditor } from "@/components/products/ProductCostEditor";
import { ProductCostImport } from "@/components/products/ProductCostImport";
import { SupplierFeedManager } from "@/components/products/SupplierFeedManager";
import { getPageContext, type AppSearchParams } from "@/lib/page-context";
import { formatCurrency, toNumber } from "@/lib/utils";
import { requireUser } from "@/services/auth-service";
import { listSupplierFeedProducts } from "@/services/supplier-xml-service";
import { TRENDYOL_CARGO_COMPANIES } from "@/services/trendyol-catalog-service";
import { fetchProductsForStore } from "@/services/trendyol-product-service";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const user = await requireUser();
  const context = await getPageContext(user.id, searchParams);

  if (!context.activeStore) {
    return (
      <div className="space-y-6">
        <Header
          title="Ürünler"
          stores={context.stores}
          currentStoreId={context.activeStoreId}
          notificationCount={context.notificationCount}
        />
        <EmptyState
          title="Ürün verisi için mağaza bağlantısı gerekli"
          description="Önce Trendyol mağazanızı bağlayın, ardından ürün ve maliyet yönetimini buradan yapın."
          action={
            <Link
              href="/integrations/trendyol"
              className="rounded-2xl bg-[#2f6bff] px-4 py-3 text-sm font-semibold text-white"
            >
              Entegrasyona Git
            </Link>
          }
        />
      </div>
    );
  }

  const [products, supplierFeedData] = await Promise.all([
    fetchProductsForStore(context.activeStore.id),
    listSupplierFeedProducts(context.activeStore.id, {
      page: 1,
      pageSize: 24,
    }),
  ]);

  return (
    <div className="space-y-6">
      <Header
        title="Ürünler"
        stores={context.stores}
        currentStoreId={context.activeStoreId}
        notificationCount={context.notificationCount}
      />
      <SupplierFeedManager
        storeId={context.activeStore.id}
        initialData={{
          ...supplierFeedData,
          items: supplierFeedData.items.map((item) => ({
            ...item,
            listPrice: toNumber(item.listPrice),
            salePrice: toNumber(item.salePrice),
            vatRate: toNumber(item.vatRate),
            desi: toNumber(item.desi),
            dimensionalWeight: toNumber(item.dimensionalWeight),
          })),
        }}
        initialSourceUrl="https://www.royaltedarik.com/export/6e21dae4586f69c8ca3cc3c90c15685aiXHDpXTxTeeNZV16g=="
        cargoCompanies={TRENDYOL_CARGO_COMPANIES.map((company) => ({
          id: company.id,
          code: company.code,
          name: company.name,
        }))}
      />
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
            <div>
              <h3 className="font-heading text-xl font-bold text-slate-900">Ürün performansı</h3>
              <p className="mt-1 text-sm text-slate-500">
                Satış fiyatı, stok ve ürün maliyeti yönetimi
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                <tr>
                  <th className="px-5 py-4">Ürün</th>
                  <th className="px-5 py-4">Kategori</th>
                  <th className="px-5 py-4">Satış Fiyatı</th>
                  <th className="px-5 py-4">Stok</th>
                  <th className="px-5 py-4">Maliyet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{product.title}</div>
                      <div className="mt-1 text-xs text-slate-400">{product.barcode}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{product.categoryName || "Kategorisiz"}</td>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {formatCurrency(toNumber(product.salePrice))}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{product.quantity}</td>
                    <td className="px-5 py-4">
                      <ProductCostEditor
                        storeId={context.activeStore.id}
                        productId={product.id}
                        initialCost={toNumber(product.costs[0]?.cost ?? 0)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <ProductCostImport storeId={context.activeStore.id} />
      </div>
    </div>
  );
}
