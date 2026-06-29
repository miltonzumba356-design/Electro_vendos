/**
 * SDD — Serviço de Prestações
 * Spec: GET /prestacoes · POST /prestacoes · GET /prestacoes/{id}
 *       POST /prestacoes/{id}/pagamentos · GET /prestacoes/clientes/{id}/dividas
 *       GET /prestacoes/vencimentos-mes
 *
 * TDD: testes escritos com base no schema actualizado da API (sem venda_id).
 * PrestacaoCreate: { cliente_id, produto_id, valor_total, numero_prestacoes, data_inicio?, taxa_multa? }
 */
import { describe, it, expect } from 'vitest'
import { BASE, mockFetch } from './helpers'
import { prestacoesService } from '@/services/prestacoes'

/* ── Fixtures alinhadas com o schema actual da API ─────────── */
const PAGAMENTO = {
  id: 'pag-uuid-1',
  valor: 25000,
  data_vencimento: '2026-07-01T00:00:00Z',
  data_pagamento: null,
  pago: false,
  multa: 0,
}

const PAGAMENTO_ATRASADO = {
  ...PAGAMENTO,
  id: 'pag-uuid-2',
  pago: false,
  multa: 1250,          // 5% de taxa sobre 25 000
}

const PRESTACAO = {
  id: 'prest-uuid-1',
  produto_id: 'prod-uuid-1',
  produto_nome: 'Televisor Samsung 43"',
  cliente_id: 'cli-uuid-1',
  cliente_nome: 'Ana Cristina',
  valor_total: 150000,
  valor_pago: 50000,
  saldo: 100000,
  numero_prestacoes: 6,
  taxa_multa: 5,
  data_inicio: '2026-01-01T00:00:00Z',
  situacao: 'PARCIAL',
  criado_em: '2026-06-27T14:30:00Z',
  pagamentos: [PAGAMENTO],
}

const VENCIMENTO = {
  prestacao_id: 'prest-uuid-1',
  pagamento_id: 'pag-uuid-2',
  cliente_nome: 'Ana Cristina',
  produto_nome: 'Televisor Samsung 43"',
  valor: 25000,
  data_vencimento: '2026-06-01T00:00:00Z',
  dias_atraso: 28,
}

const DIVIDA = {
  cliente_id: 'cli-uuid-1',
  cliente_nome: 'Ana Cristina',
  total_dividas: 2,
  valor_total_devido: 300000,
  valor_total_pago: 100000,
  saldo_aberto: 200000,
  prestacoes: [PRESTACAO],
}

/* ── listar ─────────────────────────────────────────────────── */
describe('prestacoesService.listar — GET /prestacoes', () => {
  it('chama GET /prestacoes', async () => {
    const spy = mockFetch([PRESTACAO])
    await prestacoesService.listar()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/prestacoes`)
  })

  it('retorna PrestacaoResponse[] com os novos campos do schema', async () => {
    mockFetch([PRESTACAO])
    const result = await prestacoesService.listar()
    const p = result[0]
    expect(p.produto_id).toBe('prod-uuid-1')
    expect(p.produto_nome).toBe('Televisor Samsung 43"')
    expect(p.taxa_multa).toBe(5)
    expect(p.data_inicio).toBe('2026-01-01T00:00:00Z')
  })

  it('pagamentos contêm campo multa', async () => {
    mockFetch([{ ...PRESTACAO, pagamentos: [PAGAMENTO_ATRASADO] }])
    const result = await prestacoesService.listar()
    expect(result[0].pagamentos[0].multa).toBe(1250)
  })

  it('retorna array vazio quando não há prestações', async () => {
    mockFetch([])
    const result = await prestacoesService.listar()
    expect(result).toHaveLength(0)
  })
})

/* ── criar ──────────────────────────────────────────────────── */
describe('prestacoesService.criar — POST /prestacoes', () => {
  it('envia POST /prestacoes com o novo payload (sem venda_id)', async () => {
    const spy = mockFetch(PRESTACAO, 201)
    const payload = {
      cliente_id: 'cli-uuid-1',
      produto_id: 'prod-uuid-1',
      valor_total: 150000,
      numero_prestacoes: 6,
    }
    await prestacoesService.criar(payload)
    expect(spy).toHaveBeenCalledWith(
      `${BASE}/prestacoes`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) })
    )
  })

  it('não deve enviar venda_id no payload', async () => {
    const spy = mockFetch(PRESTACAO, 201)
    await prestacoesService.criar({
      cliente_id: 'cli-uuid-1',
      produto_id: 'prod-uuid-1',
      valor_total: 150000,
      numero_prestacoes: 6,
    })
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body).not.toHaveProperty('venda_id')
  })

  it('envia taxa_multa e data_inicio opcionais quando fornecidos', async () => {
    const spy = mockFetch(PRESTACAO, 201)
    const payload = {
      cliente_id: 'cli-uuid-1',
      produto_id: 'prod-uuid-1',
      valor_total: 150000,
      numero_prestacoes: 12,
      taxa_multa: 5,
      data_inicio: '2026-07-01T00:00:00Z',
    }
    await prestacoesService.criar(payload)
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.taxa_multa).toBe(5)
    expect(body.data_inicio).toBe('2026-07-01T00:00:00Z')
  })

  it('numero_prestacoes mínimo: 1', async () => {
    const spy = mockFetch(PRESTACAO, 201)
    await prestacoesService.criar({
      cliente_id: 'cli-uuid-1', produto_id: 'prod-uuid-1', valor_total: 50000, numero_prestacoes: 1,
    })
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.numero_prestacoes).toBe(1)
  })

  it('numero_prestacoes máximo: 48', async () => {
    const spy = mockFetch(PRESTACAO, 201)
    await prestacoesService.criar({
      cliente_id: 'cli-uuid-1', produto_id: 'prod-uuid-1', valor_total: 480000, numero_prestacoes: 48,
    })
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.numero_prestacoes).toBe(48)
  })

  it('retorna PrestacaoResponse com produto_nome e taxa_multa', async () => {
    mockFetch({ ...PRESTACAO, situacao: 'PENDENTE', valor_pago: 0, saldo: 150000 }, 201)
    const result = await prestacoesService.criar({
      cliente_id: 'cli-uuid-1', produto_id: 'prod-uuid-1', valor_total: 150000, numero_prestacoes: 6,
    })
    expect(result.produto_nome).toBe('Televisor Samsung 43"')
    expect(result.taxa_multa).toBe(5)
    expect(result.situacao).toBe('PENDENTE')
    expect(result.saldo).toBe(150000)
  })
})

/* ── buscar ─────────────────────────────────────────────────── */
describe('prestacoesService.buscar — GET /prestacoes/{id}', () => {
  it('chama GET /prestacoes/{id}', async () => {
    const spy = mockFetch(PRESTACAO)
    await prestacoesService.buscar('prest-uuid-1')
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/prestacoes/prest-uuid-1`)
  })

  it('retorna PrestacaoResponse com todos os campos do novo schema', async () => {
    mockFetch(PRESTACAO)
    const result = await prestacoesService.buscar('prest-uuid-1')
    expect(result.produto_id).toBe('prod-uuid-1')
    expect(result.produto_nome).toBe('Televisor Samsung 43"')
    expect(result.data_inicio).toBe('2026-01-01T00:00:00Z')
    expect(result.taxa_multa).toBe(5)
  })

  it('pagamentos incluem campo multa', async () => {
    mockFetch({ ...PRESTACAO, pagamentos: [PAGAMENTO_ATRASADO] })
    const result = await prestacoesService.buscar('prest-uuid-1')
    expect(result.pagamentos[0].multa).toBe(1250)
  })
})

/* ── registarPagamento ──────────────────────────────────────── */
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
    const result = await prestacoesService.registarPagamento('prest-uuid-1', {
      valor: 25000, data_pagamento: '2026-07-27T00:00:00Z',
    })
    expect(result.saldo).toBe(75000)
  })

  it('situacao muda para PAGO quando saldo chega a zero', async () => {
    mockFetch({ ...PRESTACAO, valor_pago: 150000, saldo: 0, situacao: 'PAGO' })
    const result = await prestacoesService.registarPagamento('prest-uuid-1', {
      valor: 100000, data_pagamento: '2026-08-01T00:00:00Z',
    })
    expect(result.situacao).toBe('PAGO')
    expect(result.saldo).toBe(0)
  })
})

/* ── dividasCliente ─────────────────────────────────────────── */
describe('prestacoesService.dividasCliente — GET /prestacoes/clientes/{id}/dividas', () => {
  it('chama GET /prestacoes/clientes/{cliente_id}/dividas', async () => {
    const spy = mockFetch(DIVIDA)
    await prestacoesService.dividasCliente('cli-uuid-1')
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/prestacoes/clientes/cli-uuid-1/dividas`)
  })

  it('retorna ClienteDividaResponse com saldo_aberto e prestacoes[]', async () => {
    mockFetch(DIVIDA)
    const result = await prestacoesService.dividasCliente('cli-uuid-1')
    expect(result.saldo_aberto).toBe(200000)
    expect(result.total_dividas).toBe(2)
    expect(result.prestacoes).toHaveLength(1)
  })

  it('prestações na dívida incluem produto_nome e taxa_multa', async () => {
    mockFetch(DIVIDA)
    const result = await prestacoesService.dividasCliente('cli-uuid-1')
    expect(result.prestacoes[0].produto_nome).toBe('Televisor Samsung 43"')
    expect(result.prestacoes[0].taxa_multa).toBe(5)
  })

  it('cliente sem dívidas retorna saldo_aberto = 0 e prestacoes = []', async () => {
    mockFetch({
      ...DIVIDA, total_dividas: 0, valor_total_devido: 0,
      valor_total_pago: 0, saldo_aberto: 0, prestacoes: [],
    })
    const result = await prestacoesService.dividasCliente('cli-uuid-2')
    expect(result.saldo_aberto).toBe(0)
    expect(result.prestacoes).toHaveLength(0)
  })
})

/* ── vencimentosMes ─────────────────────────────────────────── */
describe('prestacoesService.vencimentosMes — GET /prestacoes/vencimentos-mes', () => {
  it('chama GET /prestacoes/vencimentos-mes com ano e mes', async () => {
    const spy = mockFetch([VENCIMENTO])
    await prestacoesService.vencimentosMes(2026, 6)
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/prestacoes/vencimentos-mes?ano=2026&mes=6`)
  })

  it('retorna VencimentoResponse[] com todos os campos', async () => {
    mockFetch([VENCIMENTO])
    const result = await prestacoesService.vencimentosMes(2026, 6)
    const v = result[0]
    expect(v.prestacao_id).toBe('prest-uuid-1')
    expect(v.cliente_nome).toBe('Ana Cristina')
    expect(v.produto_nome).toBe('Televisor Samsung 43"')
    expect(v.valor).toBe(25000)
    expect(v.dias_atraso).toBe(28)
  })

  it('retorna array vazio quando não há vencimentos no mês', async () => {
    mockFetch([])
    const result = await prestacoesService.vencimentosMes(2026, 12)
    expect(result).toHaveLength(0)
  })

  it('dias_atraso = 0 indica vencimento a tempo', async () => {
    mockFetch([{ ...VENCIMENTO, dias_atraso: 0 }])
    const result = await prestacoesService.vencimentosMes(2026, 7)
    expect(result[0].dias_atraso).toBe(0)
  })

  it('constrói URL correctamente para Janeiro (mes=1)', async () => {
    const spy = mockFetch([])
    await prestacoesService.vencimentosMes(2027, 1)
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/prestacoes/vencimentos-mes?ano=2027&mes=1`)
  })
})
