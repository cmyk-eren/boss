# Mavikon Trendyol Paneli

Trendyol saticilari icin gelistirilmis, gercek veri odakli Next.js SaaS paneli.

## Teknoloji

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma ORM
- MySQL
- Recharts

## Ortam Degiskenleri

`.env` icine asgari olarak su degerleri girilmelidir:

```env
DATABASE_URL="mysql://DB_USER:DB_PASSWORD@HOST:3306/DB_NAME"
AUTH_SECRET="uzun-ve-rastgele-bir-secret"
ENCRYPTION_KEY="uzun-ve-rastgele-bir-sifreleme-anahtari"
NEXT_PUBLIC_APP_URL="https://alanadiniz.com"
CRON_SECRET="uzun-ve-rastgele-bir-cron-secret"
```

## Gelistirme

```bash
npm install
npm run db:push
npm run dev
```

## Production Veritabani

Bu proje Hostinger Web Uygulama Hosting uyumlu olacak sekilde MySQL-first yapida hazirlanmistir.

- Ilk kurulumda: `npm run db:push`
- Migration tabanli kurulumda: `npm run db:migrate`

## Deploy

Hostinger icin ayrintili kurulum adimlari:

- [HOSTINGER_DEPLOY.md](./HOSTINGER_DEPLOY.md)
