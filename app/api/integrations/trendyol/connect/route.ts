import { TrendyolEnvironment } from "@prisma/client";
import { NextResponse } from "next/server";

import { formatTrendyolError } from "@/lib/trendyol-errors";
import { createNotification } from "@/services/notification-service";
import { requireApiUser } from "@/services/auth-service";
import { connectTrendyolStore } from "@/services/store-service";
import { buildTrendyolHeaders } from "@/services/trendyol-auth";
import { TrendyolClient } from "@/services/trendyol-client";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const formData = await request.formData();

    const name = String(formData.get("name") ?? "");
    const supplierId = String(formData.get("supplierId") ?? "");
    const apiKey = String(formData.get("apiKey") ?? "");
    const apiSecret = String(formData.get("apiSecret") ?? "");
    const storeFrontCode = String(formData.get("storeFrontCode") ?? "").trim().toUpperCase();
    const environment =
      String(formData.get("environment") ?? "PROD") === "STAGE" ? "STAGE" : "PROD";

    const client = new TrendyolClient(
      environment as TrendyolEnvironment,
      buildTrendyolHeaders({
        supplierId,
        storeFrontCode: storeFrontCode || undefined,
        apiKey,
        apiSecret,
      }),
    );

    await client.request(`/integration/order/sellers/${supplierId}/orders`, {
      query: {
        page: 0,
        size: 1,
      },
    });

    const store = await connectTrendyolStore({
      userId: user.id,
      name,
      supplierId,
      apiKey,
      apiSecret,
      storeFrontCode: storeFrontCode || undefined,
      environment: environment as TrendyolEnvironment,
    });

    await createNotification({
      userId: user.id,
      type: "SUCCESS",
      title: "Trendyol mağazası bağlandı",
      message: `${name} mağazası başarıyla bağlandı.`,
    });

    return NextResponse.redirect(
      new URL(`/integrations/trendyol?storeId=${store.id}`, request.url),
      303,
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? formatTrendyolError(error.message)
        : "Trendyol bağlantısı doğrulanamadı.";
    return NextResponse.redirect(
      new URL(`/integrations/trendyol?error=${encodeURIComponent(message)}`, request.url),
      303,
    );
  }
}
