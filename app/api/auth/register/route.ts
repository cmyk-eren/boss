import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { registerUser } from "@/services/auth-service";

export async function POST(request: Request) {
  const formData = await request.formData();

  try {
    const user = await registerUser({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      name: String(formData.get("name") ?? "") || undefined,
    });

    const timezone = String(formData.get("timezone") ?? "");
    if (timezone) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          timezone,
        },
      });
    }

    return NextResponse.redirect(new URL("/dashboard", request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kayıt başarısız.";
    return NextResponse.redirect(
      new URL(`/register?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }
}
