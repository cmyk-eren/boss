import { NextResponse } from "next/server";

import { requireApiUser } from "@/services/auth-service";
import { getStoreScopedToUser } from "@/services/store-service";
import { importProductCosts } from "@/services/trendyol-product-service";

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
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const updated = await importProductCosts(storeId, rows);
    return NextResponse.json({ updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "İçe aktarma başarısız.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
