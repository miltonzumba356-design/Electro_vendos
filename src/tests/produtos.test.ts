/**
 * SDD — Serviço de Produtos
 * Spec: GET /produtos · POST /produtos · GET /produtos/{id} ·
 *       PUT /produtos/{id} · DELETE /produtos/{id} · GET /produtos/stock/baixo
 */
import { describe, it, expect, vi } from 'vitest'
import { BASE, mockFetch, mockFetchEmpty } from './helpers'
import { produtosService } from '@/services/produtos'

const PRODUTO = {
  id: 'prod-uuid-1', nome: 'Arroz Agulha 5kg', descricao: null, codigo_barras: '7891234567890',
  preco_custo: 1500, preco_venda: 2500, iva: 14, margem_lucro: 66.67, preco_com_iva: 2850,
  stock_atual: 50, stock_minimo: 10, ativo: true, criado_em: '2026-01-01T00:00:00Z',
}
const PRODUTO_STOCK_BAIXO = { ...PRODUTO, stock_atual: 3, diferenca: 7 }

describe('produtosService.listar — GET /produtos', () => {
  it('chama GET /produtos', async () => {
    const spy = mockFetch([PRODUTO])
    await produtosService.listar()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/produtos`)
  })

  it('retorna array de ProdutoResponse', async () => {
    mockFetch([PRODUTO, { ...PRODUTO, id: 'prod-uuid-2', nome: 'Óleo Girassol' }])
    const result = await produtosService.listar()
    expect(result).toHaveLength(2)
    expect(result[0].nome).toBe('Arroz Agulha 5kg')
  })
})

describe('produtosService.criar — POST /produtos', () => {
  it('chama POST /produtos com ProdutoCreate no body', async () => {
    const spy = mockFetch(PRODUTO, 201)
    const payload = { nome: 'Arroz Agulha 5kg', preco_custo: 1500, preco_venda: 2500, iva: 14, stock_atual: 50, stock_minimo: 10 }
    await produtosService.criar(payload)
    expect(spy).toHaveBeenCalledWith(`${BASE}/produtos`, expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }))
  })

  it('retorna ProdutoResponse com campos calculados (margem_lucro, preco_com_iva)', async () => {
    mockFetch(PRODUTO, 201)
    const result = await produtosService.criar({ nome: 'Arroz' })
    expect(result.margem_lucro).toBe(66.67)
    expect(result.preco_com_iva).toBe(2850)
  })
})

describe('produtosService.buscar — GET /produtos/{id}', () => {
  it('chama GET /produtos/{id}', async () => {
    const spy = mockFetch(PRODUTO)
    await produtosService.buscar('prod-uuid-1')
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/produtos/prod-uuid-1`)
  })

  it('retorna ProdutoResponse do produto específico', async () => {
    mockFetch(PRODUTO)
    const result = await produtosService.buscar('prod-uuid-1')
    expect(result.id).toBe('prod-uuid-1')
    expect(result.ativo).toBe(true)
  })
})

describe('produtosService.atualizar — PUT /produtos/{id}', () => {
  it('chama PUT /produtos/{id} com ProdutoUpdate no body', async () => {
    const spy = mockFetch(PRODUTO)
    await produtosService.atualizar('prod-uuid-1', { nome: 'Arroz Premium', preco_venda: 2800 })
    expect(spy).toHaveBeenCalledWith(
      `${BASE}/produtos/prod-uuid-1`,
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ nome: 'Arroz Premium', preco_venda: 2800 }) })
    )
  })

  it('retorna ProdutoResponse actualizado', async () => {
    mockFetch({ ...PRODUTO, nome: 'Arroz Premium', preco_venda: 2800 })
    const result = await produtosService.atualizar('prod-uuid-1', { nome: 'Arroz Premium' })
    expect(result.nome).toBe('Arroz Premium')
  })
})

describe('produtosService.remover — DELETE /produtos/{id}', () => {
  it('chama DELETE /produtos/{id}', async () => {
    const spy = mockFetchEmpty()
    await produtosService.remover('prod-uuid-1')
    expect(spy).toHaveBeenCalledWith(`${BASE}/produtos/prod-uuid-1`, expect.objectContaining({ method: 'DELETE' }))
  })

  it('não envia body no DELETE', async () => {
    const spy = mockFetchEmpty()
    await produtosService.remover('prod-uuid-1')
    const opts = spy.mock.calls[0][1] as RequestInit
    expect(opts.body).toBeUndefined()
  })
})

describe('produtosService.stockBaixo — GET /produtos/stock/baixo', () => {
  it('chama GET /produtos/stock/baixo', async () => {
    const spy = mockFetch([PRODUTO_STOCK_BAIXO])
    await produtosService.stockBaixo()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/produtos/stock/baixo`)
  })

  it('retorna ProdutoStockBaixo[] com campo diferenca', async () => {
    mockFetch([PRODUTO_STOCK_BAIXO])
    const result = await produtosService.stockBaixo()
    expect(result[0].diferenca).toBe(7)
    expect(result[0].stock_atual).toBe(3)
  })
})
