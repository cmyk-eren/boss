import { NextResponse } from "next/server";

import { requireApiUser } from "@/services/auth-service";
import { getStoreScopedToUser } from "@/services/store-service";
import { listSupplierFeedProductsForApi } from "@/services/supplier-xml-service";

export async function GET(
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

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") ?? undefined;
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "24");

    const result = await listSupplierFeedProductsForApi(storeId, {
      query,
      page,
      pageSize,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ürünler getirilemedi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
