import { Link } from 'react-router'
import { money, t } from '../i18n'
import { api } from '../lib/api'
import type { DayStat, Stats as S } from '../lib/types'
import { useLoad } from '../lib/useLoad'

export function Stats() {
  const { data, error } = useLoad(() => api<S>('/admin/stats'))
  const daily = useLoad(() => api<DayStat[]>('/admin/stats/daily?days=14'))
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
