import { NextRequest, NextResponse } from "next/server";

import { requireApiUser } from "@/services/auth-service";
import { listStoresForUser } from "@/services/store-service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireApiUser();
    const storeId = request.nextUrl.searchParams.get("storeId");
    const stores = await listStoresForUser(user.id);

    if (storeId) {
      const store = stores.find((item) => item.id === storeId);
      return NextResponse.json(store ?? null);
    }

    return NextResponse.json(stores);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
