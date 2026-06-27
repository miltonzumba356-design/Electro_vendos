/**
 * SDD — Serviço de Prestações
 * Spec: GET /prestacoes · POST /prestacoes · GET /prestacoes/{id} ·
 *       POST /prestacoes/{id}/pagamentos · GET /prestacoes/clientes/{id}/dividas
 */
import { describe, it, expect } from 'vitest'
import { BASE, mockFetch } from './helpers'
import { prestacoesService } from '@/services/prestacoes'

const PAGAMENTO = { id: 'pag-uuid-1', valor: 25000, data_vencimento: '2026-07-01T00:00:00Z', data_pagamento: null, pago: false }
const PRESTACAO = {
  id: 'prest-uuid-1', venda_id: 'venda-uuid-1', cliente_id: 'cli-uuid-1',
  cliente_nome: 'Ana Cristina', valor_total: 150000, valor_pago: 50000, saldo: 100000,
  numero_prestacoes: 6, situacao: 'PARCIAL', criado_em: '2026-06-27T14:30:00Z', pagamentos: [PAGAMENTO],
}
const DIVIDA = {
  cliente_id: 'cli-uuid-1', cliente_nome: 'Ana Cristina', total_dividas: 2,
  valor_total_devido: 300000, valor_total_pago: 100000, saldo_aberto: 200000, prestacoes: [PRESTACAO],
}

describe('prestacoesService.listar — GET /prestacoes', () => {
  it('chama GET /prestacoes', async () => {
    const spy = mockFetch([PRESTACAO])
    await prestacoesService.listar()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/prestacoes`)
  })

  it('retorna array de PrestacaoResponse com pagamentos[]', async () => {
    mockFetch([PRESTACAO])
    const result = await prestacoesService.listar()
    expect(result[0].pagamentos).toHaveLength(1)
    expect(result[0].situacao).toBe('PARCIAL')
  })
})

describe('prestacoesService.criar — POST /prestacoes', () => {
  it('chama POST /prestacoes com PrestacaoCreate', async () => {
    const spy = mockFetch(PRESTACAO, 201)
    const payload = { venda_id: 'venda-uuid-1', numero_prestacoes: 6 }
    await prestacoesService.criar(payload)
    expect(spy).toHaveBeenCalledWith(`${BASE}/prestacoes`, expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }))
  })

  it('numero_prestacoes mínimo 1', async () => {
    const spy = mockFetch(PRESTACAO, 201)
    await prestacoesService.criar({ venda_id: 'venda-uuid-1', numero_prestacoes: 1 })
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.numero_prestacoes).toBe(1)
  })

  it('numero_prestacoes máximo 48', async () => {
    const spy = mockFetch(PRESTACAO, 201)
    await prestacoesService.criar({ venda_id: 'venda-uuid-1', numero_prestacoes: 48 })
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.numero_prestacoes).toBe(48)
  })

  it('retorna PrestacaoResponse com situacao PENDENTE inicialmente', async () => {
    mockFetch({ ...PRESTACAO, situacao: 'PENDENTE', valor_pago: 0, saldo: 150000 }, 201)
    const result = await prestacoesService.criar({ venda_id: 'venda-uuid-1', numero_prestacoes: 6 })
    expect(result.situacao).toBe('PENDENTE')
    expect(result.saldo).toBe(150000)
  })
})

describe('prestacoesService.buscar — GET /prestacoes/{id}', () => {
  it('chama GET /prestacoes/{id}', async () => {
    const spy = mockFetch(PRESTACAO)
    await prestacoesService.buscar('prest-uuid-1')
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/prestacoes/prest-uuid-1`)
  })

  it('retorna PrestacaoResponse com detalhes completos', async () => {
    mockFetch(PRESTACAO)
    const result = await prestacoesService.buscar('prest-uuid-1')
    expect(result.valor_total).toBe(150000)
    expect(result.numero_prestacoes).toBe(6)
  })
})

describe('prestacoesService.registarPagamento — POST /prestacoes/{id}/pagamentos', () => {
  it('chama POST /prestacoes/{id}/pagamentos com PagamentoCreate', async () => {
    const spy = mockFetch({ ...PRESTACAO, valor_pago: 75000, saldo: 75000 })
    const payload = { valor: 25000, data_pagamento: '2026-07-27T14:30:00Z' }
    await prestacoesService.registarPagamento('prest-uuid-1', payload)
    expect(spy).toHaveBeenCalledWith(
      `${BASE}/prestacoes/prest-uuid-1/pagamentos`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) })
    )
  })

  it('retorna PrestacaoResponse actualizado com novo saldo', async () => {
    mockFetch({ ...PRESTACAO, valor_pago: 75000, saldo: 75000, situacao: 'PARCIAL' })
    const result = await prestacoesService.registarPagamento('prest-uuid-1', { valor: 25000, data_pagamento: '2026-07-27T00:00:00Z' })
    expect(result.saldo).toBe(75000)
  })

  it('situacao muda para PAGO quando saldo chega a zero', async () => {
    mockFetch({ ...PRESTACAO, valor_pago: 150000, saldo: 0, situacao: 'PAGO' })
    const result = await prestacoesService.registarPagamento('prest-uuid-1', { valor: 100000, data_pagamento: '2026-08-01T00:00:00Z' })
    expect(result.situacao).toBe('PAGO')
    expect(result.saldo).toBe(0)
  })
})

describe('prestacoesService.dividasCliente — GET /prestacoes/clientes/{id}/dividas', () => {
  it('chama GET /prestacoes/clientes/{cliente_id}/dividas', async () => {
    const spy = mockFetch(DIVIDA)
    await prestacoesService.dividasCliente('cli-uuid-1')
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/prestacoes/clientes/cli-uuid-1/dividas`)
  })

  it('retorna ClienteDividaResponse com saldo_aberto e prestacoes', async () => {
    mockFetch(DIVIDA)
    const result = await prestacoesService.dividasCliente('cli-uuid-1')
    expect(result.saldo_aberto).toBe(200000)
    expect(result.total_dividas).toBe(2)
    expect(result.prestacoes).toHaveLength(1)
  })

  it('cliente sem dívidas retorna saldo_aberto = 0 e prestacoes = []', async () => {
    mockFetch({ ...DIVIDA, total_dividas: 0, valor_total_devido: 0, valor_total_pago: 0, saldo_aberto: 0, prestacoes: [] })
    const result = await prestacoesService.dividasCliente('cli-uuid-2')
    expect(result.saldo_aberto).toBe(0)
    expect(result.prestacoes).toHaveLength(0)
  })
})
