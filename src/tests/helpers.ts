import { vi } from 'vitest'

// Usa a mesma BASE_URL que o api.ts lê em runtime
export const BASE = (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:8000'

export function mockFetch(body: unknown, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

// jsdom rejeita status 204; usa 200 com body vazio para simular resposta vazia
export function mockFetchEmpty() {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response('', { status: 200 })
  )
}
