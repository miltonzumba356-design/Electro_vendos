// ── Auth ────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  nome: string
  role: string
}

export interface RegisterRequest {
  nome: string
  email: string
  password: string
  role?: string
}

export interface UtilizadorResponse {
  id: string
  nome: string
  email: string
  role: string
  ativo: boolean
}

// Todos os campos são opcionais — só envia o que quer alterar (PUT /auth/utilizadores/{id}).
export interface UtilizadorUpdate {
  nome?: string
  email?: string
  password?: string
  role?: string
  ativo?: boolean
}

// ── Produtos ────────────────────────────────────────────────────
export interface ProdutoCreate {
  nome: string
  descricao?: string | null
  codigo_barras?: string | null
  preco_custo?: number
  preco_venda?: number
  iva?: number
  stock_atual?: number
  stock_minimo?: number
}

export interface ProdutoUpdate {
  nome?: string | null
  descricao?: string | null
  codigo_barras?: string | null
  preco_custo?: number | null
  preco_venda?: number | null
  iva?: number | null
  stock_minimo?: number | null
}

export interface ProdutoResponse {
  id: string
  nome: string
  descricao: string | null
  codigo_barras: string | null
  preco_custo: number
  preco_venda: number
  iva: number
  margem_lucro: number
  preco_com_iva: number
  stock_atual: number
  stock_minimo: number
  ativo: boolean
  criado_em: string
}

export interface ProdutoStockBaixo extends ProdutoResponse {
  diferenca: number
}

export interface ValorizacaoStockProduto {
  produto_id: string
  produto_nome: string
  stock_atual: number
  preco_custo_unitario: number
  valor_em_stock_custo: number
  preco_venda_unitario: number
  valor_em_stock_venda: number
}

export interface ValorizacaoStockTotais {
  quantidade_produtos: number
  unidades_em_stock: number
  valor_total_custo: number
  valor_total_venda: number
  lucro_potencial: number
}

export interface ValorizacaoStockResponse {
  produtos: ValorizacaoStockProduto[]
  totais: ValorizacaoStockTotais
}

// ── Clientes ────────────────────────────────────────────────────
export interface ClienteCreate {
  nome: string
  telefone?: string | null
  email?: string | null
  nif?: string | null
  endereco?: string | null
}

export interface ClienteUpdate {
  nome?: string | null
  telefone?: string | null
  email?: string | null
  nif?: string | null
  endereco?: string | null
}

export interface ClienteResponse {
  id: string
  nome: string
  telefone: string | null
  email: string | null
  nif: string | null
  endereco: string | null
  criado_em: string
}

// ── Vendas ──────────────────────────────────────────────────────
export interface ItemVendaInput {
  produto_id: string
  quantidade: number
}

export interface VendaCreate {
  cliente_id?: string | null
  cliente?: Record<string, unknown> | null
  itens: ItemVendaInput[]
  desconto_percentual?: number | null
  // Quanto o cliente quer pagar no final; o sistema calcula o desconto
  // sozinho. Tem prioridade sobre desconto_percentual se ambos forem enviados.
  valor_final_desejado?: number | null
  credito?: boolean
  desconto_divida?: number | null
}

export interface VendaItemResponse {
  id: string
  produto_id: string
  produto_nome: string
  quantidade: number
  preco_unitario: number
  preco_custo_unitario: number
  iva_aplicado: number
  subtotal: number
}

export interface VendaResponse {
  id: string
  cliente_id: string
  cliente_nome: string
  utilizador_nome: string
  total_sem_iva: number
  total_iva: number
  total_com_iva: number
  desconto_percentual: number
  total_desconto: number
  total_final: number
  credito: boolean
  credito_pago: boolean
  // Nº sequencial da factura (dívida) gerada, preenchido só quando credito=true.
  numero_factura?: number | null
  criado_em: string
  // Data/hora da anulação da venda; null enquanto a venda está ativa.
  cancelada_em?: string | null
  itens: VendaItemResponse[]
}

// ── Stock ───────────────────────────────────────────────────────
export interface MovimentoCreate {
  produto_id: string
  tipo: 'ENTRADA' | 'SAIDA'
  quantidade: number
  motivo?: string | null
  preco_unitario?: number | null
}

export interface MovimentoResponse {
  id: string
  produto_id: string
  produto_nome: string
  tipo: string
  quantidade: number
  motivo: string | null
  preco_unitario: number | null
  utilizador_nome: string
  criado_em: string
}

// ── Prestações ──────────────────────────────────────────────────
export interface PrestacaoCreate {
  cliente_id: string
  produto_id: string
  valor_total: number
  numero_prestacoes: number
  data_inicio?: string | null
  taxa_multa?: number
}

export interface PagamentoCreate {
  valor: number
  data_pagamento: string
}

export interface PagamentoResponse {
  id: string
  valor: number
  data_vencimento: string
  data_pagamento: string | null
  pago: boolean
  multa: number
}

export interface PrestacaoResponse {
  id: string
  produto_id: string
  produto_nome: string
  cliente_id: string
  cliente_nome: string
  valor_total: number
  valor_pago: number
  saldo: number
  numero_prestacoes: number
  taxa_multa: number
  data_inicio: string
  situacao: string
  criado_em: string
  pagamentos: PagamentoResponse[]
}

export interface VencimentoResponse {
  prestacao_id: string
  pagamento_id: string
  cliente_nome: string
  produto_nome: string
  valor: number
  data_vencimento: string
  dias_atraso: number
}

export interface ClienteDividaResponse {
  cliente_id: string
  cliente_nome: string
  total_dividas: number
  valor_total_devido: number
  valor_total_pago: number
  saldo_aberto: number
  prestacoes: PrestacaoResponse[]
}

// Moeda em que um pagamento (de cliente ou fornecedor) foi feito — apenas um
// registo informativo. O valor da dívida e do pagamento fica sempre em Kz,
// sem conversão; não existe moeda na criação da compra/venda, só no
// pagamento da dívida.
export type MoedaPagamento = 'KZ' | 'AOA' | 'USD' | 'EUR'
export const MOEDAS_PAGAMENTO: MoedaPagamento[] = ['KZ', 'AOA', 'USD', 'EUR']

// ── Dívidas (vendas a crédito) ─────────────────────────────────
export interface PagamentoDividaResponse {
  id: string
  // Nº sequencial do recibo.
  numero?: number | null
  // Nº do recibo formatado, ex: "RC0001".
  numero_formatado?: string | null
  valor: number
  moeda: string
  data_pagamento: string
}

export interface DividaResponse {
  id: string
  // Nº sequencial da factura, usado para buscar por /dividas/numero/{numero}.
  numero?: number | null
  // Só vem preenchido em GET /dividas (lista) — ex.: "FT0001".
  numero_formatado?: string | null
  cliente_id: string
  cliente_nome: string | null
  venda_id: string | null
  produto_nome: string | null
  valor_total: number
  valor_pago: number
  saldo: number
  status: string
  criado_em: string
  pago_em: string | null
  pagamentos: PagamentoDividaResponse[]
}

export interface DividaCheckResponse {
  tem_divida: boolean
  dividas: DividaResponse[]
  total_devido: number
  mensagem: string | null
}

export interface PagarDividaRequest {
  valor: number
  moeda?: MoedaPagamento
}

export interface TotalDividasResponse {
  quantidade_dividas: number
  total_devido_dividas: number
  quantidade_prestacoes: number
  total_devido_prestacoes: number
  total_devido: number
}

// ── Fornecedores ────────────────────────────────────────────────
export interface FornecedorCreate {
  nome: string
  telefone?: string | null
  nif?: string | null
  endereco?: string | null
}

export interface FornecedorResponse {
  id: string
  nome: string
  telefone: string | null
  nif: string | null
  endereco: string | null
  criado_em: string
}

export interface CompraFornecedorItemCreate {
  // Produto já cadastrado. Se omitido, usa produto_nome (produto livre, sem stock).
  produto_id?: string
  produto_nome?: string
  quantidade: number
  preco_unitario: number
}

// Suporta vários produtos numa só compra a crédito — quando `itens` tem mais
// de um elemento, a dívida devolvida traz produto_id/quantidade (nível
// dívida) a null; o detalhe fica em `itens` (ver DividaFornecedorResponse).
export interface CompraFornecedorCreate {
  itens: CompraFornecedorItemCreate[]
  moeda?: MoedaPagamento
}

export interface CompraFornecedorItemResponse {
  id: string
  // Null quando o item é um produto livre (produto_nome sem produto_id, sem stock associado).
  produto_id: string | null
  produto_nome: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

export interface PagamentoDividaFornecedorResponse {
  id: string
  // Nº sequencial do recibo.
  numero?: number | null
  valor: number
  moeda: string
  data_pagamento: string
}

export interface DividaFornecedorResponse {
  id: string
  // Nº sequencial da factura, usado para buscar por /fornecedores/dividas/numero/{numero}.
  numero?: number | null
  fornecedor_id: string
  fornecedor_nome: string | null
  // Só vêm preenchidos quando a compra teve um único produto — com vários
  // itens, ficam null e o detalhe está em `itens`.
  produto_id: string | null
  produto_nome: string | null
  quantidade: number | null
  // Detalhe por produto — preenchido sempre que a compra teve mais de um item.
  itens?: CompraFornecedorItemResponse[]
  // Moeda em que a factura/compra foi acordada com o fornecedor (distinta da
  // moeda de cada pagamento, registada em pagamentos[].moeda).
  moeda_compra?: string | null
  valor_total: number
  valor_pago: number
  saldo: number
  status: string
  criado_em: string
  pago_em: string | null
  pagamentos: PagamentoDividaFornecedorResponse[]
}

export interface PagarDividaFornecedorRequest {
  divida_id: string
  valor: number
  moeda?: MoedaPagamento
}

export interface TotalDividasFornecedorResponse {
  quantidade_dividas: number
  total_devido: number
}

export interface ExtratoFornecedor {
  fornecedor_id: string
  fornecedor_nome: string
  telefone: string | null
  nif: string | null
  total_devido: number
  documentos: DocumentoExtratoItem[]
}

// ── Relatórios ──────────────────────────────────────────────────
export interface RelatorioVendasPeriodo {
  data_inicio: string
  data_fim: string
  total_vendas: number
  total_receita: number
  total_pendente: number
  total_sem_iva: number
  total_iva: number
  total_descontos: number
  lucro_bruto: number
  ticket_medio: number
  produtos_mais_vendidos: RelatorioProdutoVendido[]
}

export interface RelatorioClienteFiel {
  cliente_id: string
  cliente_nome: string
  total_vendas: number
  total_gasto: number
  nivel: string
  ultima_compra: string | null
  media_por_venda: number
}

export interface RelatorioClienteInativo {
  id: string
  nome: string
  telefone: string | null
  email: string | null
}

export interface RelatorioProdutoVendido {
  produto_id: string
  produto_nome: string
  quantidade_vendida: number
  total_receita: number
}

export interface RelatorioVendaCliente {
  cliente_id: string
  cliente_nome: string
  total_compras: number
  total_gasto: number
  media_por_venda: number
}

export interface RelatorioLucroProduto {
  produto_id: string
  produto_nome: string
  quantidade_vendida: number
  total_receita: number
  total_custo: number
  lucro: number
  margem_percentual: number
}

export interface RelatorioMetaProduto {
  produto_id: string
  produto_nome: string
  data_inicio: string
  data_fim: string
  meta_receita: number
  meta_lucro: number
  receita_arrecadada: number
  receita_restante: number
  lucro_realizado: number
  lucro_restante: number
  percentual_meta_receita: number
  percentual_meta_lucro: number
  unidades_vendidas: number
  unidades_faltantes_estimadas: number
  preco_custo_unitario: number
  lucro_medio_por_unidade: number
  custo_total: number
}

export interface MetaCreate {
  produto_id: string
  data_inicio: string
  data_fim: string
  meta_receita: number
  meta_lucro: number
}

export interface MetaResponse {
  id: string
  produto_id: string
  produto_nome: string | null
  data_inicio: string
  data_fim: string
  meta_receita: number
  meta_lucro: number
  criado_em: string
  atualizado_em: string
}

export interface TotaisMetas {
  quantidade_produtos: number
  receita_arrecadada_total: number
  meta_receita_total: number
  lucro_realizado_total: number
  meta_lucro_total: number
  custo_total: number
  unidades_vendidas_total: number
  percentual_meta_receita: number
  percentual_meta_lucro: number
}

export interface RelatorioMetasProgresso {
  produtos: RelatorioMetaProduto[]
  totais: TotaisMetas | null
}

export interface PagamentoDividaExtratoItem {
  // Nº sequencial do recibo.
  numero?: number | null
  valor: number
  moeda: string
  data_pagamento: string
}

export interface DividaExtratoItem {
  divida_id: string
  // Nº sequencial da factura.
  numero?: number | null
  produto_nome: string | null
  data_compra: string
  valor_total: number
  valor_pago: number
  saldo: number
  status: string
  pagamentos: PagamentoDividaExtratoItem[]
}

// Item do histórico cronológico de um extrato (cliente ou fornecedor): cada
// dívida vira uma 'Factura' (valor positivo) e cada pagamento vira um
// 'Recibo' (valor negativo).
export interface DocumentoExtratoItem {
  id: string
  tipo: 'Factura' | 'Recibo'
  numero?: number | null
  data: string
  produto_nome?: string | null
  valor: number
  moeda?: string | null
}

export interface PrestacaoExtratoItem {
  prestacao_id: string
  produto_nome: string | null
  data_compra: string
  valor_total: number
  valor_pago: number
  saldo: number
  situacao: string
}

export interface ExtratoCliente {
  cliente_id: string
  cliente_nome: string
  telefone: string | null
  nif: string | null
  total_devido: number
  dividas: DividaExtratoItem[]
  prestacoes: PrestacaoExtratoItem[]
  // Histórico cronológico: cada dívida vira uma 'Factura' e cada pagamento vira um 'Recibo'.
  documentos?: DocumentoExtratoItem[]
}

// ── Fluxo de Caixa ──────────────────────────────────────────────
export interface LancamentoCreate {
  data_movimento: string
  descricao: string
  tipo: 'ENTRADA' | 'SAIDA'
  valor: number
  categoria: string
}

export interface LancamentoResponse {
  id: string
  data_movimento: string
  descricao: string
  tipo: string
  valor: number
  categoria: string
  venda_id: string | null
  prestacao_id: string | null
  pagamento_prestacao_id: string | null
  divida_id: string | null
  movimento_stock_id: string | null
  periodo_referencia: string | null
  criado_em: string
}

export interface LancamentoListaResponse {
  total_lancamentos: number
  total_entradas: number
  total_saidas: number
  saldo_periodo: number
  lancamentos: LancamentoResponse[]
}

export interface SaldoResponse {
  saldo_atual: number
  total_entradas: number
  total_saidas: number
}

// ── Faturas ─────────────────────────────────────────────────────
export interface FaturaItemCreate {
  produto_nome: string
  quantidade: number
  preco_unitario: number
  iva?: number
}

export interface FaturaCreate {
  cliente_id: string
  itens: FaturaItemCreate[]
  desconto_percentual?: number | null
}

export interface FaturaItemResponse {
  id: string
  produto_nome: string
  quantidade: number
  preco_unitario: number
  iva: number
  subtotal: number
}

export interface FaturaResponse {
  id: string
  numero: string
  cliente_id: string
  cliente_nome: string
  cliente_nif: string | null
  total_sem_iva: number
  total_iva: number
  total_desconto: number
  total_final: number
  emitida_em: string
  cancelada_em: string | null
  itens: FaturaItemResponse[]
}

export interface FaturaResumida {
  id: string
  numero: string
  cliente_nome: string
  total_final: number
  emitida_em: string
  cancelada_em: string | null
  total_itens: number
}

export interface FaturaListaResponse {
  total: number
  faturas: FaturaResumida[]
}

export interface CancelamentoResponse {
  id: string
  numero: string
  cancelada_em: string | null
  situacao: string
}

export interface TendenciaDia {
  dia: string
  faturas: number
  valor: number
}

export interface TopCliente {
  cliente_nome: string
  total_faturado: number
  faturas: number
}

export interface ResumoPerformance {
  total_emitidas: number
  total_canceladas: number
  total_ativas: number
  taxa_cancelamento: number
}

export interface ValoresPerformance {
  total_faturado: number
  total_iva: number
  total_descontos: number
  media_por_fatura: number
  maior_fatura: number
}

export interface PerformanceResponse {
  resumo: ResumoPerformance
  valores: ValoresPerformance
  top_clientes: TopCliente[]
  tendencia: TendenciaDia[]
}

// ── Assistente IA ────────────────────────────────────────────────
export interface SessaoIaCreate {
  titulo: string
}

export interface SessaoIaResponse {
  id: string
  titulo: string
  criado_em: string
}

export interface MensagemIaResponse {
  id: string
  sessao_id: string
  role: string
  content: string
  criado_em: string
}

export interface PerguntaResponse {
  resposta: string
  mensagem_id: string
}

// ── Lixeira (itens eliminados: dívidas anuladas, vendas canceladas,
// produtos desativados, facturas canceladas) ────────────────────
export type LixeiraTipo = 'divida' | 'venda' | 'produto' | 'fatura'

export interface LixeiraItemResponse {
  id: string
  tipo: LixeiraTipo
  descricao: string
  // Dados adicionais devolvidos pela API, formato livre por tipo — usado só
  // para exibição extra, nunca assumir campos específicos presentes.
  detalhes: Record<string, unknown> | null
  eliminado_em: string | null
}
