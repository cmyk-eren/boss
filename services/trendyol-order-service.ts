import { Prisma } from "@prisma/client";
import { subDays } from "date-fns";

import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { createNotification } from "@/services/notification-service";
import {
  calculateEstimatedProfit,
  resolveCategoryCostProfile,
} from "@/services/profit-calculation-service";
import { setIntegrationStatus } from "@/services/store-service";
import { buildTrendyolHeaders, getTrendyolCredentials } from "@/services/trendyol-auth";
import { TrendyolClient } from "@/services/trendyol-client";

type TrendyolLine = {
  barcode?: string;
  merchantSku?: string;
  productName?: string;
  quantity?: number;
  price?: number;
  amount?: number;
  commission?: number;
  commissionRate?: number;
};

type TrendyolOrderPackage = {
  shipmentPackageId?: number | string;
  orderNumber?: string;
  status?: string;
  orderDate?: number | string;
  lastModifiedDate?: number | string;
  totalPrice?: number;
  cargoPrice?: number;
  lines?: TrendyolLine[];
  customerFirstName?: string;
  customerLastName?: string;
};

type TrendyolOrdersResponse = {
  content?: TrendyolOrderPackage[];
  hasMore?: boolean;
  nextCursor?: string | null;
};

function toDate(value: number | string | undefined) {
  if (!value) return new Date();
  if (typeof value === "number") return new Date(value);
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && asNumber > 999_999_999) return new Date(asNumber);
  return new Date(value);
}

export async function fetchOrdersForStore(storeId: string) {
  return prisma.order.findMany({
    where: { storeId },
    include: {
      items: true,
    },
    orderBy: {
      orderDate: "desc",
    },
    take: 100,
  });
}

export async function syncOrders(storeId: string, userId: string) {
  const store = await prisma.store.findFirst({
    where: {
      id: storeId,
      userId,
    },
    include: {
      integration: true,
    },
  });

  if (!store || !store.integration) {
    throw new Error("STORE_NOT_FOUND");
  }

  const credentials = await getTrendyolCredentials(storeId);
  const client = new TrendyolClient(
    credentials.environment,
    buildTrendyolHeaders(credentials),
  );

  const syncLog = await prisma.syncLog.create({
    data: {
      storeId,
      scope: "ORDERS",
      status: "STARTED",
      metadata: {
        startedBy: userId,
      },
    },
  });

  const now = new Date();
  const latestSync = store.integration.lastSuccessfulSyncAt ?? subDays(now, 14);
  const startDate = latestSync < subDays(now, 14) ? subDays(now, 14) : latestSync;

  let nextCursor: string | undefined;
  let syncedCount = 0;

  try {
    do {
      const response = await client.request<TrendyolOrdersResponse>(
        `/integration/order/sellers/${credentials.supplierId}/orders/stream`,
        {
          query: {
            lastModifiedStartDate: startDate.getTime(),
            lastModifiedEndDate: now.getTime(),
            size: 200,
            nextCursor,
          },
        },
      );

      const packages = response.content ?? [];

      for (const pkg of packages) {
        const externalId = String(pkg.shipmentPackageId ?? "");

        if (!externalId) {
          continue;
        }

        const lines = pkg.lines ?? [];
        const barcodes = lines.map((line) => line.barcode).filter(Boolean) as string[];
        const products = await prisma.product.findMany({
          where: {
            storeId,
            barcode: {
              in: barcodes,
            },
          },
          include: {
            costs: {
              orderBy: { effectiveFrom: "desc" },
              take: 1,
            },
          },
        });

        const productMap = new Map(products.map((product) => [product.barcode, product]));
        const totalUnits = Math.max(
          lines.reduce((sum, line) => sum + Number(line.quantity ?? 1), 0),
          1,
        );
        const packageRevenue = Number(pkg.totalPrice ?? 0);
        const packageCargo = Number(pkg.cargoPrice ?? 0);

        const order = await prisma.order.upsert({
          where: {
            storeId_externalId: {
              storeId,
              externalId,
            },
          },
          create: {
            storeId,
            externalId,
            orderNumber: pkg.orderNumber ?? externalId,
            status: pkg.status ?? "Created",
            orderDate: toDate(pkg.orderDate),
            lastModifiedAt: toDate(pkg.lastModifiedDate),
            totalPrice: new Prisma.Decimal(packageRevenue),
            grossAmount: new Prisma.Decimal(packageRevenue),
            cargoPrice: new Prisma.Decimal(packageCargo),
            customerName: [pkg.customerFirstName, pkg.customerLastName].filter(Boolean).join(" "),
            lineCount: lines.length,
          },
          update: {
            orderNumber: pkg.orderNumber ?? externalId,
            status: pkg.status ?? "Created",
            orderDate: toDate(pkg.orderDate),
            lastModifiedAt: toDate(pkg.lastModifiedDate),
            totalPrice: new Prisma.Decimal(packageRevenue),
            grossAmount: new Prisma.Decimal(packageRevenue),
            cargoPrice: new Prisma.Decimal(packageCargo),
            customerName: [pkg.customerFirstName, pkg.customerLastName].filter(Boolean).join(" "),
            lineCount: lines.length,
          },
        });

        await prisma.orderItem.deleteMany({
          where: { orderId: order.id },
        });

        let orderCommission = 0;
        let orderProfit = 0;
        let serviceFeeTotal = 0;
        let otherCostsTotal = 0;

        for (const line of lines) {
          const quantity = Number(line.quantity ?? 1);
          const unitPrice = Number(line.price ?? line.amount ?? 0);
          const lineRevenue = Number(line.amount ?? unitPrice * quantity);
          const matchedProduct = line.barcode ? productMap.get(line.barcode) : null;
          const latestCost = matchedProduct?.costs[0];
          const categoryProfile = await resolveCategoryCostProfile(
            storeId,
            matchedProduct?.categoryName,
          );
          const commissionRate = Number(
            line.commissionRate ?? categoryProfile.commissionRate ?? 0,
          );
          const commissionAmount =
            Number(line.commission ?? 0) || (lineRevenue * commissionRate) / 100;
          const shippingCost = packageCargo / totalUnits * quantity;
          const serviceFee = categoryProfile.defaultServiceFee * quantity;
          const otherCosts = categoryProfile.defaultOtherCosts * quantity;
          const productCostAmount = toNumber(latestCost?.cost ?? 0) * quantity;
          const estimatedProfit = calculateEstimatedProfit({
            revenue: lineRevenue,
            productCost: productCostAmount,
            commission: commissionAmount,
            shippingCost,
            serviceFee,
            otherCosts,
          });

          await prisma.orderItem.create({
            data: {
              orderId: order.id,
              productId: matchedProduct?.id,
              barcode: line.barcode ?? matchedProduct?.barcode ?? `line-${order.id}`,
              merchantSku: line.merchantSku ?? matchedProduct?.sku,
              title: line.productName ?? matchedProduct?.title ?? "Ürün",
              quantity,
              unitPrice: new Prisma.Decimal(unitPrice),
              lineRevenue: new Prisma.Decimal(lineRevenue),
              commissionRate: new Prisma.Decimal(commissionRate),
              commissionAmount: new Prisma.Decimal(commissionAmount),
              shippingCost: new Prisma.Decimal(shippingCost),
              serviceFee: new Prisma.Decimal(serviceFee),
              otherCosts: new Prisma.Decimal(otherCosts),
              productCostAmount: new Prisma.Decimal(productCostAmount),
              estimatedProfit: new Prisma.Decimal(estimatedProfit),
            },
          });

          orderCommission += commissionAmount;
          orderProfit += estimatedProfit;
          serviceFeeTotal += serviceFee;
          otherCostsTotal += otherCosts;
        }

        await prisma.order.update({
          where: { id: order.id },
          data: {
            commissionTotal: new Prisma.Decimal(orderCommission),
            serviceFee: new Prisma.Decimal(serviceFeeTotal),
            otherCosts: new Prisma.Decimal(otherCostsTotal),
            estimatedProfit: new Prisma.Decimal(orderProfit),
          },
        });

        syncedCount += 1;
      }

      nextCursor = response.hasMore ? response.nextCursor ?? undefined : undefined;
    } while (nextCursor);

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "SUCCESS",
        finishedAt: new Date(),
        recordsSynced: syncedCount,
      },
    });

    await setIntegrationStatus(storeId, {
      status: "CONNECTED",
      lastSyncAt: new Date(),
      lastSuccessfulSyncAt: new Date(),
      lastError: null,
    });

    await createNotification({
      userId,
      type: "SUCCESS",
      title: "Sipariş senkronizasyonu tamamlandı",
      message: `${store.name} mağazası için ${syncedCount} sipariş paketi işlendi.`,
    });

    return syncedCount;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sipariş senkronizasyonu başarısız.";

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: message,
      },
    });

    await setIntegrationStatus(storeId, {
      status: "ERROR",
      lastSyncAt: new Date(),
      lastError: message,
    });

    await createNotification({
      userId,
      type: "ERROR",
      title: "Senkronizasyon hatası",
      message,
    });

    throw error;
  }
}
