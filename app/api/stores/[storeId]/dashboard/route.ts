import { NextRequest, NextResponse } from "next/server";

import { parseRange } from "@/lib/date-range";
import { getDashboardData } from "@/services/dashboard-service";
import { requireApiUser } from "@/services/auth-service";
import { getStoreScopedToUser } from "@/services/store-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const user = await requireApiUser();
    const { storeId } = await params;
    const store = await getStoreScopedToUser(storeId, user.id);

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const range = parseRange(request.nextUrl.searchParams.get("range") ?? undefined);
    const dashboard = await getDashboardData(storeId, range);
    return NextResponse.json(dashboard);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
