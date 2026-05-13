import { NextResponse } from "next/server";

import { requireApiUser } from "@/services/auth-service";
import { getStoreScopedToUser } from "@/services/store-service";
import { updateSupplierFeedProduct } from "@/services/supplier-xml-service";

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
    const record = await updateSupplierFeedProduct(storeId, user.id, productId, {
      selectedForExport:
        body.selectedForExport === undefined ? undefined : Boolean(body.selectedForExport),
      trendyolCategoryId:
        body.trendyolCategoryId === null || body.trendyolCategoryId === undefined
          ? body.trendyolCategoryId
          : Number(body.trendyolCategoryId),
      trendyolBrandId:
        body.trendyolBrandId === null || body.trendyolBrandId === undefined
          ? body.trendyolBrandId
          : Number(body.trendyolBrandId),
      trendyolCategoryName:
        typeof body.trendyolCategoryName === "string" ? body.trendyolCategoryName : undefined,
      productMainId: typeof body.productMainId === "string" ? body.productMainId : undefined,
      stockCode: typeof body.stockCode === "string" ? body.stockCode : undefined,
      dimensionalWeight:
        body.dimensionalWeight === null || body.dimensionalWeight === undefined
          ? body.dimensionalWeight
          : Number(body.dimensionalWeight),
      originCode: typeof body.originCode === "string" ? body.originCode : undefined,
      attributesJson: body.attributesJson,
    });

    return NextResponse.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ürün güncellenemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
