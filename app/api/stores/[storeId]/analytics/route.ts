import { NextRequest, NextResponse } from "next/server";

import { parseRange } from "@/lib/date-range";
import { requireApiUser } from "@/services/auth-service";
import { getAnalyticsData } from "@/services/dashboard-service";
import { getStoreScopedToUser } from "@/services/store-service";
import { toNumber } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const user = await requireApiUser();
    const { storeId } = await params;
    const store = await getStoreScopedToUser(storeId, user.id);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const analytics = await getAnalyticsData(
      storeId,
      parseRange(request.nextUrl.searchParams.get("range") ?? undefined),
    );

    return NextResponse.json({
      ...analytics,
      lowStock: analytics.lowStock.map((product) => ({
        ...product,
        listPrice: toNumber(product.listPrice),
        salePrice: toNumber(product.salePrice),
      })),
      priceRisk: analytics.priceRisk.map((product) => ({
        ...product,
        listPrice: toNumber(product.listPrice),
        salePrice: toNumber(product.salePrice),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
