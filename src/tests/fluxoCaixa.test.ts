/**
 * SDD — Serviço Fluxo de Caixa
 * Spec OpenAPI:
 *   POST /fluxo-caixa/lancamentos  — LancamentoCreate → LancamentoResponse (201)
 *   GET  /fluxo-caixa/lancamentos  — ?data_inicio? &data_fim? &categoria? → LancamentoListaResponse
 *   GET  /fluxo-caixa/saldo        — SaldoResponse
 */
import { describe, it, expect } from 'vitest'
import { BASE, mockFetch } from './helpers'
import { fluxoCaixaService } from '@/services/fluxoCaixa'

/* ── Fixtures ─────────────────────────────────────────────── */
const LANCAMENTO_RESP = {
  id: 'lanc-uuid-1',
  data_movimento: '2026-06-01',
  descricao: 'Venda balcão',
  tipo: 'ENTRADA',
  valor: 150000,
  categoria: 'VENDA',
  venda_id: null,
  prestacao_id: null,
  pagamento_prestacao_id: null,
  divida_id: null,
  movimento_stock_id: null,
  periodo_referencia: null,
  criado_em: '2026-06-01T10:00:00Z',
}

const LISTA_RESP = {
  total_lancamentos: 2,
  total_entradas: 500000,
  total_saidas: 250000,
  saldo_periodo: 250000,
  lancamentos: [
    LANCAMENTO_RESP,
    { ...LANCAMENTO_RESP, id: 'lanc-uuid-2', tipo: 'SAIDA', categoria: 'SALARIO', valor: 250000 },
  ],
}

const SALDO_RESP = {
  saldo_atual: 150000,
  total_entradas: 700000,
  total_saidas: 550000,
}

/* ── POST /fluxo-caixa/lancamentos ────────────────────────── */
describe('fluxoCaixaService.criarLancamento — POST /fluxo-caixa/lancamentos', () => {
  it('chama POST /fluxo-caixa/lancamentos', async () => {
    const spy = mockFetch(LANCAMENTO_RESP, 201)
    const payload = { data_movimento: '2026-06-01', descricao: 'Venda balcão', tipo: 'ENTRADA' as const, valor: 150000, categoria: 'VENDA' }
    await fluxoCaixaService.criarLancamento(payload)
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/fluxo-caixa/lancamentos`)
    expect((spy.mock.calls[0][1] as RequestInit).method).toBe('POST')
  })

  it('envia LancamentoCreate completo no body', async () => {
    const spy = mockFetch(LANCAMENTO_RESP, 201)
    const payload = { data_movimento: '2026-06-01', descricao: 'Salário', tipo: 'SAIDA' as const, valor: 250000, categoria: 'SALARIO' }
    await fluxoCaixaService.criarLancamento(payload)
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.data_movimento).toBe('2026-06-01')
    expect(body.tipo).toBe('SAIDA')
    expect(body.valor).toBe(250000)
    expect(body.categoria).toBe('SALARIO')
  })

  it('retorna LancamentoResponse com id, tipo e categoria', async () => {
    mockFetch(LANCAMENTO_RESP, 201)
    const result = await fluxoCaixaService.criarLancamento({
      data_movimento: '2026-06-01', descricao: 'Venda', tipo: 'ENTRADA', valor: 150000, categoria: 'VENDA',
    })
    expect(result.id).toBe('lanc-uuid-1')
    expect(result.tipo).toBe('ENTRADA')
    expect(result.categoria).toBe('VENDA')
  })

  it('tipo pode ser SAIDA para despesas', async () => {
    const spy = mockFetch({ ...LANCAMENTO_RESP, tipo: 'SAIDA', categoria: 'ENERGIA' }, 201)
    await fluxoCaixaService.criarLancamento({ data_movimento: '2026-06-01', descricao: 'Energia eléctrica', tipo: 'SAIDA', valor: 50000, categoria: 'ENERGIA' })
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.tipo).toBe('SAIDA')
    expect(body.categoria).toBe('ENERGIA')
  })
})

/* ── GET /fluxo-caixa/lancamentos ─────────────────────────── */
describe('fluxoCaixaService.listarLancamentos — GET /fluxo-caixa/lancamentos', () => {
  it('chama GET /fluxo-caixa/lancamentos sem params quando omitidos', async () => {
    const spy = mockFetch(LISTA_RESP)
    await fluxoCaixaService.listarLancamentos()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/fluxo-caixa/lancamentos`)
  })

  it('chama com ?data_inicio= e ?data_fim= quando fornecidos', async () => {
    const spy = mockFetch(LISTA_RESP)
    await fluxoCaixaService.listarLancamentos({ data_inicio: '2026-06-01', data_fim: '2026-06-30' })
    const url = spy.mock.calls[0][0] as string
    expect(url).toContain('data_inicio=2026-06-01')
    expect(url).toContain('data_fim=2026-06-30')
  })

  it('chama com ?categoria= quando filtro fornecido', async () => {
    const spy = mockFetch(LISTA_RESP)
    await fluxoCaixaService.listarLancamentos({ categoria: 'VENDA' })
    expect(spy.mock.calls[0][0] as string).toContain('categoria=VENDA')
  })

  it('retorna LancamentoListaResponse com saldo_periodo', async () => {
    mockFetch(LISTA_RESP)
    const result = await fluxoCaixaService.listarLancamentos()
    expect(result.saldo_periodo).toBe(250000)
    expect(result.total_lancamentos).toBe(2)
    expect(result.lancamentos).toHaveLength(2)
  })

  it('total_entradas - total_saidas = saldo_periodo', async () => {
    mockFetch(LISTA_RESP)
    const result = await fluxoCaixaService.listarLancamentos()
    expect(result.total_entradas - result.total_saidas).toBe(result.saldo_periodo)
  })
})

/* ── GET /fluxo-caixa/saldo ───────────────────────────────── */
describe('fluxoCaixaService.saldo — GET /fluxo-caixa/saldo', () => {
  it('chama GET /fluxo-caixa/saldo sem query params', async () => {
    const spy = mockFetch(SALDO_RESP)
    await fluxoCaixaService.saldo()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/fluxo-caixa/saldo`)
  })

  it('retorna SaldoResponse com saldo_atual, total_entradas e total_saidas', async () => {
    mockFetch(SALDO_RESP)
    const result = await fluxoCaixaService.saldo()
    expect(result.saldo_atual).toBe(150000)
    expect(result.total_entradas).toBe(700000)
    expect(result.total_saidas).toBe(550000)
  })

  it('saldo_atual = total_entradas - total_saidas', async () => {
    mockFetch(SALDO_RESP)
    const result = await fluxoCaixaService.saldo()
    expect(result.saldo_atual).toBe(result.total_entradas - result.total_saidas)
  })
})
