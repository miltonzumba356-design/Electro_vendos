/**
 * SDD — Testes do cliente HTTP base (src/lib/api.ts)
 * Spec: OpenAPI 3.1.0 — Bisness SAIDE
 */
import { describe, it, expect, vi } from 'vitest'
import { BASE, mockFetch, mockFetchEmpty } from './helpers'

describe('API client — autenticação Bearer', () => {
  it('não envia Authorization quando não há token', async () => {
    const spy = mockFetch({ ok: true })
    const { api } = await import('@/lib/api')
    await api.get('/health')
    const [, opts] = spy.mock.calls[0] as [string, RequestInit]
    const headers = opts.headers as Record<string, string>
    expect(headers['Authorization']).toBeUndefined()
  })

  it('envia Authorization: Bearer <token> quando token existe no localStorage', async () => {
    localStorage.setItem('token', 'abc123')
    const spy = mockFetch({ ok: true })
    const { api } = await import('@/lib/api')
    await api.get('/health')
    const [, opts] = spy.mock.calls[0] as [string, RequestInit]
    const headers = opts.headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer abc123')
  })
})

describe('API client — construção de URL (buildUrl)', () => {
  it('GET sem params — URL sem query string', async () => {
    const spy = mockFetch([])
    const { api } = await import('@/lib/api')
    await api.get('/produtos')
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/produtos`)
  })

  it('GET com params — inclui query string corretamente', async () => {
    const spy = mockFetch({})
    const { api } = await import('@/lib/api')
    await api.get('/relatorios/vendas/diario', { data: '2026-06-27' })
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/relatorios/vendas/diario?data=2026-06-27`)
  })

  it('GET com múltiplos params', async () => {
    const spy = mockFetch({})
    const { api } = await import('@/lib/api')
    await api.get('/relatorios/vendas/mensal', { ano: 2026, mes: 6 })
    const url = spy.mock.calls[0][0] as string
    expect(url).toContain('ano=2026')
    expect(url).toContain('mes=6')
  })

  it('GET ignora params undefined/null', async () => {
    const spy = mockFetch([])
    const { api } = await import('@/lib/api')
    await api.get('/stock/movimentos', { produto_id: undefined })
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/stock/movimentos`)
  })
})

describe('API client — verbos HTTP', () => {
  it('POST envia method: POST e body JSON', async () => {
    const spy = mockFetch({ id: '1' }, 201)
    const { api } = await import('@/lib/api')
    await api.post('/clientes', { nome: 'João' })
    const [, opts] = spy.mock.calls[0] as [string, RequestInit]
    expect(opts.method).toBe('POST')
    expect(opts.body).toBe(JSON.stringify({ nome: 'João' }))
  })

  it('PUT envia method: PUT e body JSON', async () => {
    const spy = mockFetch({ id: '1' })
    const { api } = await import('@/lib/api')
    await api.put('/produtos/1', { nome: 'Novo' })
    const [, opts] = spy.mock.calls[0] as [string, RequestInit]
    expect(opts.method).toBe('PUT')
    expect(opts.body).toBe(JSON.stringify({ nome: 'Novo' }))
  })

  it('DELETE envia method: DELETE sem body', async () => {
    const spy = mockFetchEmpty()
    const { api } = await import('@/lib/api')
    await api.delete('/produtos/1')
    const [, opts] = spy.mock.calls[0] as [string, RequestInit]
    expect(opts.method).toBe('DELETE')
    expect(opts.body).toBeUndefined()
  })
})

describe('API client — tratamento de erros', () => {
  it('lança Error com mensagem do campo detail (string)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Email já existe' }), { status: 400 })
    )
    const { api } = await import('@/lib/api')
    await expect(api.post('/auth/register', {})).rejects.toThrow('Email já existe')
  })

  it('lança Error com mensagem do campo detail (array de erros de validação)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ detail: [{ loc: ['body', 'nome'], msg: 'field required', type: 'missing' }] }),
        { status: 422 }
      )
    )
    const { api } = await import('@/lib/api')
    await expect(api.post('/clientes', {})).rejects.toThrow()
  })

  it('lança Error genérico quando response não tem detail', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Internal Server Error', { status: 500 })
    )
    const { api } = await import('@/lib/api')
    await expect(api.get('/qualquer')).rejects.toThrow(/500/)
  })

  it('resposta vazia retorna undefined sem lançar erro', async () => {
    mockFetchEmpty()
    const { api } = await import('@/lib/api')
    const result = await api.delete('/produtos/x')
    expect(result).toBeUndefined()
  })
})
