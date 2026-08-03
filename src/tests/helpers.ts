import { vi } from 'vitest'

// Usa a mesma BASE_URL que o api.ts lê em runtime — sem fallback, tal como
// em produção: os testes correm com VITE_API_BASE_URL definida via .env.
export const BASE = import.meta.env.VITE_API_BASE_URL as string

// Uma nova Response por chamada — o corpo de uma Response só pode ser lido
// uma vez; com mockResolvedValue (mesma instância sempre) a 2ª chamada de
// fetch numa sequência (ex.: serviço que faz várias chamadas seguidas)
// falhava com "Body has already been read".
export function mockFetch(body: unknown, status = 200) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  )
}

// jsdom rejeita status 204; usa 200 com body vazio para simular resposta vazia
export function mockFetchEmpty() {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response('', { status: 200 })
  )
}
