export function formatTrendyolError(raw: string) {
  try {
    const parsed = JSON.parse(raw) as {
      message?: string;
      exception?: string;
      errors?: Array<{
        key?: string;
        message?: string;
        errorCode?: string;
      }>;
    };

    const firstError = parsed.errors?.[0];

    if (firstError?.key === "storeFrontCode" || firstError?.message === "invalid storefrontCode") {
      return "Geçersiz storeFrontCode. Trendyol Seller Panel içindeki mağaza bölge kodunu girin. Resmi uluslararası storefront kodları arasında DE, SA, AE, GR, SK, RO, CZ, BG ve KW bulunur.";
    }

    if (firstError?.errorCode === "INVALID_SIZE" || firstError?.key === "approved.products.filter.size.invalid") {
      return "Trendyol senkronizasyon isteği reddedildi: ürün listeleme sayfa boyutu sınırı aşıldı. Uygulama tarafında düzeltildi; senkronizasyonu tekrar çalıştırabilirsiniz.";
    }

    if (firstError?.message) {
      return `Trendyol doğrulaması başarısız: ${firstError.message}`;
    }

    if (parsed.message) {
      return parsed.message;
    }

    if (parsed.exception) {
      return `Trendyol isteği başarısız: ${parsed.exception}`;
    }
  } catch {
    return raw;
  }

  return raw;
}
