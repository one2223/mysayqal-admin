import { useState } from 'react'
import { t } from '../i18n'
import { api } from '../lib/api'
import { formatDate } from '../lib/date'
import { errText, useLoad } from '../lib/useLoad'

export type Bg = {
  id: string
  name: string
  source: 'ai' | 'upload'
  prompt?: string
  styleId?: string
  createdAt: string
  url: string
}
type StyleRow = {
  id: string
  name: string
  tier: 'free' | 'premium'
  active: boolean
  sort: number
}

/** Tayyor g'oyalar (inglizcha — model inglizcha promptni yaxshi tushunadi). */
const IDEAS: [string, string][] = [
  ['Kuzgi stol', 'Empty rustic wooden table, softly blurred autumn park with orange leaves behind'],
  [
    'Hammom',
    'Empty white marble bathroom shelf, softly blurred bright bathroom with towels and plants behind',
  ],
  [
    'Kafe',
    'Empty round marble cafe table, softly blurred cozy coffee shop with warm lights behind',
  ],
  [
    'Studiya',
    'Round white podium in the center, minimal pastel blue studio wall, soft diffused light',
  ],
  [
    'Ramazon',
    'Empty dark wooden table, softly blurred golden Ramadan lanterns and crescent bokeh behind',
  ],
  ['Qor', 'Smooth white snow surface, softly blurred winter forest with snowfall behind'],
]

/** Fonlar: AI bilan yaratish, yuklash, Premium foto uslub qilish; uslublarni yoqish/o'chirish. */
export function Backgrounds() {
  const bgs = useLoad(() => api<Bg[]>('/admin/backgrounds'))
  const styles = useLoad(() => api<StyleRow[]>('/admin/styles'))
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [upName, setUpName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [msg, setMsg] = useState('')

  async function run(fn: () => Promise<unknown>, ok: string) {
    setMsg('')
    setBusy(true)
    try {
      await fn()
      setMsg(ok)
      bgs.reload()
      styles.reload()
    } catch (e) {
      setMsg(t('common.error', { msg: errText(e) }))
    } finally {
      setBusy(false)
    }
  }

  function upload() {
    if (!file) return
    const form = new FormData()
    form.append('file', file, file.name)
    form.append('name', upName || file.name.replace(/\.[^.]+$/, ''))
    void run(
      () => api('/admin/backgrounds/upload', { method: 'POST', body: form }),
      t('bg.uploaded'),
    )
  }

  return (
    <section className="section">
      <h1>{t('nav.backgrounds')}</h1>
      <p className="muted small">{t('bg.intro')}</p>

      <div className="cards">
        <form
          className="card form-grid"
          onSubmit={(e) => {
            e.preventDefault()
            void run(
              () => api('/admin/backgrounds/generate', { method: 'POST', body: { name, prompt } }),
              t('bg.generated'),
            )
          }}
        >
          <strong>{t('bg.generate')}</strong>
          <label className="field">
            <span>{t('bg.name')}</span>
            <input
              className="input"
              value={name}
              maxLength={80}
              required
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field">
            <span>{t('bg.prompt')}</span>
            <textarea
              className="input"
              rows={3}
              value={prompt}
              maxLength={600}
              required
              onChange={(e) => setPrompt(e.target.value)}
            />
          </label>
          <span className="muted small">{t('bg.promptNote')}</span>
          <div className="row">
            {IDEAS.map(([n, p]) => (
              <button
                key={n}
                type="button"
                className="btn secondary small-btn"
                onClick={() => {
                  setName(n)
                  setPrompt(p)
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <button type="submit" className="btn" disabled={busy}>
            {busy ? t('bg.busy') : t('bg.generateBtn')}
          </button>
        </form>

        <form
          className="card form-grid"
          onSubmit={(e) => {
            e.preventDefault()
            upload()
          }}
        >
          <strong>{t('bg.upload')}</strong>
          <label className="field">
            <span>{t('bg.name')}</span>
            <input
              className="input"
              value={upName}
              maxLength={80}
              onChange={(e) => setUpName(e.target.value)}
            />
          </label>
          <label className="field">
            <span>{t('bg.file')}</span>
            <input
              type="file"
              accept="image/jpeg,image/png"
              aria-label={t('bg.file')}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <span className="muted small">{t('bg.fileNote')}</span>
          <button type="submit" className="btn" disabled={busy || !file}>
            {t('bg.uploadBtn')}
          </button>
        </form>
      </div>

      {msg && (
        <p className="note" role="status">
          {msg}
        </p>
      )}
      {bgs.error && <p className="error">{t('common.error', { msg: bgs.error })}</p>}

      <h2>{t('bg.library')}</h2>
      {bgs.data && bgs.data.length === 0 && <p className="muted">{t('common.empty')}</p>}
      <div className="bg-grid">
        {bgs.data?.map((b) => (
          <BgCard key={b.id} bg={b} busy={busy} run={run} />
        ))}
      </div>

      <h2>{t('bg.styles')}</h2>
      <p className="muted small">{t('bg.stylesNote')}</p>
      {styles.data && (
        <div className="table-wrap">
          <table>
            <tbody>
              {styles.data.map((s) => (
                <tr key={s.id} data-testid={`style-${s.id}`}>
                  <td>{s.name}</td>
                  <td className="muted small">{s.id}</td>
                  <td>{s.tier === 'free' ? t('bg.free') : 'Premium'}</td>
                  <td>
                    {s.tier === 'premium' && (
                      <button
                        type="button"
                        className="btn secondary"
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () =>
                              api(`/admin/styles/${encodeURIComponent(s.id)}/active`, {
                                method: 'POST',
                                body: { active: !s.active },
                              }),
                            t('common.saved'),
                          )
                        }
                      >
                        {s.active ? t('promos.off') : t('promos.on')}
                      </button>
                    )}
                    {!s.active && <em className="muted small"> {t('promos.inactive')}</em>}
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

function BgCard(props: {
  bg: Bg
  busy: boolean
  run: (fn: () => Promise<unknown>, ok: string) => Promise<void>
}) {
  const { bg, busy, run } = props
  const [styleName, setStyleName] = useState(`Foto · ${bg.name}`)
  const [dark, setDark] = useState(false)
  const [accent, setAccent] = useState('#E8590C')
  return (
    <div className="card bg-card" data-testid={`bg-${bg.id}`}>
      <img src={bg.url} alt={bg.name} loading="lazy" />
      <strong>{bg.name}</strong>
      <span className="muted small">
        {t(bg.source === 'ai' ? 'bg.src.ai' : 'bg.src.upload')} · {formatDate(bg.createdAt)}
      </span>
      {bg.styleId ? (
        <span className="note small">{t('bg.isStyle', { id: bg.styleId })}</span>
      ) : (
        <>
          <label className="field">
            <span>{t('bg.styleName')}</span>
            <input
              className="input"
              value={styleName}
              maxLength={40}
              onChange={(e) => setStyleName(e.target.value)}
            />
          </label>
          <label className="field">
            <span>{t('bg.tone')}</span>
            <select
              value={dark ? 'dark' : 'light'}
              onChange={(e) => setDark(e.target.value === 'dark')}
            >
              <option value="light">{t('bg.light')}</option>
              <option value="dark">{t('bg.dark')}</option>
            </select>
          </label>
          <label className="field">
            <span>{t('bg.accent')}</span>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value.toUpperCase())}
            />
          </label>
          <div className="row">
            <button
              type="button"
              className="btn"
              disabled={busy || !styleName.trim()}
              onClick={() =>
                void run(
                  () =>
                    api(`/admin/backgrounds/${bg.id}/style`, {
                      method: 'POST',
                      body: { name: styleName.trim(), dark, accent: accent.toUpperCase() },
                    }),
                  t('bg.styled'),
                )
              }
            >
              {t('bg.makeStyle')}
            </button>
            <button
              type="button"
              className="btn secondary"
              disabled={busy}
              onClick={() => {
                if (!window.confirm(t('bg.deleteAsk', { name: bg.name }))) return
                void run(
                  () => api(`/admin/backgrounds/${bg.id}`, { method: 'DELETE' }),
                  t('bg.deleted'),
                )
              }}
            >
              {t('bg.delete')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
