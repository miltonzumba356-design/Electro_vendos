const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:8000'

type Params = Record<string, string | number | boolean | undefined | null>

function getToken(): string | null {
  return localStorage.getItem('token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    let errorMsg = `Erro ${res.status}: ${res.statusText}`
    try {
      const data = await res.json()
      if (data.detail) {
        errorMsg = typeof data.detail === 'string'
          ? data.detail
          : JSON.stringify(data.detail)
      }
    } catch {
      // ignore parse errors
    }
    throw new Error(errorMsg)
  }

  const text = await res.text()
  if (!text) return undefined as T
  return JSON.parse(text) as T
}

function buildUrl(path: string, params?: Params): string {
  if (!params) return path
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) sp.append(k, String(v))
  }
  const qs = sp.toString()
  return qs ? `${path}?${qs}` : path
}

export const api = {
  get: <T>(path: string, params?: Params) =>
    request<T>(buildUrl(path, params)),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
}
