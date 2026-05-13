import { SectionCard } from "@/components/common/SectionCard";
import { formatCurrency, formatNumber } from "@/lib/utils";

type TopProductsProps = {
  products: Array<{
    barcode: string;
    title: string;
    quantity: number;
    revenue: number;
    estimatedProfit: number;
    pendingAmount: number;
    share: number;
  }>;
};

export function TopProducts({ products }: TopProductsProps) {
  return (
    <SectionCard>
      <div className="mb-6">
        <h3 className="font-heading text-xl font-bold text-slate-900">En Çok Satanlar</h3>
        <p className="mt-1 text-sm text-slate-500">
          Satış adedi, ciro ve tahmini kâra göre öne çıkan ürünler
        </p>
      </div>
      <div className="space-y-5">
        {products.map((product) => (
          <div key={`${product.barcode}-${product.title}`} className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-slate-900">{product.title}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                  {product.barcode}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm sm:flex sm:gap-6">
                <div>
                  <p className="text-slate-400">Adet</p>
                  <p className="font-semibold text-slate-900">
                    {formatNumber(product.quantity)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Ciro</p>
                  <p className="font-semibold text-slate-900">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Tahmini Kâr</p>
                  <p className="font-semibold text-emerald-600">
                    {formatCurrency(product.estimatedProfit)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Bekleyen Tutar</p>
                  <p className="font-semibold text-amber-600">
                    {formatCurrency(product.pendingAmount)}
                  </p>
                </div>
              </div>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-[#2f6bff]"
                style={{ width: `${Math.max(product.share, 6)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
