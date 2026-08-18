import { api } from '@/lib/api'
import type { LixeiraItemResponse, LixeiraTipo } from '@/types'

export const lixeiraService = {
  listar: (tipo?: LixeiraTipo) =>
    api.get<LixeiraItemResponse[]>('/lixeira', tipo ? { tipo } : undefined),

  restaurar: (id: string, tipo: LixeiraTipo) =>
    api.post<unknown>(`/lixeira/${id}/restaurar`, undefined, { tipo }),

  eliminarPermanente: (id: string, tipo: LixeiraTipo) =>
    api.delete<unknown>(`/lixeira/${id}`, { tipo }),
}
