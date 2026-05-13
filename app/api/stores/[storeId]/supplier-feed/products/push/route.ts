import { NextResponse } from "next/server";

import { requireApiUser } from "@/services/auth-service";
import { getStoreScopedToUser } from "@/services/store-service";
import { pushSupplierFeedProductsToTrendyol } from "@/services/supplier-xml-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const user = await requireApiUser();
    const { storeId } = await params;
    const store = await getStoreScopedToUser(storeId, user.id);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const body = await request.json();
    const result = await pushSupplierFeedProductsToTrendyol(storeId, user.id, {
      productIds: Array.isArray(body.productIds)
        ? body.productIds.map((value: unknown) => String(value))
        : undefined,
      selectedOnly: Boolean(body.selectedOnly),
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ürün aktarımı başarısız.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
