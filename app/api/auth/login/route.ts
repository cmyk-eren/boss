import { NextResponse } from "next/server";

import { formatAuthError } from "@/lib/auth-errors";
import { buildAppUrl } from "@/lib/env";
import { loginUser } from "@/services/auth-service";

export async function POST(request: Request) {
  const formData = await request.formData();

  try {
    await loginUser(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
    return NextResponse.redirect(buildAppUrl("/dashboard"), 303);
  } catch (error) {
    const message = formatAuthError(error, "Giris basarisiz.");
    return NextResponse.redirect(
      buildAppUrl(`/login?error=${encodeURIComponent(message)}`),
      303,
    );
  }
}
