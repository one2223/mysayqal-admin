import { useState } from 'react'
import { t, type Key } from '../i18n'
import { api } from '../lib/api'
import type { Plan } from '../lib/types'
import { errText, useLoad } from '../lib/useLoad'

export function Plans() {
  const { data, error, reload } = useLoad(() => api<Plan[]>('/admin/plans'))
  return (
    <section className="section">
      <h1>{t('nav.plans')}</h1>
      <p className="muted small">{t('plans.note')}</p>
      {error && <p className="error">{t('common.error', { msg: error })}</p>}
      {data && (
        <div className="cards">
          {data.map((p) => (
            <PlanCard key={p.id} plan={p} onSaved={reload} />
          ))}
        </div>
      )}
    </section>
  )
}

function PlanCard({ plan, onSaved }: { plan: Plan; onSaved: () => void }) {
  const [price, setPrice] = useState(String(plan.priceUzs))
  const [days, setDays] = useState(String(plan.days))
  const [active, setActive] = useState(plan.active)
  const [msg, setMsg] = useState('')
  const name = ['week', 'month', 'year'].includes(plan.id) ? t(`plan.${plan.id}` as Key) : plan.id

  async function save() {
    setMsg('')
    try {
      await api(`/admin/plans/${plan.id}`, {
        method: 'PUT',
        body: { priceUzs: Number(price.replace(/\s/g, '')), days: Number(days), active },
      })
      setMsg(t('common.saved'))
      onSaved()
    } catch (e) {
      setMsg(t('common.error', { msg: errText(e) }))
    }
  }

  return (
    <form
      className="card"
      data-testid={`plan-${plan.id}`}
      onSubmit={(e) => {
        e.preventDefault()
        void save()
      }}
    >
      <strong>{name}</strong>
      <label className="field">
        <span>{t('plans.price')}</span>
        <input
          className="input"
          inputMode="numeric"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </label>
      <label className="field">
        <span>{t('plans.days')}</span>
        <input
          className="input"
          inputMode="numeric"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        />
      </label>
      <label className="check">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        {t('plans.active')}
      </label>
      <button type="submit" className="btn">
        {t('common.save')}
      </button>
      {msg && (
        <span className="small" role="status">
          {msg}
        </span>
      )}
    </form>
  )
}
