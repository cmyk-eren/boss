import { TrendyolEnvironment } from "@prisma/client";

import { getTrendyolBaseUrl } from "@/services/trendyol-auth";

const requestWindow = new Map<string, number[]>();

async function enforceRateLimit(key: string) {
  const now = Date.now();
  const history = requestWindow.get(key) ?? [];
  const active = history.filter((timestamp) => now - timestamp < 10_000);

  if (active.length >= 45) {
    const waitMs = 10_000 - (now - active[0]) + 50;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    return enforceRateLimit(key);
  }

  active.push(now);
  requestWindow.set(key, active);
}

export class TrendyolClient {
  constructor(
    private readonly environment: TrendyolEnvironment,
    private readonly headers: Record<string, string>,
  ) {}

  private getUrl(path: string) {
    return `${getTrendyolBaseUrl(this.environment)}${path}`;
  }

  async request<T>(
    path: string,
    init: RequestInit & { query?: Record<string, string | number | undefined> } = {},
  ) {
    const url = new URL(this.getUrl(path));

    if (init.query) {
      Object.entries(init.query).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, String(value));
        }
      });
    }

    await enforceRateLimit(`${init.method ?? "GET"}:${path}`);

    let lastError: unknown;

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(url, {
        ...init,
        headers: {
          ...this.headers,
          ...(init.headers ?? {}),
        },
        cache: "no-store",
      });

      if (response.ok) {
        if (response.status === 204) {
          return null as T;
        }

        return (await response.json()) as T;
      }

      if (response.status === 429 || response.status >= 500) {
        lastError = await response.text();
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(2 ** attempt * 750, 6_000)),
        );
        continue;
      }

      throw new Error(await response.text());
    }

    throw new Error(
      typeof lastError === "string"
        ? lastError
        : "Trendyol isteği tekrar denemelere rağmen başarısız oldu.",
    );
  }
}
