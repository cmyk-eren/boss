import { NextResponse } from "next/server";

import { loginUser } from "@/services/auth-service";

export async function POST(request: Request) {
  const formData = await request.formData();

  try {
    await loginUser(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
    return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Giriş başarısız.";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }
}
