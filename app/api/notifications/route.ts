import { NextResponse } from "next/server";

import { requireApiUser } from "@/services/auth-service";
import { listNotifications } from "@/services/notification-service";

export async function GET() {
  try {
    const user = await requireApiUser();
    const notifications = await listNotifications(user.id);
    return NextResponse.json(notifications);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
