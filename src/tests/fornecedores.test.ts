/**
 * SDD — Serviço de Fornecedores
 * Spec: GET /fornecedores · POST /fornecedores · GET /fornecedores/{id}
 *       POST /fornecedores/{id}/compras · GET /fornecedores/dividas
 *       GET /fornecedores/dividas/total · GET /fornecedores/dividas/{id}
 *       POST /fornecedores/dividas/pagar
 *
 * TDD: todos os testes foram escritos antes de qualquer ajuste ao serviço.
 */
import { describe, it, expect } from 'vitest'
import { BASE, mockFetch } from './helpers'
import { fornecedoresService } from '@/services/fornecedores'

/* ── Fixtures ────────────────────────────────────────────────── */
const FORNECEDOR = {
  id: 'forn-uuid-1',
  nome: 'Distribuidora Central',
  telefone: '923456789',
  nif: '5000123456',
  endereco: 'Rua Principal, 123',
  criado_em: '2026-06-27T10:00:00Z',
}

const DIVIDA_FORNECEDOR = {
  id: 'div-forn-uuid-1',
  fornecedor_id: 'forn-uuid-1',
  fornecedor_nome: 'Distribuidora Central',
  produto_id: 'prod-uuid-1',
  produto_nome: 'Televisor Samsung 43"',
  quantidade: 50,
  valor_total: 50000,
  valor_pago: 0,
  saldo: 50000,
  status: 'DIVIDA',
  criado_em: '2026-06-27T10:00:00Z',
  pago_em: null,
}

const TOTAL_DIVIDAS = {
  quantidade_dividas: 3,
  total_devido: 150000,
}

/* ── listar ─────────────────────────────────────────────────── */
describe('fornecedoresService.listar — GET /fornecedores', () => {
  it('chama GET /fornecedores sem filtros', async () => {
    const spy = mockFetch([FORNECEDOR])
    await fornecedoresService.listar()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/fornecedores`)
  })

  it('retorna lista de FornecedorResponse', async () => {
    mockFetch([FORNECEDOR])
    const result = await fornecedoresService.listar()
    expect(result).toHaveLength(1)
    expect(result[0].nome).toBe('Distribuidora Central')
  })

  it('inclui skip e limit na query string quando fornecidos', async () => {
    const spy = mockFetch([FORNECEDOR])
    await fornecedoresService.listar({ skip: 10, limit: 20 })
    const url = spy.mock.calls[0][0] as string
    expect(url).toContain('skip=10')
    expect(url).toContain('limit=20')
  })
})

/* ── buscar ─────────────────────────────────────────────────── */
describe('fornecedoresService.buscar — GET /fornecedores/{id}', () => {
  it('chama GET /fornecedores/{id}', async () => {
    const spy = mockFetch(FORNECEDOR)
    await fornecedoresService.buscar('forn-uuid-1')
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/fornecedores/forn-uuid-1`)
  })

  it('retorna FornecedorResponse completo', async () => {
    mockFetch(FORNECEDOR)
    const result = await fornecedoresService.buscar('forn-uuid-1')
    expect(result.nif).toBe('5000123456')
    expect(result.endereco).toBe('Rua Principal, 123')
  })

  it('telefone/nif/endereco podem ser null', async () => {
    mockFetch({ ...FORNECEDOR, telefone: null, nif: null, endereco: null })
    const result = await fornecedoresService.buscar('forn-uuid-1')
    expect(result.telefone).toBeNull()
    expect(result.nif).toBeNull()
    expect(result.endereco).toBeNull()
  })
})

/* ── criar ──────────────────────────────────────────────────── */
describe('fornecedoresService.criar — POST /fornecedores', () => {
  it('chama POST /fornecedores com FornecedorCreate no body', async () => {
    const spy = mockFetch(FORNECEDOR, 201)
    const payload = { nome: 'Distribuidora Central', telefone: '923456789', nif: '5000123456', endereco: 'Rua Principal, 123' }
    await fornecedoresService.criar(payload)
    expect(spy).toHaveBeenCalledWith(
      `${BASE}/fornecedores`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) })
    )
  })

  it('aceita criação apenas com nome (campos opcionais omitidos)', async () => {
    const spy = mockFetch(FORNECEDOR, 201)
    await fornecedoresService.criar({ nome: 'Distribuidora Central' })
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body).toEqual({ nome: 'Distribuidora Central' })
  })

  it('retorna FornecedorResponse com id e criado_em', async () => {
    mockFetch(FORNECEDOR, 201)
    const result = await fornecedoresService.criar({ nome: 'Distribuidora Central' })
    expect(result.id).toBe('forn-uuid-1')
    expect(result.criado_em).toBe('2026-06-27T10:00:00Z')
  })
})

/* ── comprar ────────────────────────────────────────────────── */
describe('fornecedoresService.comprar — POST /fornecedores/{id}/compras', () => {
  it('chama POST /fornecedores/{id}/compras com CompraFornecedorCreate no body', async () => {
    const spy = mockFetch(DIVIDA_FORNECEDOR, 201)
    const payload = { produto_id: 'prod-uuid-1', quantidade: 50, preco_unitario: 1000 }
    await fornecedoresService.comprar('forn-uuid-1', payload)
    expect(spy).toHaveBeenCalledWith(
      `${BASE}/fornecedores/forn-uuid-1/compras`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) })
    )
  })

  it('retorna DividaFornecedorResponse com saldo = valor_total quando ainda não paga', async () => {
    mockFetch(DIVIDA_FORNECEDOR, 201)
    const result = await fornecedoresService.comprar('forn-uuid-1', {
      produto_id: 'prod-uuid-1', quantidade: 50, preco_unitario: 1000,
    })
    expect(result.status).toBe('DIVIDA')
    expect(result.saldo).toBe(result.valor_total - result.valor_pago)
  })
})

/* ── dividas.listar ─────────────────────────────────────────── */
describe('fornecedoresService.dividas.listar — GET /fornecedores/dividas', () => {
  it('chama GET /fornecedores/dividas sem filtros', async () => {
    const spy = mockFetch([DIVIDA_FORNECEDOR])
    await fornecedoresService.dividas.listar()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/fornecedores/dividas`)
  })

  it('inclui fornecedor_id e status na query string quando fornecidos', async () => {
    const spy = mockFetch([DIVIDA_FORNECEDOR])
    await fornecedoresService.dividas.listar({ fornecedor_id: 'forn-uuid-1', status: 'DIVIDA' })
    const url = spy.mock.calls[0][0] as string
    expect(url).toContain('fornecedor_id=forn-uuid-1')
    expect(url).toContain('status=DIVIDA')
  })

  it('retorna lista de DividaFornecedorResponse', async () => {
    mockFetch([DIVIDA_FORNECEDOR])
    const result = await fornecedoresService.dividas.listar()
    expect(result).toHaveLength(1)
    expect(result[0].fornecedor_nome).toBe('Distribuidora Central')
  })
})

/* ── dividas.total ──────────────────────────────────────────── */
describe('fornecedoresService.dividas.total — GET /fornecedores/dividas/total', () => {
  it('chama GET /fornecedores/dividas/total', async () => {
    const spy = mockFetch(TOTAL_DIVIDAS)
    await fornecedoresService.dividas.total()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/fornecedores/dividas/total`)
  })

  it('retorna TotalDividasFornecedorResponse com quantidade e total_devido', async () => {
    mockFetch(TOTAL_DIVIDAS)
    const result = await fornecedoresService.dividas.total()
    expect(result.quantidade_dividas).toBe(3)
    expect(result.total_devido).toBe(150000)
  })
})

/* ── dividas.buscar ─────────────────────────────────────────── */
describe('fornecedoresService.dividas.buscar — GET /fornecedores/dividas/{id}', () => {
  it('chama GET /fornecedores/dividas/{id}', async () => {
    const spy = mockFetch(DIVIDA_FORNECEDOR)
    await fornecedoresService.dividas.buscar('div-forn-uuid-1')
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/fornecedores/dividas/div-forn-uuid-1`)
  })
})

/* ── dividas.pagar ──────────────────────────────────────────── */
describe('fornecedoresService.dividas.pagar — POST /fornecedores/dividas/pagar', () => {
  it('chama POST /fornecedores/dividas/pagar com divida_id e valor no body', async () => {
    const spy = mockFetch({ ...DIVIDA_FORNECEDOR, valor_pago: 50000, saldo: 0, status: 'PAGA', pago_em: '2026-06-28T09:00:00Z' })
    const payload = { divida_id: 'div-forn-uuid-1', valor: 50000 }
    await fornecedoresService.dividas.pagar(payload)
    expect(spy).toHaveBeenCalledWith(
      `${BASE}/fornecedores/dividas/pagar`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) })
    )
  })

  it('marca dívida como PAGA quando valor pago atinge o total', async () => {
    mockFetch({ ...DIVIDA_FORNECEDOR, valor_pago: 50000, saldo: 0, status: 'PAGA', pago_em: '2026-06-28T09:00:00Z' })
    const result = await fornecedoresService.dividas.pagar({ divida_id: 'div-forn-uuid-1', valor: 50000 })
    expect(result.status).toBe('PAGA')
    expect(result.saldo).toBe(0)
    expect(result.pago_em).not.toBeNull()
  })

  it('aceita pagamento parcial (saldo permanece positivo)', async () => {
    mockFetch({ ...DIVIDA_FORNECEDOR, valor_pago: 20000, saldo: 30000, status: 'DIVIDA' })
    const result = await fornecedoresService.dividas.pagar({ divida_id: 'div-forn-uuid-1', valor: 20000 })
    expect(result.status).toBe('DIVIDA')
    expect(result.saldo).toBe(30000)
  })
})
