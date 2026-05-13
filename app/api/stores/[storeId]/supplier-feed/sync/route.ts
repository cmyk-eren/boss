import { NextResponse } from "next/server";

import { requireApiUser } from "@/services/auth-service";
import { getStoreScopedToUser } from "@/services/store-service";
import { syncSupplierFeed } from "@/services/supplier-xml-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const user = await requireApiUser();
    const { storeId } = await params;
    const store = await getStoreScopedToUser(storeId, user.id);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const body = await request.json();
    const result = await syncSupplierFeed(storeId, user.id, {
      sourceUrl: typeof body.sourceUrl === "string" ? body.sourceUrl : undefined,
      name: typeof body.name === "string" ? body.name : undefined,
      defaultCargoCompanyId:
        body.defaultCargoCompanyId === null || body.defaultCargoCompanyId === undefined
          ? undefined
          : Number(body.defaultCargoCompanyId),
      defaultShipmentAddressId:
        body.defaultShipmentAddressId === null || body.defaultShipmentAddressId === undefined
          ? undefined
          : Number(body.defaultShipmentAddressId),
      defaultReturningAddressId:
        body.defaultReturningAddressId === null || body.defaultReturningAddressId === undefined
          ? undefined
          : Number(body.defaultReturningAddressId),
      defaultDeliveryDuration:
        body.defaultDeliveryDuration === null || body.defaultDeliveryDuration === undefined
          ? undefined
          : Number(body.defaultDeliveryDuration),
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "XML senkronizasyonu başarısız.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
