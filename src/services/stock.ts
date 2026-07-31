import { api } from '@/lib/api'
import type { MovimentoCreate, MovimentoResponse, ValorizacaoStockResponse } from '@/types'

export const stockService = {
  registarMovimento: (data: MovimentoCreate) =>
    api.post<MovimentoResponse>('/stock/movimento', data),

  listarMovimentos: (produto_id?: string) =>
    api.get<MovimentoResponse[]>(
      '/stock/movimentos',
      produto_id ? { produto_id } : undefined
    ),

  // Quanto vale o stock parado, ao custo e ao preço de venda — nome filtra
  // por produto (pesquisa parcial).
  valorizacao: (nome?: string) =>
    api.get<ValorizacaoStockResponse>('/stock/valorizacao', nome ? { nome } : undefined),
}
