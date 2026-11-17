import { useState } from 'react'
import { Link } from 'react-router'
import { money, t } from '../i18n'
import { api } from '../lib/api'
import type { DayStat, SourceStat, Stats as S } from '../lib/types'
import { useLoad } from '../lib/useLoad'

export function Stats() {
  const { data, error } = useLoad(() => api<S>('/admin/stats'))
  const daily = useLoad(() => api<DayStat[]>('/admin/stats/daily?days=14'))
  const sources = useLoad(() => api<SourceStat[]>('/admin/sources?days=30'))
  if (error) return <p className="error">{t('common.error', { msg: error })}</p>
  if (!data) return <p className="muted">…</p>
  const aiShare =
    data.aiBudgetUsd > 0 ? Math.min(100, (data.aiSpentMonthUsd / data.aiBudgetUsd) * 100) : 0
  return (
    <section className="section">
      <h1>{t('nav.stats')}</h1>
      <div className="tiles">
        <Tile
          label={t('stats.users')}
          value={data.usersTotal}
          sub={t('stats.usersNew', { d: data.usersToday, w: data.usersWeek })}
        />
        <Tile label={t('stats.phones')} value={data.phonesVerified} />
        <Tile label={t('stats.premium')} value={data.premiumActive} />
        <Tile
          label={t('stats.ordersOpen')}
          value={data.ordersOpen}
          accent={data.ordersReceipt > 0}
          sub={t('stats.ordersReceipt', { n: data.ordersReceipt })}
        />
        <Tile
          label={t('stats.revenue')}
          value={t('common.sum', { n: money(data.revenue30dUzs) })}
          sub={t('stats.paid', { n: data.paid30d })}
        />
        <Tile label={t('stats.exports')} value={data.exportsWeek} />
        <Tile label={t('stats.active')} value={data.activeWeek} sub={t('stats.activeSub')} />
        <Tile
          label={t('stats.exhausted')}
          value={data.freeExhausted}
          accent={data.freeExhausted > 0}
        >
          <Link className="small" to="/foydalanuvchilar?filter=limit">
            {t('stats.exhaustedSub')}
          </Link>
        </Tile>
        <Tile
          label={t('stats.ai')}
          value={`$${usd(data.aiSpentMonthUsd)} / $${data.aiBudgetUsd.toFixed(0)}`}
          sub={t('stats.aiToday', { n: data.aiRequestsToday })}
        >
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${aiShare}%` }} />
          </div>
          <span className="muted small">{t('stats.aiNote')}</span>
        </Tile>
      </div>
      <Sources rows={sources.data ?? []} />
      {daily.data && <Daily rows={daily.data} />}
    </section>
  )
}

/** Kunlik jadval: eng yangi kun tepada. */
function Daily({ rows }: { rows: DayStat[] }) {
  const list = [...rows].reverse()
  return (
    <>
      <h2>{t('stats.daily')}</h2>
      <div className="table-wrap">
        <table data-testid="daily">
          <thead>
            <tr>
              <th>{t('stats.day')}</th>
              <th className="num">{t('stats.dUsers')}</th>
              <th className="num">{t('stats.dPhones')}</th>
              <th className="num">{t('stats.dExports')}</th>
              <th className="num">{t('stats.dExportUsers')}</th>
              <th className="num">{t('stats.dAi')}</th>
              <th className="num">{t('stats.dPaid')}</th>
              <th className="num">{t('stats.dRevenue')}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.day}>
                <td>{d.day.slice(5).split('-').reverse().join('.')}</td>
                <td className="num">{d.users}</td>
                <td className="num">{d.phones}</td>
                <td className="num">{d.exports}</td>
                <td className="num">{d.exportUsers}</td>
                <td className="num">{d.ai}</td>
                <td className="num">{d.paid}</td>
                <td className="num">{d.revenueUzs ? money(d.revenueUzs) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/** Kichik summa ham ko'rinsin: 0.012 (0 ga yaxlitlanib ketmasin). */
function usd(v: number): string {
  return v < 1 ? v.toFixed(3) : v.toFixed(2)
}

function Tile(props: {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className={props.accent ? 'tile accent' : 'tile'}>
      <span className="muted small">{props.label}</span>
      <strong className="tile-value">{props.value}</strong>
      {props.sub && <span className="muted small">{props.sub}</span>}
      {props.children}
    </div>
  )
}

/** Reklama havolasi yasagich va manbalar jadvali. */
function Sources({ rows }: { rows: SourceStat[] }) {
  const [name, setName] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const clean = name.trim().toLowerCase()
  const valid = /^[a-z0-9_-]{1,32}$/.test(clean)
  // Sayt havolasi va bot havolasi (bot "Ochish" tugmasi bilan Mini App'ni shu manba bilan ochadi)
  const links = [
    { key: 'site', label: t('src.site'), url: `https://mysayqal.uz/?src=${clean}` },
    { key: 'bot', label: t('src.bot'), url: `https://t.me/mysayqal_bot?start=src_${clean}` },
  ]
  async function copy(key: string, url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(key)
    } catch {
      // nusxa olinmasa — havola ekranda turibdi
    }
  }
  return (
    <>
      <h2>{t('src.title')}</h2>
      <p className="muted small">{t('src.hint')}</p>
      <div className="row src-maker">
        <input
          className="input"
          value={name}
          placeholder={t('src.name')}
          aria-label={t('src.name')}
          onChange={(e) => {
            setName(e.target.value)
            setCopied(null)
          }}
        />
      </div>
      {valid &&
        links.map((l) => (
          <div key={l.key} className="row src-maker">
            <span className="muted small src-label">{l.label}</span>
            <code data-testid={`src-link-${l.key}`}>{l.url}</code>
            <button type="button" className="btn secondary" onClick={() => void copy(l.key, l.url)}>
              {copied === l.key ? t('src.copied') : t('src.copy')}
            </button>
          </div>
        ))}
      {rows.length === 0 ? (
        <p className="muted">{t('src.empty')}</p>
      ) : (
        <div className="table-wrap">
          <table data-testid="sources">
            <thead>
              <tr>
                <th>{t('src.source')}</th>
                <th className="num">{t('src.visits')}</th>
                <th className="num">{t('src.users')}</th>
                <th className="num">{t('src.phones')}</th>
                <th className="num">{t('src.exports')}</th>
                <th className="num">{t('src.paid')}</th>
                <th className="num">{t('src.revenue')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.source}>
                  <td>{r.source}</td>
                  <td className="num">{r.visits}</td>
                  <td className="num">{r.users}</td>
                  <td className="num">{r.phones}</td>
                  <td className="num">{r.exportUsers}</td>
                  <td className="num">{r.paidUsers}</td>
                  <td className="num">{r.revenueUzs ? money(r.revenueUzs) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
