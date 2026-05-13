import { TrendyolEnvironment } from "@prisma/client";

import { decryptString } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export async function getTrendyolCredentials(storeId: string) {
  const integration = await prisma.trendyolIntegration.findUnique({
    where: { storeId },
    include: { store: true },
  });

  if (!integration) {
    throw new Error("TRENDYOL_INTEGRATION_NOT_FOUND");
  }

  return {
    environment: integration.environment,
    supplierId: integration.store.supplierId,
    storeFrontCode: integration.store.storeFrontCode,
    apiKey: decryptString(integration.apiKeyEncrypted),
    apiSecret: decryptString(integration.apiSecretEncrypted),
  };
}

export function getTrendyolBaseUrl(environment: TrendyolEnvironment) {
  return environment === "STAGE"
    ? "https://stageapigw.trendyol.com"
    : "https://apigw.trendyol.com";
}

export function buildTrendyolHeaders(input: {
  supplierId: string;
  storeFrontCode?: string | null;
  apiKey: string;
  apiSecret: string;
}) {
  const authorization = Buffer.from(`${input.apiKey}:${input.apiSecret}`).toString(
    "base64",
  );

  return {
    Authorization: `Basic ${authorization}`,
    "User-Agent": `${input.supplierId} - BOSS`,
    "Content-Type": "application/json",
    ...(input.storeFrontCode ? { storeFrontCode: input.storeFrontCode } : {}),
  };
}
