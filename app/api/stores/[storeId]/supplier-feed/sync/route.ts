import { NextResponse } from "next/server";

import { requireApiUser } from "@/services/auth-service";
import { getStoreScopedToUser } from "@/services/store-service";
import { syncSupplierFeed } from "@/services/supplier-xml-service";

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function optionalNumber(value: unknown) {
  const raw = optionalString(value);
  return raw === undefined ? undefined : Number(raw);
}

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

    const contentType = request.headers.get("content-type") || "";

    let body:
      | Record<string, FormDataEntryValue | null | undefined>
      | Record<string, unknown>;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const xmlFile = formData.get("xmlFile");
      const uploadedXml =
        xmlFile instanceof File && xmlFile.size > 0 ? await xmlFile.text() : undefined;

      body = {
        name: formData.get("name"),
        sourceUrl: formData.get("sourceUrl"),
        xmlContent: uploadedXml || formData.get("xmlContent"),
        defaultCargoCompanyId: formData.get("defaultCargoCompanyId"),
        defaultShipmentAddressId: formData.get("defaultShipmentAddressId"),
        defaultReturningAddressId: formData.get("defaultReturningAddressId"),
        defaultDeliveryDuration: formData.get("defaultDeliveryDuration"),
      };
    } else {
      body = await request.json();
    }

    const result = await syncSupplierFeed(storeId, user.id, {
      sourceUrl: optionalString(body.sourceUrl),
      xmlContent: optionalString(body.xmlContent),
      name: optionalString(body.name),
      defaultCargoCompanyId: optionalNumber(body.defaultCargoCompanyId),
      defaultShipmentAddressId: optionalNumber(body.defaultShipmentAddressId),
      defaultReturningAddressId: optionalNumber(body.defaultReturningAddressId),
      defaultDeliveryDuration: optionalNumber(body.defaultDeliveryDuration),
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "XML senkronizasyonu başarısız.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
