import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { t } from '../i18n'
import { api } from '../lib/api'
import { formatDate } from '../lib/date'
import type { User } from '../lib/types'
import { errText, useLoad } from '../lib/useLoad'

type Filter = 'all' | 'limit' | 'premium'
const FILTERS: Filter[] = ['all', 'limit', 'premium']

export function Users() {
  const [input, setInput] = useState('')
  const [q, setQ] = useState('')
  // Filtr manzilda: statistikadagi "Bepul limiti tugagan" shu yerga olib keladi
  const [params, setParams] = useSearchParams()
  const filter = FILTERS.includes(params.get('filter') as Filter)
    ? (params.get('filter') as Filter)
    : 'all'
  const { data, error, reload } = useLoad(() => {
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (filter !== 'all') p.set('filter', filter)
    const s = p.toString()
    return api<User[]>(`/admin/users${s ? `?${s}` : ''}`)
  }, [q, filter])
  const [msg, setMsg] = useState('')

  async function act(fn: () => Promise<unknown>, done: string) {
    try {
      await fn()
      setMsg(done)
      reload()
    } catch (e) {
      setMsg(t('common.error', { msg: errText(e) }))
    }
  }

  function give(u: User) {
    const raw = window.prompt(t('users.giveAsk'), '30')
    if (raw === null) return
    const days = Number(raw)
    void act(
      () => api(`/admin/users/${u.id}/premium`, { method: 'POST', body: { days } }),
      `${u.name ?? u.id}: +${days} kun Premium`,
    )
  }

  function freeReset(u: User) {
    if (!window.confirm(t('users.freeResetAsk'))) return
    void act(() => api(`/admin/users/${u.id}/free-reset`, { method: 'POST' }), t('common.saved'))
  }

  function block(u: User) {
    if (!u.blocked && !window.confirm(t('users.blockAsk'))) return
    void act(
      () => api(`/admin/users/${u.id}/block`, { method: 'POST', body: { blocked: !u.blocked } }),
      t('common.saved'),
    )
  }

  return (
    <section className="section">
      <h1>{t('nav.users')}</h1>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault()
          setQ(input.trim())
        }}
      >
        <input
          className="input"
          type="search"
          value={input}
          placeholder={t('users.search')}
          aria-label={t('users.search')}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn">
          🔍
        </button>
      </form>
      <div className="seg" role="group" aria-label={t('nav.users')}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setParams(f === 'all' ? {} : { filter: f })}
          >
            {t(`users.filter.${f}`)}
          </button>
        ))}
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
                <th>{t('users.name')}</th>
                <th>{t('users.contact')}</th>
                <th>{t('users.premium')}</th>
                <th>{t('users.free')}</th>
                <th>{t('users.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr
                  key={u.id}
                  data-testid={`user-${u.tgId ?? u.id}`}
                  className={u.blocked ? 'blocked' : ''}
                >
                  <td>
                    {u.name ?? '—'}
                    {u.blocked && <span className="status REJECTED">{t('users.blocked')}</span>}
                    <div className="muted small">{formatDate(u.createdAt)}</div>
                  </td>
                  <td>
                    {/* Username bo'lsa — Telegram'da yozish uchun havola */}
                    {u.username ? (
                      <a href={`https://t.me/${u.username}`} target="_blank" rel="noreferrer">
                        @{u.username}
                      </a>
                    ) : u.tgId ? (
                      `tg ${u.tgId}`
                    ) : (
                      '—'
                    )}
                    <div className="muted small">{u.phone ?? ''}</div>
                  </td>
                  <td>
                    {u.premiumUntil
                      ? t('users.premiumUntil', { date: formatDate(u.premiumUntil) })
                      : '—'}
                  </td>
                  <td className="num">{u.freeUsed}/3</td>
                  <td className="actions">
                    <button type="button" className="btn" onClick={() => give(u)}>
                      {t('users.give')}
                    </button>
                    <button
                      type="button"
                      className="btn secondary"
                      disabled={!u.phone}
                      onClick={() => freeReset(u)}
                    >
                      {t('users.freeReset')}
                    </button>
                    <button type="button" className="btn secondary" onClick={() => block(u)}>
                      {u.blocked ? t('users.unblock') : t('users.block')}
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
