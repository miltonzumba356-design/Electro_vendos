import { api } from '@/lib/api'
import type {
  FornecedorCreate,
  FornecedorResponse,
  CompraFornecedorCreate,
  DividaFornecedorResponse,
  PagarDividaFornecedorRequest,
  TotalDividasFornecedorResponse,
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

  dividas: {
    listar: (params?: { fornecedor_id?: string; status?: 'DIVIDA' | 'PAGA'; skip?: number; limit?: number }) =>
      api.get<DividaFornecedorResponse[]>('/fornecedores/dividas', params),

    total: () =>
      api.get<TotalDividasFornecedorResponse>('/fornecedores/dividas/total'),

    buscar: (id: string) =>
      api.get<DividaFornecedorResponse>(`/fornecedores/dividas/${id}`),

    pagar: (data: PagarDividaFornecedorRequest) =>
      api.post<DividaFornecedorResponse>('/fornecedores/dividas/pagar', data),
  },
}
