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
  criado_em: string
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

// ── Dívidas (vendas a crédito) ─────────────────────────────────
export interface DividaResponse {
  id: string
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
}

export interface DividaCheckResponse {
  tem_divida: boolean
  dividas: DividaResponse[]
  total_devido: number
  mensagem: string | null
}

export interface PagarDividaRequest {
  valor: number
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

// Moeda em que um pagamento a fornecedor foi feito — apenas um registo
// informativo. O valor da dívida e do pagamento fica sempre em Kz, sem
// conversão; não existe moeda na criação da compra, só no pagamento.
export type MoedaPagamento = 'KZ' | 'AOA' | 'USD' | 'EUR'
export const MOEDAS_PAGAMENTO: MoedaPagamento[] = ['KZ', 'AOA', 'USD', 'EUR']

export interface CompraFornecedorCreate {
  produto_id: string
  quantidade: number
  preco_unitario: number
}

export interface DividaFornecedorResponse {
  id: string
  fornecedor_id: string
  fornecedor_nome: string | null
  produto_id: string | null
  produto_nome: string | null
  quantidade: number | null
  valor_total: number
  valor_pago: number
  saldo: number
  status: string
  criado_em: string
  pago_em: string | null
  moeda_pagamento?: string | null
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

export interface DividaExtratoItem {
  divida_id: string
  produto_nome: string | null
  data_compra: string
  valor_total: number
  valor_pago: number
  saldo: number
  status: string
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
