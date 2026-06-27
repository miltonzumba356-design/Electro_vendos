import { api } from '@/lib/api'

export const systemService = {
  health: () => api.get<unknown>('/health'),
}
