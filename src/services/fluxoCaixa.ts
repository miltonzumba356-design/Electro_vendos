import { api } from '@/lib/api'
import type {
  LancamentoCreate,
  LancamentoResponse,
  LancamentoListaResponse,
  SaldoResponse,
  DemonstrativoResponse,
  SyncResult,
  SyncHistoricoResponse,
} from '@/types'

export const fluxoCaixaService = {
  criarLancamento: (data: LancamentoCreate) =>
    api.post<LancamentoResponse>('/fluxo-caixa/lancamentos', data),

  listarLancamentos: (params?: {
    data_inicio?: string
    data_fim?: string
    categoria?: string
    incluir_substituidos?: boolean
  }) =>
    api.get<LancamentoListaResponse>('/fluxo-caixa/lancamentos', params),

  saldo: () =>
    api.get<SaldoResponse>('/fluxo-caixa/saldo'),

  demonstrativo: (data_inicio: string, data_fim: string) =>
    api.get<DemonstrativoResponse>('/fluxo-caixa/demonstrativo', { data_inicio, data_fim }),

  sincronizar: (data_inicio: string, data_fim: string) => {
    const qs = new URLSearchParams({ data_inicio, data_fim }).toString()
    return api.post<SyncResult>(`/fluxo-caixa/sync?${qs}`)
  },

  listarHistoricoSync: () =>
    api.get<SyncHistoricoResponse[]>('/fluxo-caixa/sync'),
}
