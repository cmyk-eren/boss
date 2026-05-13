import { IntegrationStatus, Prisma, TrendyolEnvironment } from "@prisma/client";

import { encryptString } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

export async function listStoresForUser(userId: string) {
  const stores = await prisma.store.findMany({
    where: { userId },
    include: {
      integration: true,
      _count: {
        select: {
          orders: true,
          products: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return stores.map((store) => ({
    id: store.id,
    name: store.name,
    supplierId: store.supplierId,
    storeFrontCode: store.storeFrontCode,
    isActive: store.isActive,
    orderCount: store._count.orders,
    productCount: store._count.products,
    integrationStatus: store.integration?.status ?? "DISCONNECTED",
    environment: store.integration?.environment ?? "PROD",
    lastSyncAt: store.integration?.lastSyncAt,
    lastError: store.integration?.lastError,
  }));
}

export async function getStoreScopedToUser(storeId: string, userId: string) {
  return prisma.store.findFirst({
    where: {
      id: storeId,
      userId,
    },
    include: {
      integration: true,
    },
  });
}

export async function connectTrendyolStore(input: {
  userId: string;
  name: string;
  supplierId: string;
  apiKey: string;
  apiSecret: string;
  storeFrontCode?: string;
  environment?: TrendyolEnvironment;
}) {
  const existingStore = await prisma.store.findFirst({
    where: {
      userId: input.userId,
      supplierId: input.supplierId,
    },
    include: {
      integration: true,
    },
  });

  const store = existingStore
    ? await prisma.store.update({
        where: { id: existingStore.id },
        data: {
          name: input.name,
          storeFrontCode: input.storeFrontCode?.trim() || existingStore.storeFrontCode,
          isActive: true,
        },
      })
    : await prisma.store.create({
        data: {
          userId: input.userId,
          name: input.name,
          supplierId: input.supplierId,
          storeFrontCode: input.storeFrontCode?.trim() || "TR",
          platform: "TRENDYOL",
        },
      });

  await prisma.trendyolIntegration.upsert({
    where: { storeId: store.id },
    create: {
      storeId: store.id,
      environment: input.environment ?? "PROD",
      status: "CONNECTED",
      apiKeyEncrypted: encryptString(input.apiKey),
      apiSecretEncrypted: encryptString(input.apiSecret),
    },
    update: {
      environment: input.environment ?? "PROD",
      status: "CONNECTED",
      apiKeyEncrypted: encryptString(input.apiKey),
      apiSecretEncrypted: encryptString(input.apiSecret),
      lastError: null,
    },
  });

  return store;
}

export async function setIntegrationStatus(
  storeId: string,
  input: {
    status: IntegrationStatus;
    lastError?: string | null;
    lastSyncAt?: Date | null;
    lastSuccessfulSyncAt?: Date | null;
  },
) {
  return prisma.trendyolIntegration.update({
    where: { storeId },
    data: {
      status: input.status,
      lastError: input.lastError ?? null,
      lastSyncAt: input.lastSyncAt ?? undefined,
      lastSuccessfulSyncAt: input.lastSuccessfulSyncAt ?? undefined,
    },
  });
}

export async function getStoreSummary(storeId: string) {
  const [productCount, orderCount, latestRevenue] = await Promise.all([
    prisma.product.count({ where: { storeId } }),
    prisma.order.count({ where: { storeId } }),
    prisma.order.aggregate({
      where: { storeId },
      _sum: { totalPrice: true, estimatedProfit: true },
    }),
  ]);

  return {
    productCount,
    orderCount,
    totalRevenue: toNumber(latestRevenue._sum.totalPrice),
    estimatedProfit: toNumber(latestRevenue._sum.estimatedProfit),
  };
}

export function decimal(value: number) {
  return new Prisma.Decimal(value.toFixed(2));
}
