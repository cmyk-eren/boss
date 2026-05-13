import { parseRange } from "@/lib/date-range";
import { listNotifications } from "@/services/notification-service";
import { listStoresForUser } from "@/services/store-service";

export type AppSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getPageContext(
  userId: string,
  searchParamsPromise?: Promise<AppSearchParams>,
) {
  const [stores, notifications, searchParams] = await Promise.all([
    listStoresForUser(userId),
    listNotifications(userId),
    searchParamsPromise ?? Promise.resolve({} as AppSearchParams),
  ]);

  const selectedStoreId = firstValue(searchParams.storeId);
  const activeStore = stores.find((store) => store.id === selectedStoreId) ?? stores[0];
  const range = parseRange(firstValue(searchParams.range));

  return {
    stores,
    notifications,
    notificationCount: notifications.filter((item) => !item.isRead).length,
    activeStore,
    activeStoreId: activeStore?.id,
    range,
    searchParams,
  };
}
