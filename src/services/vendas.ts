import { api } from '@/lib/api'
import type { VendaCreate, VendaResponse } from '@/types'

export const vendasService = {
  listar: () =>
    api.get<VendaResponse[]>('/vendas'),

  buscar: (id: string) =>
    api.get<VendaResponse>(`/vendas/${id}`),

  criar: (data: VendaCreate) =>
    api.post<VendaResponse>('/vendas', data),
}
