/**
 * SDD — Serviço de Vendas
 * Spec: GET /vendas · POST /vendas (com valor_final_desejado) · GET /vendas/{id} ·
 * POST /vendas/{id}/cancelar · POST /vendas/numero/{numero}/cancelar
 */
import { describe, it, expect, vi } from 'vitest'
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

  it('aceita valor_final_desejado — o sistema calcula o desconto automaticamente', async () => {
    const vendaComDesconto = {
      ...VENDA, total_com_iva: 5700, desconto_percentual: 12.2807, total_desconto: 700, total_final: 5000,
    }
    const spy = mockFetch(vendaComDesconto, 201)
    const payload = {
      cliente_id: 'cli-uuid-1',
      itens: [{ produto_id: 'prod-uuid-1', quantidade: 2 }],
      valor_final_desejado: 5000,
    }
    const result = await vendasService.criar(payload)
    expect(spy).toHaveBeenCalledWith(`${BASE}/vendas`, expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }))
    expect(result.total_final).toBe(5000)
    expect(result.desconto_percentual).toBeCloseTo(12.2807)
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

describe('vendasService.cancelar — POST /vendas/{id}/cancelar', () => {
  it('chama POST sem corpo e devolve a venda anulada', async () => {
    const anulada = { ...VENDA, cancelada_em: '2026-08-14T12:00:00Z' }
    const spy = mockFetch(anulada)
    const result = await vendasService.cancelar('venda-uuid-1')
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/vendas/venda-uuid-1/cancelar`)
    expect((spy.mock.calls[0][1] as RequestInit).method).toBe('POST')
    expect((spy.mock.calls[0][1] as RequestInit).body).toBeUndefined()
    expect(result.cancelada_em).toBe('2026-08-14T12:00:00Z')
  })

  it('propaga o erro 400 quando a dívida gerada já tem pagamento', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Não é possível anular: a dívida gerada por esta venda já tem pagamento registado. Resolva os pagamentos antes de anular.' }), { status: 400 })
    )
    await expect(vendasService.cancelar('venda-uuid-1')).rejects.toThrow('Resolva os pagamentos antes de anular')
  })
})

describe('vendasService.cancelarPorNumero — POST /vendas/numero/{numero}/cancelar', () => {
  it('chama POST /vendas/numero/{numero}/cancelar', async () => {
    const spy = mockFetch({ ...VENDA, cancelada_em: '2026-08-14T12:00:00Z' })
    await vendasService.cancelarPorNumero(1)
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/vendas/numero/1/cancelar`)
  })
})
