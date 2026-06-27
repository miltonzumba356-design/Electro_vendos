import { api } from '@/lib/api'
import type {
  LancamentoCreate,
  LancamentoResponse,
  LancamentoListaResponse,
  SaldoResponse,
  DemonstrativoResponse,
  SyncResult,
} from '@/types'

export const fluxoCaixaService = {
  criarLancamento: (data: LancamentoCreate) =>
    api.post<LancamentoResponse>('/fluxo-caixa/lancamentos', data),

  listarLancamentos: (params?: { data_inicio?: string; data_fim?: string; categoria?: string }) =>
    api.get<LancamentoListaResponse>('/fluxo-caixa/lancamentos', params),

  saldo: () =>
    api.get<SaldoResponse>('/fluxo-caixa/saldo'),

  demonstrativo: (data_inicio: string, data_fim: string) =>
    api.get<DemonstrativoResponse>('/fluxo-caixa/demonstrativo', { data_inicio, data_fim }),

  sincronizar: () =>
    api.post<SyncResult>('/fluxo-caixa/sync', {}),
}
