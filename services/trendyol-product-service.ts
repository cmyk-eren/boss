import { CostSource, Prisma } from "@prisma/client";

import { formatTrendyolError, isTrendyolProductListEmptyError } from "@/lib/trendyol-errors";
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

type TrendyolDeleteResponse = {
  batchRequestId?: string;
};

type TrendyolBatchResultItem = {
  barcode?: string;
  status?: string;
  requestItem?: {
    barcode?: string;
    product?: {
      barcode?: string;
    };
  };
  failureReasons?: Array<{
    message?: string;
  }>;
};

type TrendyolBatchResult = {
  status?: string;
  items?: TrendyolBatchResultItem[];
};

const ARCHIVED_DELETE_CHUNK_SIZE = 1000;
const BATCH_RESULT_POLL_ATTEMPTS = 2;
const BATCH_RESULT_POLL_INTERVAL_MS = 1_500;

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

function collectProductBarcodes(content: Array<Record<string, unknown>>) {
  return content
    .map((item) => extractString(item.barcode))
    .filter((barcode): barcode is string => Boolean(barcode));
}

function extractBatchItemBarcode(item: TrendyolBatchResultItem) {
  return item.barcode ?? item.requestItem?.product?.barcode ?? item.requestItem?.barcode ?? null;
}

function extractBatchFailureMessage(item: TrendyolBatchResultItem) {
  return item.failureReasons
    ?.map((failure) => failure.message?.trim())
    .filter((message): message is string => Boolean(message))
    .join(" | ");
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function pollBatchResult(
  client: TrendyolClient,
  supplierId: string,
  batchRequestId: string,
) {
  for (let attempt = 0; attempt < BATCH_RESULT_POLL_ATTEMPTS; attempt += 1) {
    const response = await client.request<TrendyolBatchResult>(
      `/integration/product/sellers/${supplierId}/products/batch-requests/${batchRequestId}`,
    );

    if (response.status === "COMPLETED" || attempt === BATCH_RESULT_POLL_ATTEMPTS - 1) {
      return response;
    }

    await new Promise((resolve) => setTimeout(resolve, BATCH_RESULT_POLL_INTERVAL_MS));
  }

  return null;
}

async function listArchivedProductBarcodes(
  client: TrendyolClient,
  supplierId: string,
) {
  let page = 0;
  let nextPageToken: string | undefined;
  const barcodes = new Set<string>();

  try {
    do {
      const response = await client.request<TrendyolProductListResponse>(
        `/integration/product/sellers/${supplierId}/products/approved`,
        {
          query: {
            page: nextPageToken ? undefined : page,
            size: 100,
            nextPageToken,
            status: "archived",
          },
        },
      );

      collectProductBarcodes(response.content ?? []).forEach((barcode) => barcodes.add(barcode));

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
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (isTrendyolProductListEmptyError(message)) {
      return [];
    }

    throw error;
  }

  return Array.from(barcodes);
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

    if (isTrendyolProductListEmptyError(message)) {
      await setIntegrationStatus(storeId, {
        status: "CONNECTED",
        lastSyncAt: new Date(),
        lastSuccessfulSyncAt: new Date(),
        lastError: null,
      });

      await createNotification({
        userId,
        type: "INFO",
        title: "Ürün senkronizasyonu tamamlandı",
        message: `${store.name} mağazasında onaylı ürün bulunamadı.`,
      });

      return 0;
    }

    await setIntegrationStatus(storeId, {
      status: "ERROR",
      lastSyncAt: new Date(),
      lastError: formatTrendyolError(message),
    });

    throw new Error(formatTrendyolError(message));
  }
}

export async function deleteArchivedProducts(storeId: string, userId: string) {
  const store = await getStoreScopedToUser(storeId, userId);

  if (!store) {
    throw new Error("STORE_NOT_FOUND");
  }

  try {
    const credentials = await getTrendyolCredentials(storeId);
    const client = new TrendyolClient(
      credentials.environment,
      buildTrendyolHeaders(credentials),
    );

    const archivedBarcodes = await listArchivedProductBarcodes(client, credentials.supplierId);

    if (!archivedBarcodes.length) {
      return {
        found: 0,
        deleted: 0,
        failed: 0,
        pending: 0,
        failures: [] as Array<{ barcode: string; message: string }>,
      };
    }

    const deletedBarcodes = new Set<string>();
    const pendingBarcodes = new Set<string>();
    const failures = new Map<string, string>();

    for (const barcodes of chunkItems(archivedBarcodes, ARCHIVED_DELETE_CHUNK_SIZE)) {
      const response = await client.request<TrendyolDeleteResponse>(
        `/integration/product/sellers/${credentials.supplierId}/products`,
        {
          method: "DELETE",
          body: JSON.stringify({
            items: barcodes.map((barcode) => ({ barcode })),
          }),
        },
      );

      if (!response.batchRequestId) {
        barcodes.forEach((barcode) => pendingBarcodes.add(barcode));
        continue;
      }

      const batchResult = await pollBatchResult(client, credentials.supplierId, response.batchRequestId);
      const batchItems = batchResult?.items ?? [];

      if (batchResult?.status !== "COMPLETED" || !batchItems.length) {
        barcodes.forEach((barcode) => pendingBarcodes.add(barcode));
        continue;
      }

      const handledBarcodes = new Set<string>();

      for (const item of batchItems) {
        const barcode = extractBatchItemBarcode(item);

        if (!barcode) {
          continue;
        }

        handledBarcodes.add(barcode);

        if (item.status === "SUCCESS") {
          deletedBarcodes.add(barcode);
          pendingBarcodes.delete(barcode);
          failures.delete(barcode);
          continue;
        }

        failures.set(
          barcode,
          extractBatchFailureMessage(item) || "Trendyol bu arşivli ürünü silmeyi reddetti.",
        );
        pendingBarcodes.delete(barcode);
      }

      for (const barcode of barcodes) {
        if (!handledBarcodes.has(barcode) && !failures.has(barcode) && !deletedBarcodes.has(barcode)) {
          pendingBarcodes.add(barcode);
        }
      }
    }

    if (deletedBarcodes.size > 0) {
      await prisma.product.deleteMany({
        where: {
          storeId,
          barcode: {
            in: Array.from(deletedBarcodes),
          },
        },
      });
    }

    await createNotification({
      userId,
      type: deletedBarcodes.size > 0 ? "SUCCESS" : failures.size > 0 ? "WARNING" : "INFO",
      title: "Arşiv ürün temizliği tamamlandı",
      message:
        deletedBarcodes.size > 0
          ? `${store.name} mağazasında ${deletedBarcodes.size} arşiv ürün silindi.`
          : failures.size > 0
            ? `${store.name} mağazasında arşiv ürünleri silinirken hata oluştu.`
            : `${store.name} mağazasında silinecek arşiv ürün bulunamadı.`,
    });

    return {
      found: archivedBarcodes.length,
      deleted: deletedBarcodes.size,
      failed: failures.size,
      pending: pendingBarcodes.size,
      failures: Array.from(failures.entries()).map(([barcode, message]) => ({
        barcode,
        message,
      })),
    };
  } catch (error) {
    const message =
      error instanceof Error ? formatTrendyolError(error.message) : "Arşiv ürün silme işlemi başarısız.";

    throw new Error(message);
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
