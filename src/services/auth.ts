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
}
