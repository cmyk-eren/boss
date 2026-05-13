import { NextResponse } from "next/server";

import { requireApiUser } from "@/services/auth-service";
import { syncOrders } from "@/services/trendyol-order-service";
import { syncProducts } from "@/services/trendyol-product-service";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const body = await request.json();
    const storeId = String(body.storeId ?? "");

    if (!storeId) {
      return NextResponse.json({ error: "storeId zorunludur." }, { status: 400 });
    }

    const [products, orders] = await Promise.all([
      syncProducts(storeId, user.id),
      syncOrders(storeId, user.id),
    ]);

    return NextResponse.json({
      success: true,
      products,
      orders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Senkronizasyon başarısız.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
