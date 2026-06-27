/**
 * SDD — Serviço de Autenticação
 * Spec: /auth/login POST · /auth/register POST · /auth/me GET · /auth/utilizadores GET
 */
import { describe, it, expect, vi } from 'vitest'
import { BASE, mockFetch } from './helpers'
import { authService } from '@/services/auth'

const TOKEN_RESPONSE = { access_token: 'jwt.token.here', token_type: 'bearer', nome: 'Admin', role: 'GESTOR' }
const UTILIZADOR = { id: 'uuid-1', nome: 'Maria Silva', email: 'maria@bisness.com', role: 'OPERADOR', ativo: true }

describe('authService.login — POST /auth/login', () => {
  it('chama POST /auth/login com email e password', async () => {
    const spy = mockFetch(TOKEN_RESPONSE)
    await authService.login({ email: 'admin@bisness.com', password: 'admin123' })
    expect(spy).toHaveBeenCalledWith(
      `${BASE}/auth/login`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'admin@bisness.com', password: 'admin123' }) })
    )
  })

  it('retorna TokenResponse (access_token, nome, role)', async () => {
    mockFetch(TOKEN_RESPONSE)
    const result = await authService.login({ email: 'x@x.com', password: '123' })
    expect(result.access_token).toBe('jwt.token.here')
    expect(result.nome).toBe('Admin')
    expect(result.role).toBe('GESTOR')
  })

  it('lança erro quando credenciais são inválidas (401)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ detail: 'Credenciais inválidas' }), { status: 401 })
    )
    await expect(authService.login({ email: 'x@x.com', password: 'errado' })).rejects.toThrow('Credenciais inválidas')
  })
})

describe('authService.register — POST /auth/register', () => {
  it('chama POST /auth/register com os dados do novo utilizador', async () => {
    const spy = mockFetch(UTILIZADOR)
    await authService.register({ nome: 'Maria Silva', email: 'maria@bisness.com', password: '123456', role: 'OPERADOR' })
    expect(spy).toHaveBeenCalledWith(
      `${BASE}/auth/register`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ nome: 'Maria Silva', email: 'maria@bisness.com', password: '123456', role: 'OPERADOR' }),
      })
    )
  })

  it('retorna UtilizadorResponse após registo', async () => {
    mockFetch(UTILIZADOR)
    const result = await authService.register({ nome: 'Maria Silva', email: 'maria@bisness.com', password: '123456' })
    expect(result.id).toBe('uuid-1')
    expect(result.ativo).toBe(true)
  })

  it('envia Authorization header quando token presente', async () => {
    localStorage.setItem('token', 'gestor-token')
    const spy = mockFetch(UTILIZADOR)
    await authService.register({ nome: 'X', email: 'x@x.com', password: '123' })
    const headers = (spy.mock.calls[0][1] as RequestInit).headers as Record<string, string>
    expect(headers['Authorization']).toBe('Bearer gestor-token')
  })
})

describe('authService.me — GET /auth/me', () => {
  it('chama GET /auth/me', async () => {
    const spy = mockFetch(UTILIZADOR)
    await authService.me()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/auth/me`)
  })

  it('retorna UtilizadorResponse do utilizador autenticado', async () => {
    mockFetch(UTILIZADOR)
    const result = await authService.me()
    expect(result.nome).toBe('Maria Silva')
    expect(result.role).toBe('OPERADOR')
  })
})

describe('authService.listarUtilizadores — GET /auth/utilizadores', () => {
  it('chama GET /auth/utilizadores', async () => {
    const spy = mockFetch([UTILIZADOR])
    await authService.listarUtilizadores()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/auth/utilizadores`)
  })

  it('retorna array de UtilizadorResponse', async () => {
    mockFetch([UTILIZADOR, { ...UTILIZADOR, id: 'uuid-2', nome: 'Carlos', role: 'GESTOR' }])
    const result = await authService.listarUtilizadores()
    expect(result).toHaveLength(2)
    expect(result[1].role).toBe('GESTOR')
  })
})
