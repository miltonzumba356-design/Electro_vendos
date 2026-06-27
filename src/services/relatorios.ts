import { api } from '@/lib/api'
import type {
  RelatorioVendasPeriodo,
  RelatorioClienteFiel,
  RelatorioClienteInativo,
  RelatorioProdutoVendido,
  RelatorioVendaCliente,
  ProdutoStockBaixo,
} from '@/types'

export const relatoriosService = {
  vendasPeriodo: (data_inicio: string, data_fim: string) =>
    api.get<RelatorioVendasPeriodo>('/relatorios/vendas/periodo', { data_inicio, data_fim }),

  vendasDiario: (data?: string) =>
    api.get<RelatorioVendasPeriodo>('/relatorios/vendas/diario', data ? { data } : undefined),

  vendasMensal: (ano: number, mes: number) =>
    api.get<RelatorioVendasPeriodo>('/relatorios/vendas/mensal', { ano, mes }),

  clientesFieis: (limite = 10) =>
    api.get<RelatorioClienteFiel[]>('/relatorios/clientes/fieis', { limite }),

  clientesInativos: (dias = 90) =>
    api.get<RelatorioClienteInativo[]>('/relatorios/clientes/inativos', { dias }),

  produtosMaisVendidos: (limite = 10) =>
    api.get<RelatorioProdutoVendido[]>('/relatorios/produtos/mais-vendidos', { limite }),

  vendasPorCliente: (limite = 10) =>
    api.get<RelatorioVendaCliente[]>('/relatorios/vendas/por-cliente', { limite }),

  stockBaixo: () =>
    api.get<ProdutoStockBaixo[]>('/relatorios/stock/baixo'),
}
