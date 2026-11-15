import { useState } from 'react'
import { t } from '../i18n'
import { api } from '../lib/api'
import { formatDate } from '../lib/date'
import type { Promo } from '../lib/types'
import { errText, useLoad } from '../lib/useLoad'

export function Promos() {
  const { data, error, reload } = useLoad(() => api<Promo[]>('/admin/promos'))
  const [code, setCode] = useState('')
  const [kind, setKind] = useState<Promo['kind']>('DISCOUNT')
  const [value, setValue] = useState('10')
  const [maxUses, setMaxUses] = useState('')
  const [expires, setExpires] = useState('')
  const [owner, setOwner] = useState('')
  const [msg, setMsg] = useState('')

  async function create() {
    setMsg('')
    try {
      const p = await api<Promo>('/admin/promos', {
        method: 'POST',
        body: {
          code,
          kind,
          value: Number(value),
          maxUses: maxUses ? Number(maxUses) : undefined,
          // Toshkent vaqti bilan kun oxirigacha amal qiladi
          expiresAt: expires ? new Date(`${expires}T23:59:59+05:00`).toISOString() : undefined,
          owner: owner || undefined,
        },
      })
      setMsg(`${p.code} — ${t('common.saved')}`)
      setCode('')
      reload()
    } catch (e) {
      setMsg(t('common.error', { msg: errText(e) }))
    }
  }

  async function toggle(p: Promo) {
    try {
      await api(`/admin/promos/${encodeURIComponent(p.code)}/active`, {
        method: 'POST',
        body: { active: !p.active },
      })
      reload()
    } catch (e) {
      setMsg(t('common.error', { msg: errText(e) }))
    }
  }

  return (
    <section className="section">
      <h1>{t('nav.promos')}</h1>
      <form
        className="card form-grid"
        onSubmit={(e) => {
          e.preventDefault()
          void create()
        }}
      >
        <strong>{t('promos.new')}</strong>
        <label className="field">
          <span>{t('promos.code')}</span>
          <input
            className="input"
            value={code}
            maxLength={32}
            required
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </label>
        <label className="field">
          <span>{t('promos.kind')}</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as Promo['kind'])}>
            <option value="DISCOUNT">{t('promos.kind.DISCOUNT')}</option>
            <option value="DAYS">{t('promos.kind.DAYS')}</option>
          </select>
        </label>
        <label className="field">
          <span>{t('promos.value')}</span>
          <input
            className="input"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        <label className="field">
          <span>{t('promos.maxUses')}</span>
          <input
            className="input"
            inputMode="numeric"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
          />
        </label>
        <label className="field">
          <span>{t('promos.expires')}</span>
          <input
            className="input"
            type="date"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
          />
        </label>
        <label className="field">
          <span>{t('promos.owner')}</span>
          <input
            className="input"
            value={owner}
            maxLength={120}
            onChange={(e) => setOwner(e.target.value)}
          />
        </label>
        <button type="submit" className="btn">
          {t('promos.create')}
        </button>
      </form>
      {msg && (
        <p className="note" role="status">
          {msg}
        </p>
      )}
      {error && <p className="error">{t('common.error', { msg: error })}</p>}
      {data && data.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('promos.code')}</th>
                <th>{t('promos.kind')}</th>
                <th>{t('promos.used')}</th>
                <th>{t('promos.expires')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr
                  key={p.code}
                  data-testid={`promo-${p.code}`}
                  className={p.active ? '' : 'blocked'}
                >
                  <td>
                    <code>{p.code}</code>
                    {!p.active && <span className="status EXPIRED">{t('promos.inactive')}</span>}
                    {p.owner && <div className="muted small">{p.owner}</div>}
                  </td>
                  <td>{p.kind === 'DISCOUNT' ? `−${p.value}%` : `+${p.value} kun`}</td>
                  <td className="num">
                    {p.used}
                    {p.maxUses ? ` / ${p.maxUses}` : ''}
                  </td>
                  <td className="muted small">{p.expiresAt ? formatDate(p.expiresAt) : '—'}</td>
                  <td className="actions">
                    <button type="button" className="btn secondary" onClick={() => toggle(p)}>
                      {p.active ? t('promos.off') : t('promos.on')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
