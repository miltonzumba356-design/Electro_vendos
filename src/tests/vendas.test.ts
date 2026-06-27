/**
 * SDD — Serviço de Vendas
 * Spec: GET /vendas · POST /vendas · GET /vendas/{id}
 */
import { describe, it, expect } from 'vitest'
import { BASE, mockFetch } from './helpers'
import { vendasService } from '@/services/vendas'

const ITEM_VENDA = {
  id: 'item-uuid-1', produto_id: 'prod-uuid-1', produto_nome: 'Arroz Agulha 5kg',
  quantidade: 2, preco_unitario: 2500, iva_aplicado: 14, subtotal: 5000,
}
const VENDA = {
  id: 'venda-uuid-1', cliente_id: 'cli-uuid-1', cliente_nome: 'João dos Santos',
  utilizador_nome: 'Admin', total_sem_iva: 5000, total_iva: 700, total_com_iva: 5700,
  desconto_percentual: 0, total_desconto: 0, total_final: 5700,
  criado_em: '2026-06-27T14:30:00Z', itens: [ITEM_VENDA],
}

describe('vendasService.listar — GET /vendas', () => {
  it('chama GET /vendas', async () => {
    const spy = mockFetch([VENDA])
    await vendasService.listar()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/vendas`)
  })

  it('retorna array de VendaResponse com itens', async () => {
    mockFetch([VENDA])
    const result = await vendasService.listar()
    expect(result[0].itens).toHaveLength(1)
    expect(result[0].total_final).toBe(5700)
  })

  it('GET /vendas não tem query params (filtro de role feito pelo backend)', async () => {
    const spy = mockFetch([VENDA])
    await vendasService.listar()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/vendas`)
  })
})

describe('vendasService.criar — POST /vendas', () => {
  it('chama POST /vendas com VendaCreate contendo itens', async () => {
    const spy = mockFetch(VENDA, 201)
    const payload = { cliente_id: 'cli-uuid-1', itens: [{ produto_id: 'prod-uuid-1', quantidade: 2 }] }
    await vendasService.criar(payload)
    expect(spy).toHaveBeenCalledWith(`${BASE}/vendas`, expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }))
  })

  it('venda sem cliente existente — aceita campo cliente inline', async () => {
    const spy = mockFetch(VENDA, 201)
    const payload = {
      cliente: { nome: 'Cliente Novo', telefone: '923000000' },
      itens: [{ produto_id: 'prod-uuid-1', quantidade: 1 }],
    }
    await vendasService.criar(payload)
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.cliente.nome).toBe('Cliente Novo')
    expect(body.itens).toHaveLength(1)
  })

  it('retorna VendaResponse com totais calculados (total_final inclui IVA)', async () => {
    mockFetch(VENDA, 201)
    const result = await vendasService.criar({ itens: [{ produto_id: 'prod-uuid-1', quantidade: 2 }] })
    expect(result.total_iva).toBe(700)
    expect(result.total_final).toBe(5700)
    expect(result.itens[0].iva_aplicado).toBe(14)
  })
})

describe('vendasService.buscar — GET /vendas/{id}', () => {
  it('chama GET /vendas/{id}', async () => {
    const spy = mockFetch(VENDA)
    await vendasService.buscar('venda-uuid-1')
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/vendas/venda-uuid-1`)
  })

  it('retorna VendaResponse completo com itens da venda', async () => {
    mockFetch(VENDA)
    const result = await vendasService.buscar('venda-uuid-1')
    expect(result.id).toBe('venda-uuid-1')
    expect(result.itens[0].produto_nome).toBe('Arroz Agulha 5kg')
  })
})
