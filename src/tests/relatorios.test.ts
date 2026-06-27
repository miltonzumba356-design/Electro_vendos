/**
 * SDD — Serviço de Relatórios
 * Spec: /relatorios/vendas/* · /relatorios/clientes/* · /relatorios/produtos/* · /relatorios/stock/baixo
 */
import { describe, it, expect } from 'vitest'
import { BASE, mockFetch } from './helpers'
import { relatoriosService } from '@/services/relatorios'

const RESUMO = {
  total_vendas: 42, total_receita: 158000.5, total_sem_iva: 120000, total_iva: 28800,
  total_descontos: 5200, lucro_bruto: 45000, ticket_medio: 3761.92,
}
const CLIENTE_FIEL = {
  cliente_id: 'cli-uuid-1', cliente_nome: 'Ana Cristina', total_vendas: 22,
  total_gasto: 228000, nivel: 'OURO', ultima_compra: '2026-06-27T14:30:00Z', media_por_venda: 10363.64,
}
const CLIENTE_INATIVO = { id: 'cli-uuid-2', nome: 'Carlos Filipe', telefone: '999888777', email: 'carlos@email.com' }
const PRODUTO_VENDIDO = { produto_id: 'prod-uuid-1', produto_nome: 'Arroz Agulha 5kg', quantidade_vendida: 120, total_receita: 384000 }
const VENDA_CLIENTE = { cliente_id: 'cli-uuid-1', cliente_nome: 'Ana Cristina', total_compras: 22, total_gasto: 228000, media_por_venda: 10363.64 }
const STOCK_BAIXO = {
  id: 'prod-uuid-1', nome: 'Arroz', descricao: null, codigo_barras: null, preco_custo: 1500,
  preco_venda: 2500, iva: 14, margem_lucro: 66.67, preco_com_iva: 2850, stock_atual: 3,
  stock_minimo: 10, ativo: true, criado_em: '2026-01-01T00:00:00Z', diferenca: 7,
}

describe('relatoriosService.vendasPeriodo — GET /relatorios/vendas/periodo', () => {
  it('chama com data_inicio e data_fim como query params', async () => {
    const spy = mockFetch(RESUMO)
    await relatoriosService.vendasPeriodo('2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z')
    const url = spy.mock.calls[0][0] as string
    expect(url).toContain('/relatorios/vendas/periodo')
    expect(url).toContain('data_inicio=')
    expect(url).toContain('data_fim=')
  })

  it('retorna RelatorioVendasPeriodo com todos os campos da spec', async () => {
    mockFetch(RESUMO)
    const result = await relatoriosService.vendasPeriodo('2026-01-01T00:00:00Z', '2026-12-31T23:59:59Z')
    expect(result.total_vendas).toBe(42)
    expect(result.ticket_medio).toBe(3761.92)
    expect(result.lucro_bruto).toBe(45000)
  })
})

describe('relatoriosService.vendasDiario — GET /relatorios/vendas/diario', () => {
  it('chama sem query param quando data omitida (hoje)', async () => {
    const spy = mockFetch(RESUMO)
    await relatoriosService.vendasDiario()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/relatorios/vendas/diario`)
  })

  it('chama com ?data= quando data fornecida', async () => {
    const spy = mockFetch(RESUMO)
    await relatoriosService.vendasDiario('2026-06-27')
    expect(spy.mock.calls[0][0]).toContain('data=2026-06-27')
  })
})

describe('relatoriosService.vendasMensal — GET /relatorios/vendas/mensal', () => {
  it('chama com query params ?ano=&mes=', async () => {
    const spy = mockFetch(RESUMO)
    await relatoriosService.vendasMensal(2026, 6)
    const url = spy.mock.calls[0][0] as string
    expect(url).toContain('ano=2026')
    expect(url).toContain('mes=6')
  })

  it('mes pode ser 1 (Janeiro) ou 12 (Dezembro)', async () => {
    const spy = mockFetch(RESUMO)
    await relatoriosService.vendasMensal(2026, 12)
    expect(spy.mock.calls[0][0]).toContain('mes=12')
  })
})

describe('relatoriosService.clientesFieis — GET /relatorios/clientes/fieis', () => {
  it('chama com limite padrão 10', async () => {
    const spy = mockFetch([CLIENTE_FIEL])
    await relatoriosService.clientesFieis()
    expect(spy.mock.calls[0][0]).toContain('limite=10')
  })

  it('chama com limite personalizado', async () => {
    const spy = mockFetch([CLIENTE_FIEL])
    await relatoriosService.clientesFieis(25)
    expect(spy.mock.calls[0][0]).toContain('limite=25')
  })

  it('retorna RelatorioClienteFiel[] com nivel BRONZE/PRATA/OURO', async () => {
    mockFetch([CLIENTE_FIEL, { ...CLIENTE_FIEL, nivel: 'PRATA' }, { ...CLIENTE_FIEL, nivel: 'BRONZE' }])
    const result = await relatoriosService.clientesFieis()
    const niveis = result.map((r) => r.nivel)
    expect(niveis).toContain('OURO')
    expect(niveis).toContain('PRATA')
    expect(niveis).toContain('BRONZE')
  })
})

describe('relatoriosService.clientesInativos — GET /relatorios/clientes/inativos', () => {
  it('chama com dias padrão 90', async () => {
    const spy = mockFetch([CLIENTE_INATIVO])
    await relatoriosService.clientesInativos()
    expect(spy.mock.calls[0][0]).toContain('dias=90')
  })

  it('chama com dias personalizado', async () => {
    const spy = mockFetch([CLIENTE_INATIVO])
    await relatoriosService.clientesInativos(30)
    expect(spy.mock.calls[0][0]).toContain('dias=30')
  })

  it('retorna RelatorioClienteInativo[] com id, nome, telefone, email', async () => {
    mockFetch([CLIENTE_INATIVO])
    const result = await relatoriosService.clientesInativos()
    expect(result[0].id).toBe('cli-uuid-2')
    expect(result[0].nome).toBe('Carlos Filipe')
  })
})

describe('relatoriosService.produtosMaisVendidos — GET /relatorios/produtos/mais-vendidos', () => {
  it('chama com limite padrão 10', async () => {
    const spy = mockFetch([PRODUTO_VENDIDO])
    await relatoriosService.produtosMaisVendidos()
    expect(spy.mock.calls[0][0]).toContain('limite=10')
  })

  it('retorna RelatorioProdutoVendido[] com quantidade_vendida e total_receita', async () => {
    mockFetch([PRODUTO_VENDIDO])
    const result = await relatoriosService.produtosMaisVendidos()
    expect(result[0].quantidade_vendida).toBe(120)
    expect(result[0].total_receita).toBe(384000)
  })
})

describe('relatoriosService.vendasPorCliente — GET /relatorios/vendas/por-cliente', () => {
  it('chama com limite padrão 10', async () => {
    const spy = mockFetch([VENDA_CLIENTE])
    await relatoriosService.vendasPorCliente()
    expect(spy.mock.calls[0][0]).toContain('limite=10')
  })

  it('retorna RelatorioVendaCliente[] com total_compras e media_por_venda', async () => {
    mockFetch([VENDA_CLIENTE])
    const result = await relatoriosService.vendasPorCliente()
    expect(result[0].total_compras).toBe(22)
    expect(result[0].media_por_venda).toBe(10363.64)
  })
})

describe('relatoriosService.stockBaixo — GET /relatorios/stock/baixo', () => {
  it('chama GET /relatorios/stock/baixo sem query params', async () => {
    const spy = mockFetch([])
    await relatoriosService.stockBaixo()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/relatorios/stock/baixo`)
  })

  it('retorna ProdutoStockBaixo[] com campo diferenca', async () => {
    mockFetch([STOCK_BAIXO])
    const result = await relatoriosService.stockBaixo()
    expect(result[0].diferenca).toBe(7)
    expect(result[0].stock_atual).toBeLessThan(result[0].stock_minimo)
  })
})
