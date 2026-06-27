import { api } from '@/lib/api'
import type { MovimentoCreate, MovimentoResponse } from '@/types'

export const stockService = {
  registarMovimento: (data: MovimentoCreate) =>
    api.post<MovimentoResponse>('/stock/movimento', data),

  listarMovimentos: (produto_id?: string) =>
    api.get<MovimentoResponse[]>(
      '/stock/movimentos',
      produto_id ? { produto_id } : undefined
    ),
}
