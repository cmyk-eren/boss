import { getTrendyolCredentials, buildTrendyolHeaders } from "@/services/trendyol-auth";
import { TrendyolClient } from "@/services/trendyol-client";

type TrendyolCategoryNode = {
  id: number;
  name: string;
  subCategories?: TrendyolCategoryNode[];
};

type TrendyolBrand = {
  id: number;
  name: string;
};

type TrendyolCategoryAttribute = {
  attributeId?: number;
  attributeName?: string;
  required?: boolean;
  allowCustom?: boolean;
  customValue?: boolean;
  varianter?: boolean;
  slicer?: boolean;
  allowMultipleAttributeValues?: boolean;
  attributeValues?: Array<{
    id?: number;
    attributeValueId?: number;
    name?: string;
    attributeValue?: string;
  }>;
};

type TrendyolCategoryAttributesResponse = {
  categoryAttributes?: TrendyolCategoryAttribute[];
};

type TrendyolAttributeValuesResponse = {
  content?: Array<{
    attributeValueId?: number;
    attributeValue?: string;
  }>;
};

type FlattenedCategory = {
  id: number;
  name: string;
  path: string;
};

const categoryCache = new Map<string, Promise<FlattenedCategory[]>>();
const brandCache = new Map<string, Promise<TrendyolBrand | null>>();
const attributeCache = new Map<string, Promise<TrendyolCategoryAttribute[]>>();
const attributeValueCache = new Map<string, Promise<Array<{ id: number; name: string }>>>();

export const TRENDYOL_CARGO_COMPANIES = [
  { id: 38, code: "SENDEOMP", name: "Kolay Gelsin Marketplace" },
  { id: 30, code: "CEVATEDARIK", name: "Ceva Tedarik Marketplace" },
  { id: 10, code: "DHLECOMMP", name: "DHL eCommerce Marketplace" },
  { id: 19, code: "PTTMP", name: "PTT Kargo Marketplace" },
  { id: 9, code: "SURATMP", name: "Sürat Kargo Marketplace" },
  { id: 17, code: "TEXMP", name: "Trendyol Express Marketplace" },
  { id: 6, code: "HOROZMP", name: "Horoz Kargo Marketplace" },
  { id: 20, code: "CEVAMP", name: "CEVA Marketplace" },
  { id: 4, code: "YKMP", name: "Yurtiçi Kargo Marketplace" },
  { id: 7, code: "ARASMP", name: "Aras Kargo Marketplace" },
  { id: 33, code: "MNGMP", name: "MNG Kargo Marketplace" },
] as const;

function normalizeLabel(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "c")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function flattenCategories(
  nodes: TrendyolCategoryNode[],
  parents: string[] = [],
): FlattenedCategory[] {
  return nodes.flatMap((node) => {
    const path = [...parents, node.name].join(" > ");

    if (!node.subCategories?.length) {
      return [{ id: node.id, name: node.name, path }];
    }

    return flattenCategories(node.subCategories, [...parents, node.name]);
  });
}

async function getCatalogClient(storeId: string) {
  const credentials = await getTrendyolCredentials(storeId);

  return {
    credentials,
    client: new TrendyolClient(
      credentials.environment,
      buildTrendyolHeaders(credentials),
    ),
  };
}

async function getFlattenedCategories(storeId: string) {
  const cacheKey = `categories:${storeId}`;

  if (!categoryCache.has(cacheKey)) {
    categoryCache.set(
      cacheKey,
      (async () => {
        const { client } = await getCatalogClient(storeId);
        const tree = await client.request<
          TrendyolCategoryNode[] | { categories?: TrendyolCategoryNode[] }
        >(
          "/integration/product/product-categories",
        );
        const categories = Array.isArray(tree) ? tree : tree.categories ?? [];
        return flattenCategories(categories);
      })(),
    );
  }

  return categoryCache.get(cacheKey)!;
}

function pickBestCategoryMatch(
  categories: FlattenedCategory[],
  categoryPath: string,
) {
  const pathParts = categoryPath
    .split(">>>")
    .map((segment) => segment.trim())
    .filter(Boolean);
  const lastSegment = pathParts.at(-1) ?? categoryPath;
  const normalizedLast = normalizeLabel(lastSegment);
  const normalizedPath = normalizeLabel(pathParts.join(" "));

  const exactLeaf = categories.find(
    (category) => normalizeLabel(category.name) === normalizedLast,
  );

  if (exactLeaf) {
    return exactLeaf;
  }

  const exactPath = categories.find(
    (category) => normalizeLabel(category.path) === normalizedPath,
  );

  if (exactPath) {
    return exactPath;
  }

  const includesLeaf = categories.filter((category) =>
    normalizeLabel(category.path).includes(normalizedLast),
  );

  return includesLeaf.length === 1 ? includesLeaf[0] : null;
}

export async function findCategoryMatch(storeId: string, categoryPath: string | null) {
  if (!categoryPath) {
    return null;
  }

  const categories = await getFlattenedCategories(storeId);
  return pickBestCategoryMatch(categories, categoryPath);
}

export async function findBrandMatch(storeId: string, brandName: string | null) {
  if (!brandName?.trim()) {
    return null;
  }

  const searchVariants = [
    brandName.trim(),
    brandName.trim().toLocaleUpperCase("tr-TR"),
  ];

  for (const name of searchVariants) {
    const cacheKey = `brand:${storeId}:${name}`;

    if (!brandCache.has(cacheKey)) {
      brandCache.set(
        cacheKey,
        (async () => {
          const { client } = await getCatalogClient(storeId);
          const response = await client.request<TrendyolBrand[]>(
            "/integration/product/brands/by-name",
            {
              query: { name },
            },
          );

          const brands = Array.isArray(response) ? response : [];
          const normalizedTarget = normalizeLabel(brandName);

          return (
            brands.find((brand) => normalizeLabel(brand.name) === normalizedTarget) ??
            brands[0] ??
            null
          );
        })(),
      );
    }

    const match = await brandCache.get(cacheKey)!;

    if (match) {
      return match;
    }
  }

  return null;
}

export async function getCategoryAttributes(storeId: string, categoryId: number) {
  const cacheKey = `attributes:${storeId}:${categoryId}`;

  if (!attributeCache.has(cacheKey)) {
    attributeCache.set(
      cacheKey,
      (async () => {
        const { client, credentials } = await getCatalogClient(storeId);
        const response = await client.request<TrendyolCategoryAttributesResponse>(
          `/integration/ecgw/v1/${credentials.supplierId}/lookup/product-categories/${categoryId}/attributes`,
        );

        return response.categoryAttributes ?? [];
      })(),
    );
  }

  return attributeCache.get(cacheKey)!;
}

export async function getCategoryAttributeValues(
  storeId: string,
  categoryId: number,
  attributeId: number,
) {
  const cacheKey = `attribute-values:${storeId}:${categoryId}:${attributeId}`;

  if (!attributeValueCache.has(cacheKey)) {
    attributeValueCache.set(
      cacheKey,
      (async () => {
        const { client } = await getCatalogClient(storeId);
        const response = await client.request<TrendyolAttributeValuesResponse>(
          `/integration/product/categories/${categoryId}/attributes/${attributeId}/values`,
          {
            query: { page: 0, size: 1000 },
          },
        );

        return (response.content ?? [])
          .map((item) => ({
            id: item.attributeValueId ?? 0,
            name: item.attributeValue ?? "",
          }))
          .filter((item) => item.id && item.name);
      })(),
    );
  }

  return attributeValueCache.get(cacheKey)!;
}

export type TrendyolCategoryAttributeInfo = Awaited<
  ReturnType<typeof getCategoryAttributes>
>[number];
