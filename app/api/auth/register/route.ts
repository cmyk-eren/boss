import { NextResponse } from "next/server";

import { formatAuthError } from "@/lib/auth-errors";
import { buildAppUrl } from "@/lib/env";
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

    return NextResponse.redirect(buildAppUrl("/dashboard"), 303);
  } catch (error) {
    console.error("[BOSS] Register failed:", error);
    const message = formatAuthError(error, "Kayit basarisiz.");
    return NextResponse.redirect(
      buildAppUrl(`/register?error=${encodeURIComponent(message)}`),
      303,
    );
  }
}
