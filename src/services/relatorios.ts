import { api } from '@/lib/api'
import type {
  RelatorioVendasPeriodo,
  RelatorioClienteFiel,
  RelatorioClienteInativo,
  RelatorioProdutoVendido,
  RelatorioVendaCliente,
  ProdutoStockBaixo,
  ExtratoCliente,
  RelatorioLucroProduto,
  RelatorioMetasProgresso,
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

  extratoCliente: (clienteId: string) =>
    api.get<ExtratoCliente>(`/relatorios/clientes/${clienteId}/extrato`),

  // Sem data_inicio/data_fim, considera todo o histórico de vendas.
  lucroPorProduto: (params?: { data_inicio?: string; data_fim?: string; nome?: string; limite?: number }) =>
    api.get<RelatorioLucroProduto[]>('/relatorios/produtos/lucro', params),

  // `periodo` no formato YYYY-MM. Sem periodo/nome, traz as metas activas hoje.
  metasProgresso: (params?: { periodo?: string; nome?: string; limite?: number; incluir_totais?: boolean }) =>
    api.get<RelatorioMetasProgresso>('/relatorios/metas/progresso', params),
}
