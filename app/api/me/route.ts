import { NextResponse } from "next/server";

import { requireApiUser } from "@/services/auth-service";

export async function GET() {
  try {
    const user = await requireApiUser();

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      timezone: user.timezone,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
