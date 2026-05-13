import { NextResponse } from "next/server";

import { toNumber } from "@/lib/utils";
import { requireApiUser } from "@/services/auth-service";
import { getStoreScopedToUser } from "@/services/store-service";
import { fetchOrdersForStore } from "@/services/trendyol-order-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const user = await requireApiUser();
    const { storeId } = await params;
    const store = await getStoreScopedToUser(storeId, user.id);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const orders = await fetchOrdersForStore(storeId);
    return NextResponse.json(
      orders.map((order) => ({
        ...order,
        totalPrice: toNumber(order.totalPrice),
        estimatedProfit: toNumber(order.estimatedProfit),
        commissionTotal: toNumber(order.commissionTotal),
        cargoPrice: toNumber(order.cargoPrice),
        serviceFee: toNumber(order.serviceFee),
      })),
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
