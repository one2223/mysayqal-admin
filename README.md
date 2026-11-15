# mysayqal-admin

mysayqal admin paneli — `https://admin.mysayqal.uz`.

Bo'limlar: umumiy statistika, buyurtmalar (to'lovni tasdiqlash/rad etish), foydalanuvchilar (qidiruv, Premium berish, bepul kartochkalarni tiklash, bloklash), tariflar (narx, kun, faol), promo-kodlar, admin jurnali.

## Kirish

Alohida parol yo'q: avval `mysayqal.uz` ga Telegram orqali kiring (sessiya cookie'si `mysayqal.uz` domenida — admin panelga ham o'tadi). Server Telegram ID'ni `TELEGRAM_ADMIN_IDS` bilan tekshiradi.

## Ishlab chiqish

```bash
npm install
npm run dev          # http://localhost:5174, /api → localhost:8080 (backend)
npm run typecheck && npm run lint && npm test && npm run build && npm run format:check
```

## Chiqarish

`git push origin main:production` → GitHub Actions `Deploy admin` → serverda `/srv/mysayqal/admin/current`.
Repo sozlamalari (mysayqal-frontend dagidek): variables `WEB_SERVER_USER`, `WEB_SERVER_IP`, `WEB_SERVER_PORT`, `WEB_SERVER_HOST_FP`; secret `DEPLOY_KEY`.
