import { useState } from 'react'
import { money, t, type Key } from '../i18n'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/date'
import type { Order } from '../lib/types'
import { errText, useLoad } from '../lib/useLoad'

export function Orders() {
  const [all, setAll] = useState(false)
  const { data, error, reload } = useLoad(
    () => api<Order[]>(`/admin/orders?status=${all ? 'all' : 'open'}`),
    [all],
  )
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  async function decide(o: Order, approve: boolean) {
    const ask = approve
      ? t('orders.confirmApprove', { code: o.code, sum: money(o.amount) })
      : t('orders.confirmReject', { code: o.code })
    if (!window.confirm(ask)) return
    setBusy(o.id)
    try {
      const r = await api<{ message: string }>(`/admin/orders/${o.id}/decide`, {
        method: 'POST',
        body: { approve },
      })
      setMsg(r.message)
      reload()
    } catch (e) {
      setMsg(t('common.error', { msg: errText(e) }))
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="section">
      <h1>{t('nav.orders')}</h1>
      <div className="seg">
        <button type="button" aria-pressed={!all} onClick={() => setAll(false)}>
          {t('orders.open')}
        </button>
        <button type="button" aria-pressed={all} onClick={() => setAll(true)}>
          {t('orders.all')}
        </button>
      </div>
      {msg && (
        <p className="note" role="status">
          {msg}
        </p>
      )}
      {error && <p className="error">{t('common.error', { msg: error })}</p>}
      {data && data.length === 0 && <p className="muted">{t('common.empty')}</p>}
      {data && data.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('orders.code')}</th>
                <th>{t('orders.user')}</th>
                <th>{t('orders.plan')}</th>
                <th>{t('orders.amount')}</th>
                <th>{t('orders.status')}</th>
                <th>{t('orders.created')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((o) => {
                const open = o.status === 'PENDING' || o.status === 'RECEIPT'
                return (
                  <tr key={o.id} data-testid={`order-${o.code}`}>
                    <td>
                      <code>{o.code}</code>
                    </td>
                    <td>
                      {o.userName ?? '—'}
                      <div className="muted small">
                        {o.phone ?? (o.tgUserId ? `tg ${o.tgUserId}` : '')}
                      </div>
                    </td>
                    <td>
                      {o.planId}
                      {o.promoCode && <div className="muted small">promo {o.promoCode}</div>}
                    </td>
                    <td className="num">{money(o.amount)}</td>
                    <td>
                      <span className={`status ${o.status}`}>{t(`status.${o.status}` as Key)}</span>
                    </td>
                    <td className="muted small">{formatDateTime(o.createdAt)}</td>
                    <td className="actions">
                      {open && (
                        <>
                          <button
                            type="button"
                            className="btn"
                            disabled={busy === o.id}
                            onClick={() => decide(o, true)}
                          >
                            {t('orders.approve')}
                          </button>
                          <button
                            type="button"
                            className="btn secondary"
                            disabled={busy === o.id}
                            onClick={() => decide(o, false)}
                          >
                            {t('orders.reject')}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
