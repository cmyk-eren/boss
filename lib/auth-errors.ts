export function formatAuthError(error: unknown, fallbackMessage: string) {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const message = error.message.trim();
  const loweredMessage = message.toLowerCase();

  if (
    loweredMessage.includes("pool timeout") ||
    loweredMessage.includes("failed to retrieve a connection") ||
    loweredMessage.includes("connect econnrefused") ||
    loweredMessage.includes("connect etimedout") ||
    loweredMessage.includes("can't connect to mysql")
  ) {
    return "Veritabani baglantisi kurulamadigi icin islem tamamlanamadi. Hosting ortamindaki DATABASE_URL bilgisini ve MySQL erisim ayarlarini kontrol edin.";
  }

  if (loweredMessage.includes("unknown database")) {
    return "Veritabani bulunamadi. Hostinger MySQL veritabani adini ve DATABASE_URL ayarini kontrol edin.";
  }

  return message || fallbackMessage;
}
