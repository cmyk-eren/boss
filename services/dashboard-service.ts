import { Prisma } from "@prisma/client";
import { startOfHour } from "date-fns";

import { formatBucketLabel, resolveDateRange, type DashboardRange } from "@/lib/date-range";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";

type TopProduct = {
  productId: string | null;
  barcode: string;
  title: string;
  quantity: number;
  revenue: number;
  estimatedProfit: number;
  pendingAmount: number;
};

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export async function getDashboardData(storeId: string, range: DashboardRange) {
  const dateRange = resolveDateRange(range);
  const orders = await prisma.order.findMany({
    where: {
      storeId,
      orderDate: {
        gte: dateRange.start,
        lte: dateRange.end,
      },
    },
    include: {
      items: true,
    },
    orderBy: {
      orderDate: "asc",
    },
  });

  const orderCount = orders.length;
  const revenue = orders.reduce((sum, order) => sum + toNumber(order.totalPrice), 0);
  const estimatedProfit = orders.reduce(
    (sum, order) => sum + toNumber(order.estimatedProfit),
    0,
  );
  const averageBasket = orderCount > 0 ? revenue / orderCount : 0;

  const chartMap = new Map<
    string,
    {
      label: string;
      revenue: number;
      estimatedProfit: number;
    }
  >();

  const topProductMap = new Map<string, TopProduct>();

  for (const order of orders) {
    const bucketDate =
      dateRange.bucket === "hour"
        ? startOfHour(order.orderDate)
        : new Date(
            order.orderDate.getFullYear(),
            order.orderDate.getMonth(),
            order.orderDate.getDate(),
          );
    const bucketKey = bucketDate.toISOString();
    const current = chartMap.get(bucketKey) ?? {
      label: formatBucketLabel(bucketDate, dateRange.bucket),
      revenue: 0,
      estimatedProfit: 0,
    };

    current.revenue += toNumber(order.totalPrice);
    current.estimatedProfit += toNumber(order.estimatedProfit);
    chartMap.set(bucketKey, current);

    for (const item of order.items) {
      const key = item.productId ?? item.barcode;
      const pending =
        ["Delivered", "Cancelled", "UnDelivered"].includes(order.status) ? 0 : toNumber(item.lineRevenue);
      const product = topProductMap.get(key) ?? {
        productId: item.productId,
        barcode: item.barcode,
        title: item.title,
        quantity: 0,
        revenue: 0,
        estimatedProfit: 0,
        pendingAmount: 0,
      };

      product.quantity += item.quantity;
      product.revenue += toNumber(item.lineRevenue);
      product.estimatedProfit += toNumber(item.estimatedProfit);
      product.pendingAmount += pending;
      topProductMap.set(key, product);
    }
  }

  const chart = Array.from(chartMap.values()).map((point) => ({
    label: point.label,
    revenue: round(point.revenue),
    estimatedProfit: round(point.estimatedProfit),
  }));

  const topProducts = Array.from(topProductMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((product) => ({
      ...product,
      share: revenue > 0 ? (product.revenue / revenue) * 100 : 0,
    }));

  await prisma.dashboardSnapshot.create({
    data: {
      storeId,
      date: new Date(),
      rangeKey: range,
      ordersCount: orderCount,
      revenue: new Prisma.Decimal(revenue),
      estimatedProfit: new Prisma.Decimal(estimatedProfit),
      averageBasket: new Prisma.Decimal(averageBasket),
      topProductsJson: topProducts,
    },
  });

  return {
    range: dateRange,
    metrics: {
      orders: orderCount,
      revenue,
      estimatedProfit,
      averageBasket,
    },
    chart,
    topProducts,
  };
}

export async function getAnalyticsData(storeId: string, range: DashboardRange) {
  const products = await prisma.product.findMany({
    where: { storeId },
    include: {
      costs: {
        orderBy: {
          effectiveFrom: "desc",
        },
        take: 1,
      },
    },
  });

  const dashboard = await getDashboardData(storeId, range);
  const lowStock = products.filter((product) => product.quantity <= 10);
  const priceRisk = products.filter((product) => {
    const latestCost = toNumber(product.costs[0]?.cost ?? 0);
    return latestCost > 0 && toNumber(product.salePrice) <= latestCost * 1.08;
  });

  const categoryMap = new Map<
    string,
    {
      categoryName: string;
      revenue: number;
      estimatedProfit: number;
      quantity: number;
    }
  >();

  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        storeId,
        orderDate: {
          gte: dashboard.range.start,
          lte: dashboard.range.end,
        },
      },
    },
    include: {
      product: true,
    },
  });

  for (const item of items) {
    const categoryName = item.product?.categoryName ?? "Kategorisiz";
    const category = categoryMap.get(categoryName) ?? {
      categoryName,
      revenue: 0,
      estimatedProfit: 0,
      quantity: 0,
    };
    category.revenue += toNumber(item.lineRevenue);
    category.estimatedProfit += toNumber(item.estimatedProfit);
    category.quantity += item.quantity;
    categoryMap.set(categoryName, category);
  }

  return {
    ...dashboard,
    summary: {
      profitMargin:
        dashboard.metrics.revenue > 0
          ? (dashboard.metrics.estimatedProfit / dashboard.metrics.revenue) * 100
          : 0,
      lowStockCount: lowStock.length,
      priceRiskCount: priceRisk.length,
    },
    lowStock: lowStock.slice(0, 12),
    priceRisk: priceRisk.slice(0, 12),
    categories: Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue),
  };
}
