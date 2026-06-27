/**
 * SDD — Sistema / Health Check
 * Spec: GET /health
 */
import { describe, it, expect, vi } from 'vitest'
import { BASE, mockFetch } from './helpers'
import { systemService } from '@/services/system'

describe('systemService.health — GET /health', () => {
  it('chama GET /health', async () => {
    const spy = mockFetch({ status: 'ok' })
    await systemService.health()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/health`)
  })

  it('GET /health não requer Authorization header', async () => {
    const spy = mockFetch({ status: 'ok' })
    await systemService.health()
    const headers = (spy.mock.calls[0][1] as RequestInit).headers as Record<string, string>
    expect(headers['Authorization']).toBeUndefined()
  })

  it('retorna resposta quando backend está disponível', async () => {
    mockFetch({ status: 'ok' })
    const result = await systemService.health()
    expect(result).toBeDefined()
  })

  it('lança erro quando backend não está disponível', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('fetch failed'))
    await expect(systemService.health()).rejects.toThrow('fetch failed')
  })
})
