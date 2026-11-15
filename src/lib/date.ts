/** Sana har doim bir xil ko'rinishda (brauzer tiliga bog'liq emas): 21.11.2026, 15.11 18:38. Toshkent vaqti. */
const TZ = 'Asia/Tashkent'

function parts(iso: string | Date) {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  const f = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const get = (t: string) => f.find((p) => p.type === t)?.value ?? ''
  return { d: get('day'), m: get('month'), y: get('year'), h: get('hour'), min: get('minute') }
}

export function formatDate(iso: string | Date): string {
  const p = parts(iso)
  return `${p.d}.${p.m}.${p.y}`
}

export function formatDateTime(iso: string | Date): string {
  const p = parts(iso)
  return `${p.d}.${p.m} ${p.h}:${p.min}`
}
