import { NextResponse } from "next/server";

import { toNumber } from "@/lib/utils";
import { requireApiUser } from "@/services/auth-service";
import { getStoreScopedToUser } from "@/services/store-service";
import { fetchProductsForStore } from "@/services/trendyol-product-service";

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

    const products = await fetchProductsForStore(storeId);
    return NextResponse.json(
      products.map((product) => ({
        ...product,
        listPrice: toNumber(product.listPrice),
        salePrice: toNumber(product.salePrice),
        costs: product.costs.map((cost) => ({
          cost: toNumber(cost.cost),
          effectiveFrom: cost.effectiveFrom,
        })),
      })),
    );
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
