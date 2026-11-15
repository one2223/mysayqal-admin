import { t } from '../i18n'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/date'
import type { AuditRow } from '../lib/types'
import { useLoad } from '../lib/useLoad'

export function Audit() {
  const { data, error } = useLoad(() => api<AuditRow[]>('/admin/audit'))
  return (
    <section className="section">
      <h1>{t('nav.audit')}</h1>
      {error && <p className="error">{t('common.error', { msg: error })}</p>}
      {data && data.length === 0 && <p className="muted">{t('common.empty')}</p>}
      {data && data.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('audit.when')}</th>
                <th>{t('audit.action')}</th>
                <th>{t('audit.target')}</th>
                <th>{t('audit.details')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id}>
                  <td className="muted small">{formatDateTime(a.at)}</td>
                  <td>
                    <code>{a.action}</code>
                  </td>
                  <td className="small">{a.target ?? ''}</td>
                  <td className="small">{a.details ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
