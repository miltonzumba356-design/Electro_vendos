import { api } from '@/lib/api'
import type { LoginRequest, TokenResponse, RegisterRequest, UtilizadorResponse } from '@/types'

export const authService = {
  login: (data: LoginRequest) =>
    api.post<TokenResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<UtilizadorResponse>('/auth/register', data),

  me: () =>
    api.get<UtilizadorResponse>('/auth/me'),

  listarUtilizadores: () =>
    api.get<UtilizadorResponse[]>('/auth/utilizadores'),

  // NOTA: endpoint ainda não existe na API (ver ducumenti_API.md — só há
  // POST /auth/register, GET /auth/utilizadores e GET /auth/me). Falta o
  // backend expor PATCH /auth/utilizadores/{id} a aceitar { ativo }.
  atualizarEstado: (id: string, ativo: boolean) =>
    api.patch<UtilizadorResponse>(`/auth/utilizadores/${id}`, { ativo }),
}
