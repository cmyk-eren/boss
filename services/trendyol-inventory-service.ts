import { getStoreScopedToUser } from "@/services/store-service";
import { buildTrendyolHeaders, getTrendyolCredentials } from "@/services/trendyol-auth";
import { TrendyolClient } from "@/services/trendyol-client";

export async function updateInventoryAndPrice(
  storeId: string,
  userId: string,
  items: Array<{
    barcode: string;
    quantity: number;
    salePrice: number;
    listPrice?: number;
  }>,
) {
  const store = await getStoreScopedToUser(storeId, userId);

  if (!store) {
    throw new Error("STORE_NOT_FOUND");
  }

  const credentials = await getTrendyolCredentials(storeId);
  const client = new TrendyolClient(
    credentials.environment,
    buildTrendyolHeaders(credentials),
  );

  return client.request<{ batchRequestId: string }>(
    `/integration/inventory/sellers/${credentials.supplierId}/products/price-and-inventory`,
    {
      method: "POST",
      body: JSON.stringify({
        items,
      }),
    },
  );
}
