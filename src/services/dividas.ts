import { api } from '@/lib/api'
import type { DividaResponse, DividaCheckResponse, PagarDividaRequest, TotalDividasResponse } from '@/types'

export const dividasService = {
  verificarCliente: (clienteId: string) =>
    api.get<DividaCheckResponse>(`/dividas/clientes/${clienteId}`),

  listar: (params?: { skip?: number; limit?: number; status?: 'DIVIDA' | 'PAGA'; data_inicio?: string; data_fim?: string; nome?: string; numero?: number }) =>
    api.get<DividaResponse[]>('/dividas', params),

  total: () =>
    api.get<TotalDividasResponse>('/dividas/total'),

  buscar: (id: string) =>
    api.get<DividaResponse>(`/dividas/${id}`),

  // Busca a factura (dívida) pelo número sequencial.
  buscarPorNumero: (numero: number) =>
    api.get<DividaResponse>(`/dividas/numero/${numero}`),

  pagar: (id: string, data: PagarDividaRequest) =>
    api.post<DividaResponse>(`/dividas/${id}/pagar`, data),
}
