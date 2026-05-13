import {
  Prisma,
  SupplierFeedStatus,
  SupplierProductExportStatus,
  SyncDirection,
  SyncScope,
  SyncStatus,
} from "@prisma/client";
import { XMLParser } from "fast-xml-parser";

import { formatTrendyolError } from "@/lib/trendyol-errors";
import { prisma } from "@/lib/prisma";
import { compact, toNumber } from "@/lib/utils";
import { createNotification } from "@/services/notification-service";
import { getStoreScopedToUser } from "@/services/store-service";
import {
  findBrandMatch,
  findCategoryMatch,
  getCategoryAttributes,
  getCategoryAttributeValues,
} from "@/services/trendyol-catalog-service";
import { buildTrendyolHeaders, getTrendyolCredentials } from "@/services/trendyol-auth";
import { TrendyolClient } from "@/services/trendyol-client";

type SupplierFeedListOptions = {
  query?: string;
  page?: number;
  pageSize?: number;
};

type SupplierFeedProductInput = {
  sourceProductId: string | null;
  productCode: string | null;
  barcode: string;
  parentBarcode: string | null;
  title: string;
  description: string | null;
  detailHtml: string | null;
  categoryPath: string | null;
  supplierCategoryId: string | null;
  supplierBrandId: string | null;
  brandName: string | null;
  listPrice: number;
  salePrice: number;
  vatRate: number;
  currency: string;
  quantity: number;
  desi: number;
  imageUrls: string[];
  variantName1: string | null;
  variantValue1: string | null;
  variantName2: string | null;
  variantValue2: string | null;
  trendyolCategoryId: number | null;
  trendyolCategoryName: string | null;
  trendyolBrandId: number | null;
  productMainId: string;
  stockCode: string;
};

type TrendyolBatchResult = {
  batchRequestId?: string;
  status?: string;
  items?: Array<{
    status?: string;
    failureReasons?: Array<{ message?: string }>;
    requestItem?: {
      barcode?: string;
      product?: {
        barcode?: string;
      };
    };
  }>;
};

type TrendyolCreateProductItem = {
  barcode: string;
  title: string;
  description: string;
  productMainId: string;
  brandId: number;
  categoryId: number;
  quantity: number;
  stockCode: string;
  dimensionalWeight: number;
  currencyType: string;
  listPrice: number;
  salePrice: number;
  vatRate: number;
  cargoCompanyId: number;
  shipmentAddressId?: number;
  returningAddressId?: number;
  deliveryOption?: {
    deliveryDuration?: number;
  };
  images: Array<{ url: string }>;
  attributes: Array<Record<string, unknown>>;
  origin?: string;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  parseTagValue: false,
  cdataPropName: "__cdata",
  processEntities: true,
});

const XML_FETCH_TIMEOUT_MS = 30_000;

function buildXmlFetchHeaders(sourceUrl: string) {
  const url = new URL(sourceUrl);

  return {
    Accept: "application/xml,text/xml,application/xhtml+xml,text/html;q=0.9,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Referer: `${url.origin}/`,
    Origin: url.origin,
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  };
}

async function fetchXmlSource(sourceUrl: string) {
  const headers = buildXmlFetchHeaders(sourceUrl);
  const attempts = [
    { label: "browser-headers", headers },
    {
      label: "browser-headers-with-cookie-accept",
      headers: {
        ...headers,
        Cookie: "",
      },
    },
  ];

  let lastError: Error | null = null;

  for (const attempt of attempts) {
    try {
      const response = await fetch(sourceUrl, {
        cache: "no-store",
        redirect: "follow",
        headers: attempt.headers,
        signal: AbortSignal.timeout(XML_FETCH_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`XML kaynağına erişilemedi. HTTP ${response.status}`);
      }

      const xml = await response.text();

      if (!xml.trim()) {
        throw new Error("XML kaynağı boş cevap döndü.");
      }

      return xml;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("XML fetch başarısız.");
      console.error("[BOSS] XML fetch attempt failed:", attempt.label, lastError.message);
    }
  }

  throw lastError ?? new Error("XML kaynağına erişilemedi.");
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

function readText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (value && typeof value === "object" && "__cdata" in value) {
    return readText((value as { __cdata?: unknown }).__cdata);
  }

  return null;
}

function truncate(value: string, limit: number) {
  return value.length > limit ? value.slice(0, limit) : value;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildDescription(detailHtml: string | null, description: string | null) {
  if (detailHtml?.trim()) {
    return truncate(detailHtml.trim(), 30_000);
  }

  if (description?.trim()) {
    return `<p>${escapeHtml(description.trim())}</p>`;
  }

  return "<p>Ürün açıklaması tedarikçi feed verisinden aktarılmıştır.</p>";
}

function parseNumber(value: unknown, fallback = 0) {
  const raw = readText(value);
  const parsed = Number(raw ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseInteger(value: unknown, fallback = 0) {
  return Math.max(0, Math.round(parseNumber(value, fallback)));
}

function parseVatRate(value: unknown) {
  const numeric = parseNumber(value, 0);

  if (numeric > 0 && numeric < 1) {
    return Math.round(numeric * 100);
  }

  return Math.round(numeric);
}

function resolveImages(node: Record<string, unknown>) {
  return Object.entries(node)
    .filter(([key]) => /^image\d+$/i.test(key))
    .map(([, value]) => readText(value))
    .filter((value): value is string => Boolean(value?.startsWith("https://")))
    .slice(0, 8);
}

function normalizeExportStatus(
  exportStatus: SupplierProductExportStatus,
  categoryId?: number | null,
  brandId?: number | null,
) {
  if (exportStatus === "SYNCED") {
    return exportStatus;
  }

  return categoryId && brandId ? "READY" : "DRAFT";
}

function parseAttributesJson(value: Prisma.JsonValue | null) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item) => Boolean(item && typeof item === "object" && "attributeId" in item),
  ) as Record<string, unknown>[];
}

function buildSourceRows(parsed: Record<string, unknown>) {
  const products = asArray(
    (parsed.products as Record<string, unknown> | undefined)?.product as
      | Record<string, unknown>
      | Array<Record<string, unknown>>
      | undefined,
  );

  return products.flatMap((product) => {
    const sourceProductId = readText(product.id);
    const productCode = readText(product.productCode);
    const parentBarcode = readText(product.barcode);
    const title = truncate(
      readText(product.name) ?? readText(product.description) ?? parentBarcode ?? "İsimsiz ürün",
      100,
    );
    const description = readText(product.description);
    const detailHtml = readText(product.detail);
    const categoryPath = readText(product.category);
    const supplierCategoryId = readText(product.categoryID);
    const supplierBrandId = readText(product.brandID);
    const brandName = readText(product.brand);
    const listPrice = parseNumber(product.listPrice);
    const salePrice = parseNumber(product.price, listPrice);
    const quantity = parseInteger(product.quantity);
    const desi = parseNumber(product.desi, 1);
    const currency = readText(product.currency) ?? "TRY";
    const vatRate = parseVatRate(product.tax);
    const images = resolveImages(product);
    const variants = asArray(
      (product.variants as Record<string, unknown> | undefined)?.variant as
        | Record<string, unknown>
        | Array<Record<string, unknown>>
        | undefined,
    );
    const productMainId = truncate(
      productCode ?? sourceProductId ?? parentBarcode ?? crypto.randomUUID(),
      40,
    );

    if (!variants.length) {
      const barcode = parentBarcode;

      if (!barcode) {
        return [];
      }

      return [
        {
          sourceProductId,
          productCode,
          barcode,
          parentBarcode,
          title,
          description,
          detailHtml,
          categoryPath,
          supplierCategoryId,
          supplierBrandId,
          brandName,
          listPrice: Math.max(listPrice, salePrice),
          salePrice,
          vatRate,
          currency,
          quantity,
          desi,
          imageUrls: images,
          variantName1: null,
          variantValue1: null,
          variantName2: null,
          variantValue2: null,
          productMainId,
          stockCode: truncate(productCode ?? barcode, 100),
        },
      ] satisfies Array<Omit<SupplierFeedProductInput, "trendyolCategoryId" | "trendyolCategoryName" | "trendyolBrandId">>;
    }

    return variants.flatMap((variant) => {
      const variantNode =
        typeof variant === "object" && variant ? (variant as Record<string, unknown>) : {};
      const barcode = readText(variantNode.barcode) ?? parentBarcode;

      if (!barcode) {
        return [];
      }

      const value1 = readText(variantNode.value1);
      const value2 = readText(variantNode.value2);
      const variantSuffix = compact([value1, value2]).join("-");

      return [
        {
          sourceProductId,
          productCode,
          barcode,
          parentBarcode,
          title,
          description,
          detailHtml,
          categoryPath,
          supplierCategoryId,
          supplierBrandId,
          brandName,
          listPrice: Math.max(listPrice, salePrice),
          salePrice,
          vatRate,
          currency,
          quantity: parseInteger(variantNode.quantity, quantity),
          desi,
          imageUrls: images,
          variantName1: readText(variantNode.name1),
          variantValue1: value1,
          variantName2: readText(variantNode.name2),
          variantValue2: value2,
          productMainId,
          stockCode: truncate(
            compact([productCode, variantSuffix || barcode]).join("-") || barcode,
            100,
          ),
        },
      ] satisfies Array<Omit<SupplierFeedProductInput, "trendyolCategoryId" | "trendyolCategoryName" | "trendyolBrandId">>;
    });
  });
}

async function prepareImportRows(
  storeId: string,
  rows: Array<Omit<SupplierFeedProductInput, "trendyolCategoryId" | "trendyolCategoryName" | "trendyolBrandId">>,
) {
  const categoryCache = new Map<string, Awaited<ReturnType<typeof findCategoryMatch>>>();
  const brandCache = new Map<string, Awaited<ReturnType<typeof findBrandMatch>>>();

  async function resolveCategory(categoryPath: string | null) {
    const key = categoryPath ?? "";

    if (!categoryCache.has(key)) {
      categoryCache.set(key, await findCategoryMatch(storeId, categoryPath));
    }

    return categoryCache.get(key) ?? null;
  }

  async function resolveBrand(brandName: string | null) {
    const key = brandName ?? "";

    if (!brandCache.has(key)) {
      brandCache.set(key, await findBrandMatch(storeId, brandName));
    }

    return brandCache.get(key) ?? null;
  }

  const prepared: SupplierFeedProductInput[] = [];

  for (const row of rows) {
    const [category, brand] = await Promise.all([
      resolveCategory(row.categoryPath),
      resolveBrand(row.brandName),
    ]);

    prepared.push({
      ...row,
      trendyolCategoryId: category?.id ?? null,
      trendyolCategoryName: category?.path ?? null,
      trendyolBrandId: brand?.id ?? null,
    });
  }

  return prepared;
}

async function getLatestFeed(storeId: string) {
  return prisma.supplierFeed.findFirst({
    where: { storeId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function getSupplierFeedForStore(storeId: string) {
  return getLatestFeed(storeId);
}

export async function listSupplierFeedProducts(storeId: string, options: SupplierFeedListOptions = {}) {
  const feed = await getLatestFeed(storeId);

  if (!feed) {
    return {
      feed: null,
      items: [],
      page: 1,
      pageSize: options.pageSize ?? 24,
      total: 0,
      totalPages: 0,
      stats: {
        total: 0,
        selected: 0,
        ready: 0,
        synced: 0,
        failed: 0,
      },
    };
  }

  const pageSize = Math.min(Math.max(options.pageSize ?? 24, 1), 100);
  const page = Math.max(options.page ?? 1, 1);
  const query = options.query?.trim();
  const where = {
    storeId,
    feedId: feed.id,
    isActive: true,
    ...(query
      ? {
          OR: [
            { title: { contains: query } },
            { barcode: { contains: query } },
            { productCode: { contains: query } },
            { brandName: { contains: query } },
            { categoryPath: { contains: query } },
          ],
        }
      : {}),
  } satisfies Prisma.SupplierFeedProductWhereInput;

  const [total, items, grouped] = await Promise.all([
    prisma.supplierFeedProduct.count({ where }),
    prisma.supplierFeedProduct.findMany({
      where,
      orderBy: [{ selectedForExport: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.supplierFeedProduct.groupBy({
      by: ["exportStatus"],
      where: {
        storeId,
        feedId: feed.id,
        isActive: true,
      },
      _count: {
        exportStatus: true,
      },
    }),
  ]);

  const selected = await prisma.supplierFeedProduct.count({
    where: {
      storeId,
      feedId: feed.id,
      isActive: true,
      selectedForExport: true,
    },
  });

  const stats = {
    total,
    selected,
    ready: 0,
    synced: 0,
    failed: 0,
  };

  for (const row of grouped) {
    if (row.exportStatus === "READY") stats.ready = row._count.exportStatus;
    if (row.exportStatus === "SYNCED") stats.synced = row._count.exportStatus;
    if (row.exportStatus === "FAILED") stats.failed = row._count.exportStatus;
  }

  return {
    feed,
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    stats,
  };
}

export async function syncSupplierFeed(
  storeId: string,
  userId: string,
  input: {
    sourceUrl?: string;
    name?: string;
    defaultCargoCompanyId?: number | null;
    defaultShipmentAddressId?: number | null;
    defaultReturningAddressId?: number | null;
    defaultDeliveryDuration?: number | null;
  },
) {
  const store = await getStoreScopedToUser(storeId, userId);

  if (!store) {
    throw new Error("STORE_NOT_FOUND");
  }

  const currentFeed = await getLatestFeed(storeId);
  const sourceUrl = input.sourceUrl?.trim() || currentFeed?.sourceUrl;

  if (!sourceUrl) {
    throw new Error("XML linki zorunludur.");
  }

  const syncLog = await prisma.syncLog.create({
    data: {
      storeId,
      direction: SyncDirection.IMPORT,
      scope: SyncScope.PRODUCTS,
      status: SyncStatus.STARTED,
      metadata: {
        source: "supplier-xml",
        sourceUrl,
      },
    },
  });

  const feed = await prisma.supplierFeed.upsert({
    where: {
      storeId_sourceUrl: {
        storeId,
        sourceUrl,
      },
    },
    create: {
      storeId,
      name: input.name?.trim() || "Tedarikçi XML Feed",
      sourceUrl,
      defaultCargoCompanyId: input.defaultCargoCompanyId ?? null,
      defaultShipmentAddressId: input.defaultShipmentAddressId ?? null,
      defaultReturningAddressId: input.defaultReturningAddressId ?? null,
      defaultDeliveryDuration: input.defaultDeliveryDuration ?? null,
      status: SupplierFeedStatus.ACTIVE,
    },
    update: {
      name: input.name?.trim() || currentFeed?.name || "Tedarikçi XML Feed",
      defaultCargoCompanyId: input.defaultCargoCompanyId ?? currentFeed?.defaultCargoCompanyId ?? null,
      defaultShipmentAddressId:
        input.defaultShipmentAddressId ?? currentFeed?.defaultShipmentAddressId ?? null,
      defaultReturningAddressId:
        input.defaultReturningAddressId ?? currentFeed?.defaultReturningAddressId ?? null,
      defaultDeliveryDuration:
        input.defaultDeliveryDuration ?? currentFeed?.defaultDeliveryDuration ?? null,
      lastError: null,
      status: SupplierFeedStatus.ACTIVE,
    },
  });

  try {
    const xml = await fetchXmlSource(sourceUrl);
    const parsed = parser.parse(xml) as Record<string, unknown>;
    const sourceRows = buildSourceRows(parsed);
    const preparedRows = await prepareImportRows(storeId, sourceRows);

    await prisma.supplierFeedProduct.updateMany({
      where: { feedId: feed.id },
      data: { isActive: false },
    });

    for (let index = 0; index < preparedRows.length; index += 100) {
      const chunk = preparedRows.slice(index, index + 100);

      await prisma.$transaction(
        chunk.map((row) =>
          prisma.supplierFeedProduct.upsert({
            where: {
              feedId_barcode: {
                feedId: feed.id,
                barcode: row.barcode,
              },
            },
            create: {
              storeId,
              feedId: feed.id,
              sourceProductId: row.sourceProductId,
              productCode: row.productCode,
              barcode: row.barcode,
              parentBarcode: row.parentBarcode,
              title: row.title,
              description: row.description,
              detailHtml: row.detailHtml,
              categoryPath: row.categoryPath,
              supplierCategoryId: row.supplierCategoryId,
              supplierBrandId: row.supplierBrandId,
              brandName: row.brandName,
              listPrice: new Prisma.Decimal(row.listPrice),
              salePrice: new Prisma.Decimal(row.salePrice),
              vatRate: new Prisma.Decimal(row.vatRate),
              currency: row.currency,
              quantity: row.quantity,
              desi: new Prisma.Decimal(row.desi),
              imageUrlsJson: row.imageUrls,
              variantName1: row.variantName1,
              variantValue1: row.variantValue1,
              variantName2: row.variantName2,
              variantValue2: row.variantValue2,
              isActive: true,
              trendyolCategoryId: row.trendyolCategoryId,
              trendyolCategoryName: row.trendyolCategoryName,
              trendyolBrandId: row.trendyolBrandId,
              productMainId: row.productMainId,
              stockCode: row.stockCode,
              dimensionalWeight: new Prisma.Decimal(Math.max(row.desi, 1)),
              exportStatus: normalizeExportStatus(
                "DRAFT",
                row.trendyolCategoryId,
                row.trendyolBrandId,
              ),
              lastFetchedAt: new Date(),
            },
            update: {
              sourceProductId: row.sourceProductId,
              productCode: row.productCode,
              parentBarcode: row.parentBarcode,
              title: row.title,
              description: row.description,
              detailHtml: row.detailHtml,
              categoryPath: row.categoryPath,
              supplierCategoryId: row.supplierCategoryId,
              supplierBrandId: row.supplierBrandId,
              brandName: row.brandName,
              listPrice: new Prisma.Decimal(row.listPrice),
              salePrice: new Prisma.Decimal(row.salePrice),
              vatRate: new Prisma.Decimal(row.vatRate),
              currency: row.currency,
              quantity: row.quantity,
              desi: new Prisma.Decimal(row.desi),
              imageUrlsJson: row.imageUrls,
              variantName1: row.variantName1,
              variantValue1: row.variantValue1,
              variantName2: row.variantName2,
              variantValue2: row.variantValue2,
              isActive: true,
              trendyolCategoryId: row.trendyolCategoryId ?? undefined,
              trendyolCategoryName: row.trendyolCategoryName ?? undefined,
              trendyolBrandId: row.trendyolBrandId ?? undefined,
              productMainId: row.productMainId,
              stockCode: row.stockCode,
              dimensionalWeight: new Prisma.Decimal(Math.max(row.desi, 1)),
              exportStatus: row.trendyolCategoryId && row.trendyolBrandId ? "READY" : undefined,
              lastFetchedAt: new Date(),
            },
          }),
        ),
      );
    }

    await prisma.supplierFeed.update({
      where: { id: feed.id },
      data: {
        status: SupplierFeedStatus.ACTIVE,
        lastError: null,
        lastSyncAt: new Date(),
        lastSuccessfulSyncAt: new Date(),
      },
    });

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        finishedAt: new Date(),
        recordsSynced: preparedRows.length,
      },
    });

    await createNotification({
      userId,
      type: "SUCCESS",
      title: "XML ürünleri içe aktarıldı",
      message: `${store.name} mağazası için ${preparedRows.length} tedarikçi ürünü hazırlandı.`,
    });

    return {
      feedId: feed.id,
      importedCount: preparedRows.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "XML senkronizasyonu başarısız.";

    await prisma.supplierFeed.update({
      where: { id: feed.id },
      data: {
        status: SupplierFeedStatus.ERROR,
        lastError: message,
        lastSyncAt: new Date(),
      },
    });

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.FAILED,
        finishedAt: new Date(),
        errorMessage: message,
      },
    });

    throw error;
  }
}

export async function updateSupplierFeedProduct(
  storeId: string,
  userId: string,
  productId: string,
  input: {
    selectedForExport?: boolean;
    trendyolCategoryId?: number | null;
    trendyolBrandId?: number | null;
    trendyolCategoryName?: string | null;
    productMainId?: string | null;
    stockCode?: string | null;
    dimensionalWeight?: number | null;
    originCode?: string | null;
    attributesJson?: unknown;
  },
) {
  const store = await getStoreScopedToUser(storeId, userId);

  if (!store) {
    throw new Error("STORE_NOT_FOUND");
  }

  const product = await prisma.supplierFeedProduct.findFirst({
    where: {
      id: productId,
      storeId,
    },
  });

  if (!product) {
    throw new Error("SUPPLIER_PRODUCT_NOT_FOUND");
  }

  let attributesJson: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined;

  if (input.attributesJson !== undefined) {
    if (input.attributesJson === null || input.attributesJson === "") {
      attributesJson = Prisma.JsonNull;
    } else if (Array.isArray(input.attributesJson)) {
      attributesJson = input.attributesJson as Prisma.JsonArray;
    } else {
      throw new Error("Attributes JSON array formatında olmalıdır.");
    }
  }

  const trendyolCategoryId = input.trendyolCategoryId ?? product.trendyolCategoryId;
  const trendyolBrandId = input.trendyolBrandId ?? product.trendyolBrandId;
  const exportStatus = normalizeExportStatus(
    product.exportStatus,
    trendyolCategoryId,
    trendyolBrandId,
  );

  return prisma.supplierFeedProduct.update({
    where: { id: productId },
    data: {
      selectedForExport: input.selectedForExport ?? product.selectedForExport,
      trendyolCategoryId,
      trendyolBrandId,
      trendyolCategoryName: input.trendyolCategoryName ?? product.trendyolCategoryName,
      productMainId: input.productMainId?.trim() || product.productMainId,
      stockCode: input.stockCode?.trim() || product.stockCode,
      dimensionalWeight:
        input.dimensionalWeight !== undefined && input.dimensionalWeight !== null
          ? new Prisma.Decimal(Math.max(input.dimensionalWeight, 0.1))
          : product.dimensionalWeight,
      originCode: input.originCode?.trim() || product.originCode,
      attributesJson,
      exportStatus,
      exportMessage: null,
    },
  });
}

async function buildAttributesForExport(
  storeId: string,
  product: {
    trendyolCategoryId: number | null;
    attributesJson: Prisma.JsonValue | null;
    variantName1: string | null;
    variantValue1: string | null;
    variantName2: string | null;
    variantValue2: string | null;
  },
) {
  if (!product.trendyolCategoryId) {
    throw new Error("Trendyol kategori ID zorunludur.");
  }

  const manualAttributes = [...parseAttributesJson(product.attributesJson)];
  const attributesById = new Map<number, Record<string, unknown>>();

  for (const attribute of manualAttributes) {
    const attributeId = Number(attribute.attributeId);

    if (attributeId) {
      attributesById.set(attributeId, attribute);
    }
  }

  const categoryAttributes = await getCategoryAttributes(storeId, product.trendyolCategoryId);
  const variantPairs = [
    {
      name: product.variantName1,
      value: product.variantValue1,
    },
    {
      name: product.variantName2,
      value: product.variantValue2,
    },
  ].filter((item) => item.name && item.value);

  for (const variant of variantPairs) {
    const match = categoryAttributes.find((attribute) => {
      const attributeName = attribute.attributeName ?? "";
      return (
        attributeName.localeCompare(variant.name!, "tr-TR", { sensitivity: "base" }) === 0
      );
    });

    const attributeId = match?.attributeId;

    if (!match || !attributeId || attributesById.has(attributeId)) {
      continue;
    }

    if (match.allowCustom || match.customValue) {
      attributesById.set(attributeId, {
        attributeId,
        customAttributeValue: variant.value,
      });
      continue;
    }

    const values = await getCategoryAttributeValues(
      storeId,
      product.trendyolCategoryId,
      attributeId,
    );
    const valueMatch =
      values.find(
        (item) =>
          item.name.localeCompare(variant.value!, "tr-TR", { sensitivity: "base" }) === 0,
      ) ??
      values.find((item) =>
        item.name.toLocaleLowerCase("tr-TR").includes(variant.value!.toLocaleLowerCase("tr-TR")),
      );

    if (valueMatch) {
      attributesById.set(attributeId, {
        attributeId,
        attributeValueId: valueMatch.id,
      });
    }
  }

  const finalAttributes = Array.from(attributesById.values());
  const missingRequired = categoryAttributes
    .filter((attribute) => attribute.required && attribute.attributeId)
    .filter((attribute) => !attributesById.has(attribute.attributeId!))
    .map((attribute) => attribute.attributeName ?? `#${attribute.attributeId}`)
    .slice(0, 6);

  if (missingRequired.length) {
    throw new Error(
      `Zorunlu kategori özellikleri eksik: ${missingRequired.join(", ")}. Ürünü düzenleyip attributes alanını tamamlayın.`,
    );
  }

  return finalAttributes;
}

async function buildExportItem(
  storeId: string,
  feed: {
    defaultCargoCompanyId: number | null;
    defaultShipmentAddressId: number | null;
    defaultReturningAddressId: number | null;
    defaultDeliveryDuration: number | null;
  },
  product: Awaited<ReturnType<typeof prisma.supplierFeedProduct.findMany>>[number],
) {
  if (!feed.defaultCargoCompanyId) {
    throw new Error("Varsayılan kargo firması ID zorunludur.");
  }

  if (!product.trendyolCategoryId) {
    throw new Error("Trendyol kategori ID zorunludur.");
  }

  if (!product.trendyolBrandId) {
    throw new Error("Trendyol marka ID zorunludur.");
  }

  const images = Array.isArray(product.imageUrlsJson)
    ? product.imageUrlsJson
        .map((value) => (typeof value === "string" ? value : null))
        .filter((value): value is string => Boolean(value?.startsWith("https://")))
    : [];

  if (!images.length) {
    throw new Error("En az bir HTTPS görsel URL’i gereklidir.");
  }

  const attributes = await buildAttributesForExport(storeId, product);
  const item: TrendyolCreateProductItem = {
    barcode: truncate(product.barcode.replaceAll(" ", ""), 40),
    title: truncate(product.title, 100),
    description: buildDescription(product.detailHtml, product.description),
    productMainId: truncate(product.productMainId ?? product.productCode ?? product.barcode, 40),
    brandId: product.trendyolBrandId,
    categoryId: product.trendyolCategoryId,
    quantity: Math.max(product.quantity, 0),
    stockCode: truncate(product.stockCode ?? product.productCode ?? product.barcode, 100),
    dimensionalWeight: Math.max(toNumber(product.dimensionalWeight), 0.1),
    currencyType: product.currency || "TRY",
    listPrice: Math.max(toNumber(product.listPrice), toNumber(product.salePrice)),
    salePrice: toNumber(product.salePrice),
    vatRate: Math.max(0, Math.round(toNumber(product.vatRate))),
    cargoCompanyId: feed.defaultCargoCompanyId,
    images: images.map((url) => ({ url })),
    attributes,
    origin: truncate(product.originCode || "TR", 2),
  };

  if (feed.defaultShipmentAddressId) {
    item.shipmentAddressId = feed.defaultShipmentAddressId;
  }

  if (feed.defaultReturningAddressId) {
    item.returningAddressId = feed.defaultReturningAddressId;
  }

  if (feed.defaultDeliveryDuration) {
    item.deliveryOption = {
      deliveryDuration: feed.defaultDeliveryDuration,
    };
  }

  return item;
}

async function pollBatchResult(storeId: string, batchRequestId: string) {
  const credentials = await getTrendyolCredentials(storeId);
  const client = new TrendyolClient(
    credentials.environment,
    buildTrendyolHeaders(credentials),
  );

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await client.request<TrendyolBatchResult>(
      `/integration/product/sellers/${credentials.supplierId}/products/batch-requests/${batchRequestId}`,
    );

    if (response.status === "COMPLETED" || attempt === 3) {
      return response;
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }

  return null;
}

export async function pushSupplierFeedProductsToTrendyol(
  storeId: string,
  userId: string,
  input: {
    productIds?: string[];
    selectedOnly?: boolean;
  },
) {
  const store = await getStoreScopedToUser(storeId, userId);

  if (!store) {
    throw new Error("STORE_NOT_FOUND");
  }

  const feed = await getLatestFeed(storeId);

  if (!feed) {
    throw new Error("Önce XML feed bağlantısı kurun.");
  }

  const syncLog = await prisma.syncLog.create({
    data: {
      storeId,
      direction: SyncDirection.EXPORT,
      scope: SyncScope.PRODUCTS,
      status: SyncStatus.STARTED,
      metadata: {
        source: "supplier-xml",
        feedId: feed.id,
      },
    },
  });

  try {
    const products = await prisma.supplierFeedProduct.findMany({
      where: {
        storeId,
        feedId: feed.id,
        isActive: true,
        ...(input.productIds?.length
          ? {
              id: {
                in: input.productIds,
              },
            }
          : input.selectedOnly
            ? { selectedForExport: true }
            : {}),
      },
      orderBy: [{ selectedForExport: "desc" }, { updatedAt: "desc" }],
      take: 100,
    });

    if (!products.length) {
      throw new Error("Aktarılacak ürün seçilmedi.");
    }

    const items: TrendyolCreateProductItem[] = [];
    const errorsById = new Map<string, string>();

    for (const product of products) {
      try {
        const item = await buildExportItem(storeId, feed, product);
        items.push(item);
      } catch (error) {
        errorsById.set(
          product.id,
          error instanceof Error ? error.message : "Ürün hazırlanamadı.",
        );
      }
    }

    if (!items.length) {
      const failedIds = Array.from(errorsById.keys());

      await prisma.$transaction(
        failedIds.map((id) =>
          prisma.supplierFeedProduct.update({
            where: { id },
            data: {
              exportStatus: SupplierProductExportStatus.FAILED,
              exportMessage: errorsById.get(id),
            },
          }),
        ),
      );

      throw new Error("Seçilen ürünlerin hiçbiri Trendyol’a gönderilemedi.");
    }

    const credentials = await getTrendyolCredentials(storeId);
    const client = new TrendyolClient(
      credentials.environment,
      buildTrendyolHeaders(credentials),
    );

    const response = await client.request<{ batchRequestId: string }>(
      `/integration/product/sellers/${credentials.supplierId}/v2/products`,
      {
        method: "POST",
        body: JSON.stringify({ items }),
      },
    );

    const batchRequestId = response.batchRequestId;
    const now = new Date();

    await prisma.$transaction(
      products.map((product) =>
        prisma.supplierFeedProduct.update({
          where: { id: product.id },
          data: errorsById.has(product.id)
            ? {
                exportStatus: SupplierProductExportStatus.FAILED,
                exportMessage: errorsById.get(product.id),
              }
            : {
                exportStatus: SupplierProductExportStatus.QUEUED,
                exportMessage: `Batch kuyruğuna alındı: ${batchRequestId}`,
                lastExportedAt: now,
              },
        }),
      ),
    );

    const batchResult = batchRequestId ? await pollBatchResult(storeId, batchRequestId) : null;

    if (batchResult?.items?.length) {
      const itemStatusByBarcode = new Map(
        batchResult.items.map((item) => {
          const barcode = item.requestItem?.product?.barcode ?? item.requestItem?.barcode ?? "";
          const failureMessage = item.failureReasons
            ?.map((failure) => failure.message)
            .filter(Boolean)
            .join(" | ");

          return [
            barcode,
            {
              status: item.status,
              failureMessage,
            },
          ] as const;
        }),
      );

      await prisma.$transaction(
        products
          .filter((product) => itemStatusByBarcode.has(product.barcode))
          .map((product) => {
            const batchItem = itemStatusByBarcode.get(product.barcode)!;
            const success = batchItem.status === "SUCCESS";

            return prisma.supplierFeedProduct.update({
              where: { id: product.id },
              data: {
                exportStatus: success
                  ? SupplierProductExportStatus.SYNCED
                  : SupplierProductExportStatus.FAILED,
                exportMessage: success
                  ? `Trendyol batch aktarımı tamamlandı. Batch: ${batchRequestId}`
                  : batchItem.failureMessage || "Trendyol ürün aktarımı reddedildi.",
                selectedForExport: success ? false : product.selectedForExport,
                lastExportedAt: new Date(),
              },
            });
          }),
      );
    }

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.SUCCESS,
        finishedAt: new Date(),
        recordsSynced: items.length,
        metadata: {
          source: "supplier-xml",
          batchRequestId,
        },
      },
    });

    await createNotification({
      userId,
      type: "SUCCESS",
      title: "XML ürünleri Trendyol’a gönderildi",
      message: `${store.name} mağazası için ${items.length} ürün batch kuyruğuna gönderildi.`,
    });

    return {
      batchRequestId,
      queued: items.length,
      failedToPrepare: errorsById.size,
      batchStatus: batchResult?.status ?? "IN_PROGRESS",
    };
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Ürün aktarımı başarısız.";
    const message = formatTrendyolError(rawMessage);

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        status: SyncStatus.FAILED,
        finishedAt: new Date(),
        errorMessage: message,
      },
    });

    throw new Error(message);
  }
}

export async function listSupplierFeedProductsForApi(
  storeId: string,
  options: SupplierFeedListOptions = {},
) {
  const result = await listSupplierFeedProducts(storeId, options);

  return {
    ...result,
    items: result.items.map((product) => ({
      ...product,
      listPrice: toNumber(product.listPrice),
      salePrice: toNumber(product.salePrice),
      vatRate: toNumber(product.vatRate),
      desi: toNumber(product.desi),
      dimensionalWeight: toNumber(product.dimensionalWeight),
    })),
  };
}
