import { IntegrationStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { syncOrders } from "@/services/trendyol-order-service";
import { syncProducts } from "@/services/trendyol-product-service";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-cron-secret");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stores = await prisma.store.findMany({
    where: {
      isActive: true,
      integration: {
        is: {
          status: IntegrationStatus.CONNECTED,
        },
      },
    },
    select: {
      id: true,
      userId: true,
    },
  });

  const results = [];

  for (const store of stores) {
    try {
      const [products, orders] = await Promise.all([
        syncProducts(store.id, store.userId),
        syncOrders(store.id, store.userId),
      ]);

      results.push({
        storeId: store.id,
        success: true,
        products,
        orders,
      });
    } catch (error) {
      results.push({
        storeId: store.id,
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      });
    }
  }

  return NextResponse.json({ results });
}
