/**
 * Backend so'rovlari (`/api/v1`). Sessiya — HttpOnly cookie; holat o'zgartiruvchi so'rovlarga
 * `X-CSRF-Token` (ms_csrf cookie qiymati) qo'shiladi. Xatolar — RFC 7807 + `code`.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly data: Record<string, unknown>
  constructor(status: number, code: string, message: string, data: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.data = data
  }
}

export function readCookie(name: string, doc: Document = document): string | null {
  try {
    for (const part of doc.cookie.split(';')) {
      const [k, ...v] = part.trim().split('=')
      if (k === name) return decodeURIComponent(v.join('='))
    }
  } catch {
    // cookie bloklangan
  }
  return null
}

/**
 * Backend manzili: productionda `https://api.mysayqal.uz` (`.env.production`), lokal — bo'sh (Vite proksi).
 */
export const API_BASE: string = (import.meta.env.VITE_API_BASE ?? '').replace(/\/$/, '')

export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<T> {
  const method = init.method ?? 'GET'
  const form = typeof FormData !== 'undefined' && init.body instanceof FormData
  const headers: Record<string, string> = { Accept: 'application/json', ...init.headers }
  // FormData'da Content-Type (boundary bilan) brauzerning o'zi qo'yadi
  if (init.body !== undefined && !form) headers['Content-Type'] = 'application/json'
  if (method !== 'GET') {
    const csrf = readCookie('ms_csrf')
    if (csrf) headers['X-CSRF-Token'] = csrf
  }
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/v1${path}`, {
      method,
      headers,
      // api.mysayqal.uz — boshqa host, cookie (sessiya) yuborilishi uchun
      credentials: 'include',
      body:
        init.body === undefined
          ? undefined
          : form
            ? (init.body as FormData)
            : JSON.stringify(init.body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Internet aloqasi yoʻq')
  }
  const text = await res.text()
  let data: Record<string, unknown> = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = {}
  }
  if (!res.ok) {
    throw new ApiError(
      res.status,
      typeof data.code === 'string' ? data.code : 'INTERNAL',
      typeof data.detail === 'string' ? data.detail : res.statusText,
      data,
    )
  }
  return data as T
}
