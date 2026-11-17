export type Stats = {
  usersTotal: number
  usersToday: number
  usersWeek: number
  phonesVerified: number
  premiumActive: number
  ordersOpen: number
  ordersReceipt: number
  paid30d: number
  revenue30dUzs: number
  exportsWeek: number
  aiSpentMonthUsd: number
  aiBudgetUsd: number
  aiRequestsToday: number
  /** Oxirgi 7 kunda kamida bitta kartochka yuklaganlar. */
  activeWeek: number
  /** Bepul 3 tasini ishlatib bo'lgan, Premium'siz. */
  freeExhausted: number
}

/** Reklama manbasi bo'yicha (?src=). */
export type SourceStat = {
  source: string
  visits: number
  users: number
  phones: number
  exportUsers: number
  paidUsers: number
  revenueUzs: number
}

/** Kunlik dinamika (Toshkent kuni). */
export type DayStat = {
  day: string
  users: number
  phones: number
  exports: number
  exportUsers: number
  ai: number
  paid: number
  revenueUzs: number
}

export type OrderStatus = 'PENDING' | 'RECEIPT' | 'PAID' | 'REJECTED' | 'EXPIRED'

export type Order = {
  id: string
  code: string
  userId: string
  userName?: string
  phone?: string
  tgUserId?: number
  planId: string
  promoCode?: string
  baseAmount: number
  amount: number
  status: OrderStatus
  createdAt: string
  expiresAt: string
  decidedAt?: string
}

export type User = {
  id: string
  name?: string
  phone?: string
  tgId?: string
  username?: string
  createdAt: string
  premiumUntil?: string
  freeUsed: number
  blocked: boolean
}

export type Plan = { id: string; priceUzs: number; days: number; active: boolean }

export type Promo = {
  code: string
  kind: 'DISCOUNT' | 'DAYS'
  value: number
  owner?: string
  maxUses?: number
  used: number
  expiresAt?: string
  active: boolean
  createdAt: string
}

export type AuditRow = {
  id: number
  adminTgId: number
  action: string
  target?: string
  details?: string
  at: string
}
