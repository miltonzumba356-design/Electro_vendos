import { api } from '@/lib/api'
import type { DividaResponse, DividaCheckResponse, PagarDividaRequest } from '@/types'

export const dividasService = {
  verificarCliente: (clienteId: string) =>
    api.get<DividaCheckResponse>(`/dividas/clientes/${clienteId}`),

  listar: (params?: { skip?: number; limit?: number; status?: 'DIVIDA' | 'PAGA' }) =>
    api.get<DividaResponse[]>('/dividas', params),

  buscar: (id: string) =>
    api.get<DividaResponse>(`/dividas/${id}`),

  pagar: (id: string, data: PagarDividaRequest) =>
    api.post<DividaResponse>(`/dividas/${id}/pagar`, data),
}
