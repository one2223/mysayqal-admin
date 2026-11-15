# mysayqal-admin — agentlar uchun ko'rsatma

Bu repo — mysayqal admin paneli (`admin.mysayqal.uz`). Mahsulot hujjatlari: `one2223/H-A-Studio` → `apps/sayqal/` va `studio/decisions.md`. API — `one2223/mysayqal-backend` (`/api/v1/admin/*`, paket `uz.mysayqal.admin`). Kelishilgan qarorni qayta muhokama qilma.

## Muloqot

- Egasi bilan **o'zbek tilida**; texnik atamalar inglizcha qolishi mumkin.
- Pul sarflanadigan ish — avval egasidan so'raladi. Egasi ko'rmagan ishni "tayyor" dema — skrinshot ko'rsat.

## Git

- Har o'zgarish ish branchida commit qilinadi va `main`ga birlashtirib push qilinadi (egasining doimiy ruxsati).
- Push'dan oldin lokal yashil bo'lsin: `npm run typecheck && npm run lint && npm test && npm run build && npm run format:check`.
- **Avtomatik CI yo'q.** Istisno: `.github/workflows/deploy.yml` — faqat `production` branch'iga push yoki qo'lda. Production'ga chiqarish — egasining ruxsati bilan.

## Texnik qoidalar

- React 19 + TypeScript strict, Vite, React Router, Vitest. Matnlar — `src/i18n.ts` (admin faqat egasi uchun — o'zbekcha).
- Kirish: alohida login yo'q — mysayqal.uz sessiyasi (cookie domeni `mysayqal.uz`). Admin ekanini **faqat server** hal qiladi: Telegram ID `TELEGRAM_ADMIN_IDS` da (`GET /admin/me`).
- Har admin amali serverda `admin_audit` ga yoziladi; to'lov tasdig'i bot'dagi bilan bir xil (`PaymentBot.decide`) — foydalanuvchiga Telegram xabari boradi.
- Ranglar — sayt tokenlari (`src/index.css`): siyoh `#14161B`, to'q sariq `#E8590C`, Manrope. Binafsha yo'q. Tugmalar ≥ 44 px.

## Taqiqlar

- `.env`, tokenlar, kalitlar commit qilinmaydi.
- Odam/hayvon tasvirida yuz chizilmaydi (bizning rasmlarimizda).
