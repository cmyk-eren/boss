import { CostSource, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { createNotification } from "@/services/notification-service";
import { calculateEstimatedProfit } from "@/services/profit-calculation-service";
import { getStoreScopedToUser, setIntegrationStatus } from "@/services/store-service";
import { buildTrendyolHeaders, getTrendyolCredentials } from "@/services/trendyol-auth";
import { TrendyolClient } from "@/services/trendyol-client";

type TrendyolProductListResponse = {
  content?: Array<Record<string, unknown>>;
  page?: number;
  totalPages?: number;
  nextPageToken?: string | null;
};

function mapProductImage(product: Record<string, unknown>) {
  const images = product.images;

  if (Array.isArray(images) && images[0] && typeof images[0] === "object") {
    const firstImage = images[0] as Record<string, unknown>;
    return typeof firstImage.url === "string" ? firstImage.url : null;
  }

  return null;
}

function extractString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function extractNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value ?? 0);
}

export async function fetchProductsForStore(storeId: string) {
  return prisma.product.findMany({
    where: { storeId },
    include: {
      costs: {
        orderBy: { effectiveFrom: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function syncProducts(storeId: string, userId: string) {
  const store = await getStoreScopedToUser(storeId, userId);

  if (!store) {
    throw new Error("STORE_NOT_FOUND");
  }

  const credentials = await getTrendyolCredentials(storeId);
  const client = new TrendyolClient(
    credentials.environment,
    buildTrendyolHeaders(credentials),
  );

  let page = 0;
  let nextPageToken: string | undefined;
  let total = 0;

  try {
    do {
      const response = await client.request<TrendyolProductListResponse>(
        `/integration/product/sellers/${credentials.supplierId}/products/approved`,
        {
          query: {
            page: nextPageToken ? undefined : page,
            size: 100,
            nextPageToken,
          },
        },
      );

      const content = response.content ?? [];

      for (const item of content) {
        const barcode = extractString(item.barcode);
        const title = extractString(item.title);

        if (!barcode || !title) {
          continue;
        }

        await prisma.product.upsert({
          where: {
            storeId_barcode: {
              storeId,
              barcode,
            },
          },
          create: {
            storeId,
            barcode,
            title,
            externalId: String(item.contentId ?? item.id ?? barcode),
            sku: extractString(item.stockCode),
            categoryName: extractString(item.categoryName),
            brand: extractString(item.brand),
            listPrice: new Prisma.Decimal(extractNumber(item.listPrice)),
            salePrice: new Prisma.Decimal(extractNumber(item.salePrice)),
            quantity: extractNumber(item.quantity),
            status: extractString(item.status),
            imageUrl: mapProductImage(item),
            lastSyncedAt: new Date(),
          },
          update: {
            title,
            externalId: String(item.contentId ?? item.id ?? barcode),
            sku: extractString(item.stockCode),
            categoryName: extractString(item.categoryName),
            brand: extractString(item.brand),
            listPrice: new Prisma.Decimal(extractNumber(item.listPrice)),
            salePrice: new Prisma.Decimal(extractNumber(item.salePrice)),
            quantity: extractNumber(item.quantity),
            status: extractString(item.status),
            imageUrl: mapProductImage(item),
            lastSyncedAt: new Date(),
          },
        });

        total += 1;
      }

      const hasPageContinuation =
        typeof response.totalPages === "number" &&
        typeof response.page === "number" &&
        response.page + 1 < response.totalPages;

      if (hasPageContinuation) {
        page = (response.page ?? page) + 1;
        nextPageToken = undefined;
      } else if (response.nextPageToken) {
        nextPageToken = response.nextPageToken;
      } else {
        nextPageToken = undefined;
        page = 0;
      }
    } while (page > 0 || nextPageToken);

    await setIntegrationStatus(storeId, {
      status: "CONNECTED",
      lastSyncAt: new Date(),
      lastSuccessfulSyncAt: new Date(),
      lastError: null,
    });

    await createNotification({
      userId,
      type: "SUCCESS",
      title: "Ürün senkronizasyonu tamamlandı",
      message: `${store.name} mağazasından ${total} ürün güncellendi.`,
    });

    return total;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ürün senkronizasyonu başarısız.";

    await setIntegrationStatus(storeId, {
      status: "ERROR",
      lastSyncAt: new Date(),
      lastError: message,
    });

    throw error;
  }
}

async function recalculateOrderProfitsForProduct(storeId: string, productId: string, cost: number) {
  const items = await prisma.orderItem.findMany({
    where: {
      productId,
      order: {
        storeId,
      },
    },
    include: {
      order: true,
    },
  });

  const affectedOrderIds = new Set<string>();

  for (const item of items) {
    const productCostAmount = cost * item.quantity;
    const estimatedProfit = calculateEstimatedProfit({
      revenue: toNumber(item.lineRevenue),
      productCost: productCostAmount,
      commission: toNumber(item.commissionAmount),
      shippingCost: toNumber(item.shippingCost),
      serviceFee: toNumber(item.serviceFee),
      otherCosts: toNumber(item.otherCosts),
    });

    await prisma.orderItem.update({
      where: { id: item.id },
      data: {
        productCostAmount: new Prisma.Decimal(productCostAmount),
        estimatedProfit: new Prisma.Decimal(estimatedProfit),
      },
    });

    affectedOrderIds.add(item.orderId);
  }

  await Promise.all(
    Array.from(affectedOrderIds).map(async (orderId) => {
      const totals = await prisma.orderItem.aggregate({
        where: { orderId },
        _sum: {
          estimatedProfit: true,
        },
      });

      return prisma.order.update({
        where: { id: orderId },
        data: {
          estimatedProfit: new Prisma.Decimal(toNumber(totals._sum.estimatedProfit)),
        },
      });
    }),
  );
}

export async function updateProductCost(
  storeId: string,
  productId: string,
  cost: number,
  source: CostSource = "MANUAL",
) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      storeId,
    },
  });

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  const record = await prisma.productCost.create({
    data: {
      storeId,
      productId,
      cost: new Prisma.Decimal(cost),
      source,
    },
  });

  await recalculateOrderProfitsForProduct(storeId, productId, cost);
  return record;
}

export async function importProductCosts(
  storeId: string,
  rows: Array<{ barcode: string; cost: number }>,
) {
  const products = await prisma.product.findMany({
    where: {
      storeId,
      barcode: {
        in: rows.map((row) => row.barcode),
      },
    },
  });

  const byBarcode = new Map(products.map((product) => [product.barcode, product]));
  let updated = 0;

  for (const row of rows) {
    const product = byBarcode.get(row.barcode);
    if (!product) continue;
    await updateProductCost(storeId, product.id, row.cost, "IMPORT");
    updated += 1;
  }

  return updated;
}
