import { NextResponse } from "next/server";

import { requireApiUser } from "@/services/auth-service";
import { deleteArchivedProducts } from "@/services/trendyol-product-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const user = await requireApiUser();
    const { storeId } = await params;

    const result = await deleteArchivedProducts(storeId, user.id);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Arşiv ürün silme işlemi başarısız.";
    const status = message === "STORE_NOT_FOUND" ? 404 : message === "UNAUTHORIZED" ? 401 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
