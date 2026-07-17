import { api } from '@/lib/api'
import type { MetaCreate, MetaResponse } from '@/types'

export const metasService = {
  // Cria a meta de receita/lucro do produto para o período. Se já existir
  // meta para o mesmo produto e período, o backend atualiza os valores.
  criar: (data: MetaCreate) =>
    api.post<MetaResponse>('/metas', data),
}
