import { api } from '@/lib/api'
import type {
  FaturaCreate,
  FaturaResponse,
  FaturaListaResponse,
  CancelamentoResponse,
  PerformanceResponse,
} from '@/types'

export interface FaturasListParams {
  skip?: number
  limit?: number
  data_inicio?: string | null
  data_fim?: string | null
  cliente_id?: string | null
}

export const faturasService = {
  listar: (params: FaturasListParams = {}) => {
    const q = new URLSearchParams()
    if (params.skip != null)       q.set('skip',        String(params.skip))
    if (params.limit != null)      q.set('limit',       String(params.limit))
    if (params.data_inicio)        q.set('data_inicio', params.data_inicio)
    if (params.data_fim)           q.set('data_fim',    params.data_fim)
    if (params.cliente_id)         q.set('cliente_id',  params.cliente_id)
    const qs = q.toString()
    return api.get<FaturaListaResponse>(`/faturas${qs ? '?' + qs : ''}`)
  },

  buscar: (id: string) =>
    api.get<FaturaResponse>(`/faturas/${id}`),

  criar: (data: FaturaCreate) =>
    api.post<FaturaResponse>('/faturas', data),

  cancelar: (id: string) =>
    api.post<CancelamentoResponse>(`/faturas/${id}/cancelar`, {}),

  performance: (data_inicio?: string, data_fim?: string) => {
    const q = new URLSearchParams()
    if (data_inicio) q.set('data_inicio', data_inicio)
    if (data_fim)    q.set('data_fim',    data_fim)
    const qs = q.toString()
    return api.get<PerformanceResponse>(`/faturas/performance/estatisticas${qs ? '?' + qs : ''}`)
  },
}
