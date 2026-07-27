import { api } from '@/lib/api'
import type {
  FornecedorCreate,
  FornecedorResponse,
  CompraFornecedorCreate,
  DividaFornecedorResponse,
  PagarDividaFornecedorRequest,
  TotalDividasFornecedorResponse,
  ExtratoFornecedor,
} from '@/types'

export const fornecedoresService = {
  listar: (params?: { skip?: number; limit?: number }) =>
    api.get<FornecedorResponse[]>('/fornecedores', params),

  buscar: (id: string) =>
    api.get<FornecedorResponse>(`/fornecedores/${id}`),

  criar: (data: FornecedorCreate) =>
    api.post<FornecedorResponse>('/fornecedores', data),

  comprar: (fornecedorId: string, data: CompraFornecedorCreate) =>
    api.post<DividaFornecedorResponse>(`/fornecedores/${fornecedorId}/compras`, data),

  // Histórico cronológico de facturas (compras a crédito) e recibos (pagamentos)
  // do fornecedor. Sem data_inicio/data_fim, traz todo o histórico.
  extrato: (fornecedorId: string, params?: { data_inicio?: string; data_fim?: string }) =>
    api.get<ExtratoFornecedor>(`/fornecedores/${fornecedorId}/extrato`, params),

  dividas: {
    listar: (params?: { fornecedor_id?: string; status?: 'DIVIDA' | 'PAGA'; data_inicio?: string; data_fim?: string; skip?: number; limit?: number }) =>
      api.get<DividaFornecedorResponse[]>('/fornecedores/dividas', params),

    total: () =>
      api.get<TotalDividasFornecedorResponse>('/fornecedores/dividas/total'),

    buscar: (id: string) =>
      api.get<DividaFornecedorResponse>(`/fornecedores/dividas/${id}`),

    // Busca a factura (dívida) a fornecedor pelo número sequencial.
    buscarPorNumero: (numero: number) =>
      api.get<DividaFornecedorResponse>(`/fornecedores/dividas/numero/${numero}`),

    pagar: (data: PagarDividaFornecedorRequest) =>
      api.post<DividaFornecedorResponse>('/fornecedores/dividas/pagar', data),
  },
}
