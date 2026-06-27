import { api } from '@/lib/api'
import type { ClienteCreate, ClienteUpdate, ClienteResponse } from '@/types'

export const clientesService = {
  listar: () =>
    api.get<ClienteResponse[]>('/clientes'),

  buscar: (id: string) =>
    api.get<ClienteResponse>(`/clientes/${id}`),

  criar: (data: ClienteCreate) =>
    api.post<ClienteResponse>('/clientes', data),

  atualizar: (id: string, data: ClienteUpdate) =>
    api.put<ClienteResponse>(`/clientes/${id}`, data),
}
