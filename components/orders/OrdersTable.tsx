import { formatCurrency, formatNumber } from "@/lib/utils";

type OrdersTableProps = {
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    orderDate: Date;
    totalPrice: number;
    estimatedProfit: number;
    lineCount: number;
    customerName?: string | null;
  }>;
};

export function OrdersTable({ orders }: OrdersTableProps) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              <th className="px-5 py-4">Sipariş</th>
              <th className="px-5 py-4">Durum</th>
              <th className="px-5 py-4">Müşteri</th>
              <th className="px-5 py-4">Ürün</th>
              <th className="px-5 py-4">Ciro</th>
              <th className="px-5 py-4">Tahmini Kâr</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {orders.map((order) => (
              <tr key={order.id} className="text-slate-600">
                <td className="px-5 py-4">
                  <div className="font-semibold text-slate-900">{order.orderNumber}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {order.orderDate.toLocaleString("tr-TR")}
                  </div>
                </td>
                <td className="px-5 py-4">{order.status}</td>
                <td className="px-5 py-4">{order.customerName || "Bilinmiyor"}</td>
                <td className="px-5 py-4">{formatNumber(order.lineCount)}</td>
                <td className="px-5 py-4 font-semibold text-slate-900">
                  {formatCurrency(order.totalPrice)}
                </td>
                <td className="px-5 py-4 font-semibold text-emerald-600">
                  {formatCurrency(order.estimatedProfit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
