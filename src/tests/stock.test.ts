/**
 * SDD — Serviço de Stock
 * Spec: POST /stock/movimento · GET /stock/movimentos · GET /stock/movimentos?produto_id=
 */
import { describe, it, expect } from 'vitest'
import { BASE, mockFetch } from './helpers'
import { stockService } from '@/services/stock'

const MOVIMENTO = {
  id: 'mov-uuid-1', produto_id: 'prod-uuid-1', produto_nome: 'Arroz Agulha 5kg',
  tipo: 'ENTRADA', quantidade: 20, motivo: 'Reposição de stock', preco_unitario: 1500,
  utilizador_nome: 'Admin', criado_em: '2026-06-27T10:00:00Z',
}

describe('stockService.registarMovimento — POST /stock/movimento', () => {
  it('chama POST /stock/movimento com MovimentoCreate no body', async () => {
    const spy = mockFetch(MOVIMENTO, 201)
    const payload = { produto_id: 'prod-uuid-1', tipo: 'ENTRADA' as const, quantidade: 20, motivo: 'Reposição', preco_unitario: 1500 }
    await stockService.registarMovimento(payload)
    expect(spy).toHaveBeenCalledWith(`${BASE}/stock/movimento`, expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }))
  })

  it('ENTRADA — regista entrada de stock', async () => {
    mockFetch({ ...MOVIMENTO, tipo: 'ENTRADA' }, 201)
    const result = await stockService.registarMovimento({ produto_id: 'prod-uuid-1', tipo: 'ENTRADA', quantidade: 20 })
    expect(result.tipo).toBe('ENTRADA')
    expect(result.quantidade).toBe(20)
  })

  it('SAIDA — regista saída de stock', async () => {
    mockFetch({ ...MOVIMENTO, tipo: 'SAIDA', quantidade: 5 }, 201)
    const result = await stockService.registarMovimento({ produto_id: 'prod-uuid-1', tipo: 'SAIDA', quantidade: 5 })
    expect(result.tipo).toBe('SAIDA')
  })

  it('retorna MovimentoResponse com utilizador_nome', async () => {
    mockFetch(MOVIMENTO, 201)
    const result = await stockService.registarMovimento({ produto_id: 'prod-uuid-1', tipo: 'ENTRADA', quantidade: 1 })
    expect(result.utilizador_nome).toBe('Admin')
  })
})

describe('stockService.listarMovimentos — GET /stock/movimentos', () => {
  it('chama GET /stock/movimentos sem filtro', async () => {
    const spy = mockFetch([MOVIMENTO])
    await stockService.listarMovimentos()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/stock/movimentos`)
  })

  it('chama GET /stock/movimentos?produto_id=xxx quando produto_id fornecido', async () => {
    const spy = mockFetch([MOVIMENTO])
    await stockService.listarMovimentos('prod-uuid-1')
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/stock/movimentos?produto_id=prod-uuid-1`)
  })

  it('retorna array de MovimentoResponse', async () => {
    mockFetch([MOVIMENTO, { ...MOVIMENTO, id: 'mov-uuid-2', tipo: 'SAIDA', quantidade: 5 }])
    const result = await stockService.listarMovimentos()
    expect(result).toHaveLength(2)
    expect(result[1].tipo).toBe('SAIDA')
  })
})
