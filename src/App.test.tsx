import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import App from './App'

type Handler = (body: unknown) => unknown
const json = (body: unknown, status = 200) =>
  new Response(body === undefined ? '' : JSON.stringify(body), { status })

function server(routes: Record<string, Handler | { status: number; body?: unknown }>) {
  const calls: { key: string; body: unknown }[] = []
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    const path = url.replace(/^.*\/api\/v1/, '')
    const key = `${init?.method ?? 'GET'} ${path}`
    const body = init?.body ? JSON.parse(init.body as string) : undefined
    calls.push({ key, body })
    const r = routes[key]
    if (!r) return json({ code: 'NOT_FOUND' }, 404)
    if (typeof r === 'function') return json(r(body))
    return json(r.body ?? {}, r.status)
  })
  vi.stubGlobal('fetch', fetch)
  return calls
}

const me = { 'GET /admin/me': () => ({ tgId: 555, name: 'Egasi' }) }

function open(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('kirish', () => {
  it('kirmagan — mysayqal.uz orqali kirishni taklif qiladi', async () => {
    server({ 'GET /admin/me': { status: 401, body: { code: 'UNAUTHENTICATED' } } })
    open()
    expect(await screen.findByRole('link', { name: 'mysayqal.uz da kirish' })).toHaveAttribute(
      'href',
      'https://mysayqal.uz/kirish',
    )
  })
  it('admin emas — ruxsat yoʻq', async () => {
    server({ 'GET /admin/me': { status: 403, body: { code: 'FORBIDDEN' } } })
    open()
    expect(await screen.findByText(/admin huquqi yo‘q/)).toBeInTheDocument()
  })
})

describe('admin panel', () => {
  it('umumiy statistika', async () => {
    server({
      ...me,
      'GET /admin/stats': () => ({
        usersTotal: 42,
        usersToday: 3,
        usersWeek: 10,
        phonesVerified: 20,
        premiumActive: 5,
        ordersOpen: 2,
        ordersReceipt: 1,
        paid30d: 4,
        revenue30dUzs: 276000,
        exportsWeek: 17,
        aiSpentMonthUsd: 0.42,
        aiBudgetUsd: 5,
        aiRequestsToday: 7,
      }),
    })
    open()
    expect(await screen.findByText('276 000 so‘m')).toBeInTheDocument()
    expect(screen.getByText('$0.42 / $5')).toBeInTheDocument()
    expect(screen.getByText('bugun +3, hafta +10')).toBeInTheDocument()
  })

  it('buyurtmani tasdiqlash — tasdiq soʻraladi va roʻyxat yangilanadi', async () => {
    let paid = false
    const calls = server({
      ...me,
      'GET /admin/orders?status=open': () =>
        paid
          ? []
          : [
              {
                id: 'o1',
                code: 'K7QX2M',
                userId: 'u',
                userName: 'Ali',
                planId: 'month',
                baseAmount: 69000,
                amount: 69000,
                status: 'RECEIPT',
                createdAt: '2026-11-15T07:00:00Z',
                expiresAt: '2026-11-15T08:00:00Z',
              },
            ],
      'POST /admin/orders/o1/decide': () => {
        paid = true
        return { message: '✅ Tasdiqlandi: K7QX2M, 69 000 so‘m' }
      },
    })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    open('/buyurtmalar')
    const row = await screen.findByTestId('order-K7QX2M')
    expect(row).toHaveTextContent('Chek keldi')
    await userEvent.click(within(row).getByRole('button', { name: '✅ Tasdiqlash' }))
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('69 000'))
    expect(calls.find((c) => c.key === 'POST /admin/orders/o1/decide')?.body).toEqual({
      approve: true,
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Tasdiqlandi')
    expect(await screen.findByText('Hech narsa yo‘q')).toBeInTheDocument()
  })

  it('foydalanuvchi: qidiruv va Premium berish', async () => {
    const calls = server({
      ...me,
      'GET /admin/users': () => [],
      'GET /admin/users?q=998901': () => [
        {
          id: 'u1',
          name: 'Vali',
          phone: '+998901234567',
          tgId: '77',
          username: 'vali',
          createdAt: '2026-11-01T00:00:00Z',
          freeUsed: 3,
          blocked: false,
        },
      ],
      'POST /admin/users/u1/premium': () => ({ until: '2026-12-15T00:00:00Z' }),
    })
    vi.spyOn(window, 'prompt').mockReturnValue('30')
    open('/foydalanuvchilar')
    await userEvent.type(await screen.findByRole('searchbox'), '998901')
    await userEvent.click(screen.getByRole('button', { name: '🔍' }))
    const row = await screen.findByTestId('user-77')
    expect(row).toHaveTextContent('3/3')
    await userEvent.click(within(row).getByRole('button', { name: '+ Premium' }))
    expect(calls.find((c) => c.key === 'POST /admin/users/u1/premium')?.body).toEqual({ days: 30 })
  })

  it('tarif narxini oʻzgartirish', async () => {
    const calls = server({
      ...me,
      'GET /admin/plans': () => [{ id: 'month', priceUzs: 69000, days: 30, active: true }],
      'PUT /admin/plans/month': (b) => ({ id: 'month', ...(b as object) }),
    })
    open('/tariflar')
    const card = await screen.findByTestId('plan-month')
    const price = within(card).getByLabelText('Narx (so‘m)')
    await userEvent.clear(price)
    await userEvent.type(price, '79 000')
    await userEvent.click(within(card).getByRole('button', { name: 'Saqlash' }))
    expect(calls.find((c) => c.key === 'PUT /admin/plans/month')?.body).toEqual({
      priceUzs: 79000,
      days: 30,
      active: true,
    })
    expect(await within(card).findByRole('status')).toHaveTextContent('Saqlandi')
  })

  it('promo-kod yaratish va oʻchirish', async () => {
    const calls = server({
      ...me,
      'GET /admin/promos': () => [
        {
          code: 'BAHOR',
          kind: 'DISCOUNT',
          value: 20,
          used: 1,
          maxUses: 10,
          active: true,
          createdAt: '2026-11-15T00:00:00Z',
        },
      ],
      'POST /admin/promos': (b) => ({
        ...(b as object),
        used: 0,
        active: true,
        createdAt: '2026-11-15T00:00:00Z',
      }),
      'POST /admin/promos/BAHOR/active': () => ({ active: false }),
    })
    open('/promo')
    await userEvent.type(await screen.findByLabelText('Kod'), 'yoz')
    await userEvent.click(screen.getByRole('button', { name: 'Yaratish' }))
    expect(calls.find((c) => c.key === 'POST /admin/promos')?.body).toEqual({
      code: 'YOZ',
      kind: 'DISCOUNT',
      value: 10,
    })
    const row = await screen.findByTestId('promo-BAHOR')
    expect(row).toHaveTextContent('1 / 10')
    await userEvent.click(within(row).getByRole('button', { name: 'O‘chirish' }))
    expect(calls.find((c) => c.key === 'POST /admin/promos/BAHOR/active')?.body).toEqual({
      active: false,
    })
  })
})
