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

  if (
    loweredMessage.includes("does not exist in the current database") ||
    loweredMessage.includes("table `user` doesn't exist") ||
    loweredMessage.includes("table 'user' doesn't exist") ||
    loweredMessage.includes("table user does not exist")
  ) {
    return "Veritabani baglantisi kuruldu ancak uygulama tablolari henuz olusmamis. Deploy oncesi Prisma tablolarinin olusturulmasi gerekiyor.";
  }

  return message || fallbackMessage;
}
