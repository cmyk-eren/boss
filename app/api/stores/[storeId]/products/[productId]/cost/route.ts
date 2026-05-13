import { NextResponse } from "next/server";

import { requireApiUser } from "@/services/auth-service";
import { getStoreScopedToUser } from "@/services/store-service";
import { updateProductCost } from "@/services/trendyol-product-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ storeId: string; productId: string }> },
) {
  try {
    const user = await requireApiUser();
    const { storeId, productId } = await params;
    const store = await getStoreScopedToUser(storeId, user.id);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const body = await request.json();
    const cost = Number(body.cost);

    if (Number.isNaN(cost) || cost < 0) {
      return NextResponse.json({ error: "Geçerli bir maliyet girin." }, { status: 400 });
    }

    const record = await updateProductCost(storeId, productId, cost);
    return NextResponse.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Güncelleme başarısız.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
