import { useCallback, useEffect, useState } from 'react'

/** So'rovni yuklaydi; `reload` — amal bajarilgach ro'yxatni yangilash uchun. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps)
  useEffect(() => {
    let alive = true
    setError('')
    run()
      .then((d) => alive && setData(d))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
    }
  }, [run, version])
  return { data, error, reload: () => setVersion((v) => v + 1) }
}

export function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}
