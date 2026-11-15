import { money, t } from '../i18n'
import { api } from '../lib/api'
import type { Stats as S } from '../lib/types'
import { useLoad } from '../lib/useLoad'

export function Stats() {
  const { data, error } = useLoad(() => api<S>('/admin/stats'))
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
        <Tile
          label={t('stats.ai')}
          value={`$${data.aiSpentMonthUsd.toFixed(2)} / $${data.aiBudgetUsd.toFixed(0)}`}
          sub={t('stats.aiToday', { n: data.aiRequestsToday })}
        >
          <div className="meter" aria-hidden="true">
            <span style={{ width: `${aiShare}%` }} />
          </div>
        </Tile>
      </div>
    </section>
  )
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
