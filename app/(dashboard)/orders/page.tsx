import Link from "next/link";

import { EmptyState } from "@/components/common/EmptyState";
import { Header } from "@/components/layout/Header";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { getPageContext, type AppSearchParams } from "@/lib/page-context";
import { toNumber } from "@/lib/utils";
import { requireUser } from "@/services/auth-service";
import { fetchOrdersForStore } from "@/services/trendyol-order-service";

export default async function OrdersPage({
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
          title="Siparişler"
          stores={context.stores}
          currentStoreId={context.activeStoreId}
          notificationCount={context.notificationCount}
        />
        <EmptyState
          title="Sipariş görünümü için mağaza bağlantısı gerekli"
          description="Trendyol sipariş paketleri senkronize edildiğinde burada ayrıntılı sipariş tablosu listelenir."
          action={
            <Link
              href="/integrations/trendyol"
              className="rounded-2xl bg-[#2f6bff] px-4 py-3 text-sm font-semibold text-white"
            >
              Mağaza Bağla
            </Link>
          }
        />
      </div>
    );
  }

  const orders = await fetchOrdersForStore(context.activeStore.id);

  return (
    <div className="space-y-6">
      <Header
        title="Siparişler"
        stores={context.stores}
        currentStoreId={context.activeStoreId}
        notificationCount={context.notificationCount}
      />
      {orders.length === 0 ? (
        <EmptyState
          title="Henüz senkronize sipariş bulunamadı"
          description="Üstteki senkronizasyon butonunu kullanarak Trendyol siparişlerinizi çekebilirsiniz."
        />
      ) : (
        <OrdersTable
          orders={orders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            orderDate: order.orderDate,
            totalPrice: toNumber(order.totalPrice),
            estimatedProfit: toNumber(order.estimatedProfit),
            lineCount: order.lineCount,
            customerName: order.customerName,
          }))}
        />
      )}
    </div>
  );
}
