/**
 * SDD — Serviço de Dívidas
 * Spec: /dividas/clientes/{cliente_id} · /dividas · /dividas/total · /dividas/{id} · /dividas/{id}/pagar
 */
import { describe, it, expect } from 'vitest'
import { BASE, mockFetch } from './helpers'
import { dividasService } from '@/services/dividas'

const DIVIDA_RESP = {
  id: 'div-uuid-1', cliente_id: 'cli-uuid-1', cliente_nome: 'Ana Cristina',
  venda_id: 'venda-uuid-1', produto_nome: 'Arroz Agulha 5kg', valor_total: 25000,
  valor_pago: 10000, saldo: 15000, status: 'DIVIDA', criado_em: '2026-06-01T10:00:00Z', pago_em: null,
}

const TOTAL_RESP = {
  quantidade_dividas: 3, total_devido_dividas: 45000,
  quantidade_prestacoes: 2, total_devido_prestacoes: 80000,
  total_devido: 125000,
}

describe('dividasService.verificarCliente — GET /dividas/clientes/{cliente_id}', () => {
  it('chama GET /dividas/clientes/{id}', async () => {
    const spy = mockFetch({ tem_divida: true, dividas: [DIVIDA_RESP], total_devido: 15000, mensagem: null })
    await dividasService.verificarCliente('cli-uuid-1')
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/dividas/clientes/cli-uuid-1`)
  })
})

describe('dividasService.listar — GET /dividas', () => {
  it('chama GET /dividas sem params', async () => {
    const spy = mockFetch([DIVIDA_RESP])
    await dividasService.listar()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/dividas`)
  })

  it('chama com ?status= quando fornecido', async () => {
    const spy = mockFetch([DIVIDA_RESP])
    await dividasService.listar({ status: 'DIVIDA' })
    expect(spy.mock.calls[0][0] as string).toContain('status=DIVIDA')
  })
})

describe('dividasService.total — GET /dividas/total', () => {
  it('chama GET /dividas/total sem query params', async () => {
    const spy = mockFetch(TOTAL_RESP)
    await dividasService.total()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/dividas/total`)
  })

  it('retorna TotalDividasResponse somando dívidas e prestações', async () => {
    mockFetch(TOTAL_RESP)
    const result = await dividasService.total()
    expect(result.quantidade_dividas).toBe(3)
    expect(result.total_devido_dividas).toBe(45000)
    expect(result.quantidade_prestacoes).toBe(2)
    expect(result.total_devido_prestacoes).toBe(80000)
    expect(result.total_devido).toBe(result.total_devido_dividas + result.total_devido_prestacoes)
  })
})

describe('dividasService.buscar — GET /dividas/{id}', () => {
  it('chama GET /dividas/{id}', async () => {
    const spy = mockFetch(DIVIDA_RESP)
    await dividasService.buscar('div-uuid-1')
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/dividas/div-uuid-1`)
  })
})

describe('dividasService.pagar — POST /dividas/{id}/pagar', () => {
  it('chama POST /dividas/{id}/pagar com valor no body', async () => {
    const spy = mockFetch({ ...DIVIDA_RESP, valor_pago: 25000, saldo: 0, status: 'PAGA' })
    await dividasService.pagar('div-uuid-1', { valor: 15000 })
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/dividas/div-uuid-1/pagar`)
    expect((spy.mock.calls[0][1] as RequestInit).method).toBe('POST')
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.valor).toBe(15000)
  })
})
