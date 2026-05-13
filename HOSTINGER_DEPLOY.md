# Hostinger Deploy Rehberi

Bu proje Hostinger `Web Uygulama Hosting` uzerinde `Node.js Web App` olarak calistirilmak uzere hazirlanmistir.

## 1. Veritabani Olustur

Hostinger hPanel icinde:

1. `Websiteler`
2. ilgili domain
3. `Veritabanlari`
4. `MySQL Veritabanlari`

Su bilgileri not edin:

- host
- port
- database name
- user
- password

## 2. DATABASE_URL Hazirla

Ornek:

```env
DATABASE_URL="mysql://DB_USER:DB_PASSWORD@HOST:3306/DB_NAME"
```

Sifrede `@`, `#`, `%` gibi karakter varsa URL encode edilmelidir.

## 3. Kodu GitHub'a Yukle

Tavsiye edilen deploy modeli:

- GitHub repo
- Hostinger Git entegrasyonu

## 4. Hostinger Web App Kur

Hostinger panelinde:

1. `Websiteler`
2. `Paneli Yonet`
3. `Web Uygulama`
4. `Node.js`
5. Repo bagla

Onerilen ayarlar:

- Node.js: `20.x` veya `22.x`
- Build command: `npm run build`
- Start command: `npm run start`

## 5. Environment Variables

Hostinger paneline su degerleri ekleyin:

```env
DATABASE_URL=mysql://DB_USER:DB_PASSWORD@HOST:3306/DB_NAME
AUTH_SECRET=uzun-ve-rastgele-bir-secret
ENCRYPTION_KEY=uzun-ve-rastgele-bir-sifreleme-anahtari
NEXT_PUBLIC_APP_URL=https://alanadiniz.com
CRON_SECRET=uzun-ve-rastgele-bir-cron-secret
DATABASE_CONNECTION_LIMIT=10
DATABASE_CONNECT_TIMEOUT_MS=5000
DATABASE_ACQUIRE_TIMEOUT_MS=10000
DATABASE_IDLE_TIMEOUT_MS=1800000
```

## 6. Ilk Veritabani Kurulumu

Deploy sonrasi terminal veya startup komutu asamasinda bir kez:

```bash
npm run db:push
```

Eger migration klasorleri ile ilerliyorsaniz:

```bash
npm run db:migrate
```

## 7. Cron Senkronizasyonu

Bu endpoint:

`/api/cron/trendyol-sync`

`x-cron-secret` header'i ister.

Hostinger cron ornegi:

```bash
curl -X POST https://alanadiniz.com/api/cron/trendyol-sync -H "x-cron-secret: SIZIN_SECRET"
```

## 8. Revize Akisi

Canli revize icin onerilen akış:

1. Burada degisikligi isteyin
2. Kod guncellensin
3. GitHub'a push edilsin
4. Hostinger `Redeploy` yapilsin

Bu model ZIP yuklemeye gore cok daha hizli ve guvenlidir.
