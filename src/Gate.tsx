import { useEffect, useState, type ReactNode } from 'react'
import { t } from './i18n'
import { api, ApiError } from './lib/api'

export type Admin = { tgId: number; name: string }
type State =
  { kind: 'loading' } | { kind: 'login' } | { kind: 'denied' } | { kind: 'ok'; admin: Admin }

/**
 * Kirish: admin panel mysayqal.uz sessiyasidan foydalanadi (cookie domeni umumiy). Server admin ekanini
 * Telegram ID bo'yicha tekshiradi (`/admin/me`).
 */
export function Gate({ children }: { children: (admin: Admin) => ReactNode }) {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const [tries, setTries] = useState(0)

  useEffect(() => {
    let alive = true
    api<Admin>('/admin/me')
      .then((admin) => alive && setState({ kind: 'ok', admin }))
      .catch((e: unknown) => {
        if (!alive) return
        setState(e instanceof ApiError && e.status === 403 ? { kind: 'denied' } : { kind: 'login' })
      })
    return () => {
      alive = false
    }
  }, [tries])

  if (state.kind === 'ok') return <>{children(state.admin)}</>
  return (
    <main className="container gate">
      <h1>{t('app.title')}</h1>
      {state.kind === 'loading' && <p className="muted">{t('gate.loading')}</p>}
      {state.kind === 'login' && (
        <>
          <p>{t('gate.login')}</p>
          <div className="row">
            <a className="btn" href="https://mysayqal.uz/kirish">
              {t('gate.loginBtn')}
            </a>
            <button type="button" className="btn secondary" onClick={() => setTries((n) => n + 1)}>
              {t('gate.retry')}
            </button>
          </div>
        </>
      )}
      {state.kind === 'denied' && <p className="error">{t('gate.denied')}</p>}
    </main>
  )
}
