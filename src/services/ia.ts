import { api } from '@/lib/api'
import type {
  SessaoIaCreate,
  SessaoIaResponse,
  MensagemIaResponse,
  PerguntaResponse,
} from '@/types'

export const iaService = {
  listarSessoes: () =>
    api.get<SessaoIaResponse[]>('/ia/sessoes'),

  criarSessao: (data: SessaoIaCreate) =>
    api.post<SessaoIaResponse>('/ia/sessoes', data),

  listarMensagens: (sessaoId: string) =>
    api.get<MensagemIaResponse[]>(`/ia/sessoes/${sessaoId}/mensagens`),

  perguntar: (sessaoId: string, mensagem: string) =>
    api.post<PerguntaResponse>(`/ia/sessoes/${sessaoId}/perguntar`, { mensagem }),

  apagarSessao: (sessaoId: string) =>
    api.delete<void>(`/ia/sessoes/${sessaoId}`),
}
