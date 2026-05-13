import { NextResponse } from "next/server";

import { buildAppUrl } from "@/lib/env";
import { clearSession } from "@/services/auth-service";

export async function POST() {
  await clearSession();
  return NextResponse.redirect(buildAppUrl("/login"), 303);
}
