/**
 * SDD — Serviço de Clientes
 * Spec: GET /clientes · POST /clientes · GET /clientes/{id} · PUT /clientes/{id}
 */
import { describe, it, expect } from 'vitest'
import { BASE, mockFetch } from './helpers'
import { clientesService } from '@/services/clientes'

const CLIENTE = {
  id: 'cli-uuid-1', nome: 'João dos Santos', telefone: '923456789',
  email: 'joao@email.com', nif: '123456789', endereco: 'Rua 1, Luanda',
  criado_em: '2026-01-15T10:00:00Z',
}

describe('clientesService.listar — GET /clientes', () => {
  it('chama GET /clientes', async () => {
    const spy = mockFetch([CLIENTE])
    await clientesService.listar()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/clientes`)
  })

  it('retorna array de ClienteResponse', async () => {
    mockFetch([CLIENTE, { ...CLIENTE, id: 'cli-uuid-2', nome: 'Ana Cristina' }])
    const result = await clientesService.listar()
    expect(result).toHaveLength(2)
    expect(result[1].nome).toBe('Ana Cristina')
  })
})

describe('clientesService.criar — POST /clientes', () => {
  it('chama POST /clientes com ClienteCreate no body', async () => {
    const spy = mockFetch(CLIENTE, 201)
    const payload = { nome: 'João dos Santos', telefone: '923456789', email: 'joao@email.com' }
    await clientesService.criar(payload)
    expect(spy).toHaveBeenCalledWith(`${BASE}/clientes`, expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) }))
  })

  it('cria cliente apenas com nome (campos opcionais omitidos)', async () => {
    const spy = mockFetch({ ...CLIENTE, telefone: null, email: null, nif: null, endereco: null }, 201)
    await clientesService.criar({ nome: 'Só Nome' })
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.nome).toBe('Só Nome')
  })

  it('retorna ClienteResponse com id gerado', async () => {
    mockFetch(CLIENTE, 201)
    const result = await clientesService.criar({ nome: 'João dos Santos' })
    expect(result.id).toBe('cli-uuid-1')
    expect(result.criado_em).toBeDefined()
  })
})

describe('clientesService.buscar — GET /clientes/{id}', () => {
  it('chama GET /clientes/{id}', async () => {
    const spy = mockFetch(CLIENTE)
    await clientesService.buscar('cli-uuid-1')
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/clientes/cli-uuid-1`)
  })

  it('retorna ClienteResponse do cliente específico', async () => {
    mockFetch(CLIENTE)
    const result = await clientesService.buscar('cli-uuid-1')
    expect(result.nome).toBe('João dos Santos')
    expect(result.nif).toBe('123456789')
  })
})

describe('clientesService.atualizar — PUT /clientes/{id}', () => {
  it('chama PUT /clientes/{id} com ClienteUpdate no body', async () => {
    const spy = mockFetch(CLIENTE)
    await clientesService.atualizar('cli-uuid-1', { telefone: '912345678', endereco: 'Rua Nova' })
    expect(spy).toHaveBeenCalledWith(
      `${BASE}/clientes/cli-uuid-1`,
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ telefone: '912345678', endereco: 'Rua Nova' }) })
    )
  })

  it('todos os campos de ClienteUpdate são opcionais', async () => {
    const spy = mockFetch(CLIENTE)
    await clientesService.atualizar('cli-uuid-1', { nome: 'Novo Nome' })
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(Object.keys(body)).toEqual(['nome'])
  })
})
