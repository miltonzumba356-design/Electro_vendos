import { authStorage } from '@/lib/authStorage'

// Não há valor por omissão de propósito: o backend nunca corre em localhost
// neste projeto (é um serviço remoto, ex.: Railway). Sem VITE_API_BASE_URL
// configurada — no .env em desenvolvimento, ou nas variáveis de ambiente do
// deploy em produção — nenhum pedido deve ser feito, para não mascarar o
// problema com um fallback silencioso que nunca vai responder.
const BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

if (!BASE_URL) {
  console.error(
    '[api] VITE_API_BASE_URL não está definida. Configure-a no .env (desenvolvimento) ou nas ' +
    'variáveis de ambiente do deploy (produção) e reinicie/reconstrua a aplicação.'
  )
}

type Params = Record<string, string | number | boolean | undefined | null>

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!BASE_URL) {
    throw new Error(
      'VITE_API_BASE_URL não está configurada. Defina esta variável de ambiente antes de usar a aplicação.'
    )
  }

  const token = authStorage.getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error(
      `Não foi possível ligar ao servidor (${BASE_URL}). Verifica a tua ligação ou a configuração da API.`
    )
  }

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
  post: <T>(path: string, body?: unknown, params?: Params) =>
    request<T>(buildUrl(path, params), {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string, params?: Params) =>
    request<T>(buildUrl(path, params), { method: 'DELETE' }),
}
