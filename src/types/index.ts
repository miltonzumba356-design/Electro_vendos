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
}

export interface VendaItemResponse {
  id: string
  produto_id: string
  produto_nome: string
  quantidade: number
  preco_unitario: number
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
  venda_id: string
  numero_prestacoes: number
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
}

export interface PrestacaoResponse {
  id: string
  venda_id: string
  cliente_id: string
  cliente_nome: string
  valor_total: number
  valor_pago: number
  saldo: number
  numero_prestacoes: number
  situacao: string
  criado_em: string
  pagamentos: PagamentoResponse[]
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

// ── Relatórios ──────────────────────────────────────────────────
export interface RelatorioVendasPeriodo {
  total_vendas: number
  total_receita: number
  total_sem_iva: number
  total_iva: number
  total_descontos: number
  lucro_bruto: number
  ticket_medio: number
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
  movimento_stock_id: string | null
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

export interface CategoriaGrupoResponse {
  categoria: string
  total: number
  quantidade: number
}

export interface DemonstrativoResponse {
  data_inicio: string
  data_fim: string
  total_entradas: number
  total_saidas: number
  saldo_final: number
  entradas: CategoriaGrupoResponse[]
  saidas: CategoriaGrupoResponse[]
}

export interface SyncResult {
  total_sincronizados: number
  sincronizados: Record<string, number>
  data_inicio: string | null
  data_fim: string | null
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
