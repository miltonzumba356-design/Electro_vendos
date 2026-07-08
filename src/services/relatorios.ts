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
  // Sem data_inicio/data_fim, o backend traz sempre os dados de hoje.
  vendasPeriodo: (data_inicio?: string, data_fim?: string) =>
    api.get<RelatorioVendasPeriodo>('/relatorios/vendas/periodo', { data_inicio, data_fim }),

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
