import { NavLink, Navigate, Route, Routes } from 'react-router'
import { Gate } from './Gate'
import { t, type Key } from './i18n'
import { Audit } from './pages/Audit'
import { Backgrounds } from './pages/Backgrounds'
import { Orders } from './pages/Orders'
import { Plans } from './pages/Plans'
import { Promos } from './pages/Promos'
import { Stats } from './pages/Stats'
import { Users } from './pages/Users'

const NAV: [string, Key][] = [
  ['/', 'nav.stats'],
  ['/buyurtmalar', 'nav.orders'],
  ['/foydalanuvchilar', 'nav.users'],
  ['/tariflar', 'nav.plans'],
  ['/promo', 'nav.promos'],
  ['/fonlar', 'nav.backgrounds'],
  ['/jurnal', 'nav.audit'],
]

export default function App() {
  return (
    <Gate>
      {(admin) => (
        <>
          <header className="top">
            <div className="container top-row">
              <strong className="logo">
                <span className="logo-word">
                  <span className="logo-my">my</span>sayqal
                </span>
                <svg className="logo-swoosh" viewBox="0 0 200 20" aria-hidden="true">
                  <path d="M4 14C60 4 140 2 196 8" />
                </svg>
              </strong>
              <span className="logo-admin">admin</span>
              <nav className="nav">
                {NAV.map(([to, key]) => (
                  <NavLink key={to} to={to} end={to === '/'}>
                    {t(key)}
                  </NavLink>
                ))}
              </nav>
              <span className="muted small">
                {admin.name} · <a href="https://mysayqal.uz">{t('nav.site')}</a>
              </span>
            </div>
          </header>
          <main className="container">
            <Routes>
              <Route index element={<Stats />} />
              <Route path="buyurtmalar" element={<Orders />} />
              <Route path="foydalanuvchilar" element={<Users />} />
              <Route path="tariflar" element={<Plans />} />
              <Route path="promo" element={<Promos />} />
              <Route path="fonlar" element={<Backgrounds />} />
              <Route path="jurnal" element={<Audit />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </>
      )}
    </Gate>
  )
}
