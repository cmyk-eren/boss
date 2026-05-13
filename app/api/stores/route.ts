import { NextResponse } from "next/server";

import { requireApiUser } from "@/services/auth-service";
import { listStoresForUser } from "@/services/store-service";

export async function GET() {
  try {
    const user = await requireApiUser();
    const stores = await listStoresForUser(user.id);

    return NextResponse.json(stores);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
