import { api } from '@/lib/api'
import type { ProdutoCreate, ProdutoUpdate, ProdutoResponse, ProdutoStockBaixo } from '@/types'

export const produtosService = {
  listar: () =>
    api.get<ProdutoResponse[]>('/produtos'),

  buscar: (id: string) =>
    api.get<ProdutoResponse>(`/produtos/${id}`),

  criar: (data: ProdutoCreate) =>
    api.post<ProdutoResponse>('/produtos', data),

  atualizar: (id: string, data: ProdutoUpdate) =>
    api.put<ProdutoResponse>(`/produtos/${id}`, data),

  remover: (id: string) =>
    api.delete<void>(`/produtos/${id}`),

  stockBaixo: () =>
    api.get<ProdutoStockBaixo[]>('/produtos/stock/baixo'),
}
