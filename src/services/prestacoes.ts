import { api } from '@/lib/api'
import type {
  PrestacaoCreate,
  PrestacaoResponse,
  PagamentoCreate,
  ClienteDividaResponse,
} from '@/types'

export const prestacoesService = {
  listar: () =>
    api.get<PrestacaoResponse[]>('/prestacoes'),

  buscar: (id: string) =>
    api.get<PrestacaoResponse>(`/prestacoes/${id}`),

  criar: (data: PrestacaoCreate) =>
    api.post<PrestacaoResponse>('/prestacoes', data),

  registarPagamento: (id: string, data: PagamentoCreate) =>
    api.post<PrestacaoResponse>(`/prestacoes/${id}/pagamentos`, data),

  dividasCliente: (cliente_id: string) =>
    api.get<ClienteDividaResponse>(`/prestacoes/clientes/${cliente_id}/dividas`),
}
