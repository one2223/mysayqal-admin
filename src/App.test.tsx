import { render, screen, waitFor, within } from '@testing-library/react'
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
        activeWeek: 6,
        freeExhausted: 4,
      }),
      'GET /admin/sources?days=30': () => [
        {
          source: 'zoom',
          visits: 40,
          users: 9,
          phones: 7,
          exportUsers: 5,
          paidUsers: 1,
          revenueUzs: 49000,
        },
      ],
      'GET /admin/stats/daily?days=14': () => [
        {
          day: '2026-11-15',
          users: 2,
          phones: 1,
          exports: 3,
          exportUsers: 1,
          ai: 0,
          paid: 0,
          revenueUzs: 0,
        },
        {
          day: '2026-11-16',
          users: 5,
          phones: 4,
          exports: 9,
          exportUsers: 3,
          ai: 2,
          paid: 1,
          revenueUzs: 49000,
        },
      ],
    })
    open()
    expect(await screen.findByText('276 000 so‘m')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Premium olmagan — roʻyxatni ochish' }),
    ).toHaveAttribute('href', '/foydalanuvchilar?filter=limit')
    const rows = within(await screen.findByTestId('daily')).getAllByRole('row')
    expect(rows[1]).toHaveTextContent('16.11') // eng yangi kun tepada
    expect(rows[1]).toHaveTextContent('49 000')
    // Reklama manbalari va havola yasagich
    const src = within(screen.getByTestId('sources')).getAllByRole('row')
    expect(src[1]).toHaveTextContent('zoom')
    expect(src[1]).toHaveTextContent('40')
    await userEvent.type(screen.getByRole('textbox', { name: /Manba nomi/ }), 'Club')
    expect(screen.getByTestId('src-link')).toHaveTextContent('https://mysayqal.uz/?src=club')
    expect(screen.getByText('$0.420 / $5')).toBeInTheDocument()
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
    expect(within(row).getByRole('link', { name: '@vali' })).toHaveAttribute(
      'href',
      'https://t.me/vali',
    )
  })

  it('foydalanuvchilar: "Bepul limiti tugagan" filtri', async () => {
    const calls = server({
      ...me,
      'GET /admin/users?filter=limit': () => [],
      'GET /admin/users': () => [],
    })
    open('/foydalanuvchilar?filter=limit')
    expect(
      await screen.findByRole('button', { name: 'Bepul limiti tugagan', pressed: true }),
    ).toBeInTheDocument()
    await waitFor(() =>
      expect(calls.some((c) => c.key === 'GET /admin/users?filter=limit')).toBe(true),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Hammasi' }))
    await waitFor(() => expect(calls.some((c) => c.key === 'GET /admin/users')).toBe(true))
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

  it('fonlar: AI bilan yaratish va uslub qilish', async () => {
    const calls = server({
      ...me,
      'GET /admin/backgrounds': () => [
        {
          id: 'b1',
          name: 'Oshxona',
          source: 'ai',
          createdAt: '2026-11-15T00:00:00Z',
          url: 'https://api.x/api/v1/bg/b1',
        },
      ],
      'GET /admin/styles': () => [
        { id: 'olov', name: 'Olov', tier: 'free', active: true, sort: 1 },
        { id: 'f-loft', name: 'Foto · Loft', tier: 'premium', active: true, sort: 20 },
      ],
      'POST /admin/backgrounds/generate': (b) => ({ id: 'b2', ...(b as object) }),
      'POST /admin/backgrounds/b1/style': () => ({ styleId: 'a-b1' }),
      'POST /admin/styles/f-loft/active': () => ({ active: false }),
    })
    open('/fonlar')
    await userEvent.click(await screen.findByRole('button', { name: 'Kafe' }))
    await userEvent.click(screen.getByRole('button', { name: 'Yaratish' }))
    expect(calls.find((c) => c.key === 'POST /admin/backgrounds/generate')?.body).toMatchObject({
      name: 'Kafe',
      prompt: expect.stringContaining('cafe'),
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Fon yaratildi')

    const card = screen.getByTestId('bg-b1')
    await userEvent.selectOptions(within(card).getByLabelText('Fon'), 'dark')
    await userEvent.click(within(card).getByRole('button', { name: 'Uslub qilish' }))
    expect(calls.find((c) => c.key === 'POST /admin/backgrounds/b1/style')?.body).toEqual({
      name: 'Foto · Oshxona',
      dark: true,
      accent: '#E8590C',
    })
    // Bepul uslubni o'chirish tugmasi yo'q, Premiumni — bor
    expect(within(screen.getByTestId('style-olov')).queryByRole('button')).toBeNull()
    await userEvent.click(
      within(screen.getByTestId('style-f-loft')).getByRole('button', { name: 'O‘chirish' }),
    )
    expect(calls.find((c) => c.key === 'POST /admin/styles/f-loft/active')?.body).toEqual({
      active: false,
    })
  })
})
