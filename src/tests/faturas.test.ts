/**
 * SDD — Serviço de Faturas
 * Spec: GET /faturas · POST /faturas · GET /faturas/{id}
 *       POST /faturas/{id}/cancelar · GET /faturas/performance/estatisticas
 *
 * TDD: todos os testes foram escritos antes de qualquer ajuste ao serviço.
 */
import { describe, it, expect } from 'vitest'
import { BASE, mockFetch } from './helpers'
import { faturasService } from '@/services/faturas'

/* ── Fixtures ────────────────────────────────────────────────── */
const ITEM = {
  id: 'item-uuid-1',
  produto_nome: 'Televisor Samsung 43"',
  quantidade: 1,
  preco_unitario: 120000,
  iva: 14,
  subtotal: 136800,
}

const FATURA = {
  id: 'fat-uuid-1',
  numero: 'FAT-000001',
  cliente_id: 'cli-uuid-1',
  cliente_nome: 'Empresa XYZ Lda',
  cliente_nif: '5000123456',
  total_sem_iva: 120000,
  total_iva: 16800,
  total_desconto: 0,
  total_final: 136800,
  emitida_em: '2026-06-27T10:00:00Z',
  cancelada_em: null,
  itens: [ITEM],
}

const FATURA_RESUMIDA = {
  id: 'fat-uuid-1',
  numero: 'FAT-000001',
  cliente_nome: 'Empresa XYZ Lda',
  total_final: 136800,
  emitida_em: '2026-06-27T10:00:00Z',
  cancelada_em: null,
  total_itens: 1,
}

const LISTA_RESPONSE = {
  total: 1,
  faturas: [FATURA_RESUMIDA],
}

const CANCELAMENTO = {
  id: 'fat-uuid-1',
  numero: 'FAT-000001',
  cancelada_em: '2026-06-28T09:00:00Z',
  situacao: 'CANCELADA',
}

const PERFORMANCE = {
  resumo: {
    total_emitidas: 150,
    total_canceladas: 8,
    total_ativas: 142,
    taxa_cancelamento: 5.33,
  },
  valores: {
    total_faturado: 21000000,
    total_iva: 2940000,
    total_descontos: 420000,
    media_por_fatura: 147887,
    maior_fatura: 980000,
  },
  top_clientes: [
    { cliente_nome: 'Empresa XYZ Lda', total_faturado: 3500000, faturas: 12 },
    { cliente_nome: 'Grupo ABC', total_faturado: 2100000, faturas: 7 },
  ],
  tendencia: [
    { dia: '2026-06-27', faturas: 5, valor: 735000 },
  ],
}

/* ── listar ─────────────────────────────────────────────────── */
describe('faturasService.listar — GET /faturas', () => {
  it('chama GET /faturas sem filtros', async () => {
    const spy = mockFetch(LISTA_RESPONSE)
    await faturasService.listar()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/faturas`)
  })

  it('retorna FaturaListaResponse com total e faturas[]', async () => {
    mockFetch(LISTA_RESPONSE)
    const result = await faturasService.listar()
    expect(result.total).toBe(1)
    expect(result.faturas).toHaveLength(1)
    expect(result.faturas[0].numero).toBe('FAT-000001')
  })

  it('inclui cliente_id na query string quando fornecido', async () => {
    const spy = mockFetch(LISTA_RESPONSE)
    await faturasService.listar({ cliente_id: 'cli-uuid-1' })
    expect(spy.mock.calls[0][0]).toContain('cliente_id=cli-uuid-1')
  })

  it('inclui data_inicio na query string quando fornecida', async () => {
    const spy = mockFetch(LISTA_RESPONSE)
    await faturasService.listar({ data_inicio: '2026-06-01' })
    expect(spy.mock.calls[0][0]).toContain('data_inicio=2026-06-01')
  })

  it('inclui data_fim na query string quando fornecida', async () => {
    const spy = mockFetch(LISTA_RESPONSE)
    await faturasService.listar({ data_fim: '2026-06-30' })
    expect(spy.mock.calls[0][0]).toContain('data_fim=2026-06-30')
  })

  it('combina múltiplos filtros na mesma query string', async () => {
    const spy = mockFetch(LISTA_RESPONSE)
    await faturasService.listar({ cliente_id: 'cli-uuid-1', data_inicio: '2026-06-01', data_fim: '2026-06-30' })
    const url = spy.mock.calls[0][0] as string
    expect(url).toContain('cliente_id=cli-uuid-1')
    expect(url).toContain('data_inicio=2026-06-01')
    expect(url).toContain('data_fim=2026-06-30')
  })

  it('ignora cliente_id null — não adiciona parâmetro à URL', async () => {
    const spy = mockFetch(LISTA_RESPONSE)
    await faturasService.listar({ cliente_id: null })
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/faturas`)
  })

  it('inclui limit na query string quando fornecido', async () => {
    const spy = mockFetch(LISTA_RESPONSE)
    await faturasService.listar({ limit: 50 })
    expect(spy.mock.calls[0][0]).toContain('limit=50')
  })

  it('FaturaResumida contém campo cancelada_em (null = activa)', async () => {
    mockFetch(LISTA_RESPONSE)
    const result = await faturasService.listar()
    expect(result.faturas[0].cancelada_em).toBeNull()
  })
})

/* ── buscar ─────────────────────────────────────────────────── */
describe('faturasService.buscar — GET /faturas/{id}', () => {
  it('chama GET /faturas/{id}', async () => {
    const spy = mockFetch(FATURA)
    await faturasService.buscar('fat-uuid-1')
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/faturas/fat-uuid-1`)
  })

  it('retorna FaturaResponse completo com itens', async () => {
    mockFetch(FATURA)
    const result = await faturasService.buscar('fat-uuid-1')
    expect(result.numero).toBe('FAT-000001')
    expect(result.itens).toHaveLength(1)
    expect(result.itens[0].produto_nome).toBe('Televisor Samsung 43"')
  })

  it('total_final = total_sem_iva + total_iva - total_desconto', async () => {
    mockFetch(FATURA)
    const result = await faturasService.buscar('fat-uuid-1')
    expect(result.total_final).toBe(result.total_sem_iva + result.total_iva - result.total_desconto)
  })

  it('cliente_nif pode ser null (cliente sem NIF registado)', async () => {
    mockFetch({ ...FATURA, cliente_nif: null })
    const result = await faturasService.buscar('fat-uuid-1')
    expect(result.cliente_nif).toBeNull()
  })

  it('cancelada_em é null para faturas activas', async () => {
    mockFetch(FATURA)
    const result = await faturasService.buscar('fat-uuid-1')
    expect(result.cancelada_em).toBeNull()
  })
})

/* ── criar ──────────────────────────────────────────────────── */
describe('faturasService.criar — POST /faturas', () => {
  it('chama POST /faturas com FaturaCreate no body', async () => {
    const spy = mockFetch(FATURA, 201)
    const payload = {
      cliente_id: 'cli-uuid-1',
      itens: [{ produto_nome: 'Televisor Samsung 43"', quantidade: 1, preco_unitario: 120000, iva: 14 }],
    }
    await faturasService.criar(payload)
    expect(spy).toHaveBeenCalledWith(
      `${BASE}/faturas`,
      expect.objectContaining({ method: 'POST', body: JSON.stringify(payload) })
    )
  })

  it('envia desconto_percentual quando fornecido', async () => {
    const spy = mockFetch(FATURA, 201)
    const payload = {
      cliente_id: 'cli-uuid-1',
      itens: [{ produto_nome: 'Produto X', quantidade: 2, preco_unitario: 50000 }],
      desconto_percentual: 10,
    }
    await faturasService.criar(payload)
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.desconto_percentual).toBe(10)
  })

  it('aceita fatura com múltiplos itens', async () => {
    const spy = mockFetch(FATURA, 201)
    const payload = {
      cliente_id: 'cli-uuid-1',
      itens: [
        { produto_nome: 'Produto A', quantidade: 1, preco_unitario: 50000 },
        { produto_nome: 'Produto B', quantidade: 3, preco_unitario: 15000, iva: 0 },
      ],
    }
    await faturasService.criar(payload)
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.itens).toHaveLength(2)
  })

  it('itens usam produto_nome (string livre, sem FK para produto)', async () => {
    const spy = mockFetch(FATURA, 201)
    await faturasService.criar({
      cliente_id: 'cli-uuid-1',
      itens: [{ produto_nome: 'Serviço de instalação', quantidade: 1, preco_unitario: 25000 }],
    })
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.itens[0]).toHaveProperty('produto_nome')
    expect(body.itens[0]).not.toHaveProperty('produto_id')
  })

  it('retorna FaturaResponse com numero no formato FAT-XXXXXX', async () => {
    mockFetch(FATURA, 201)
    const result = await faturasService.criar({
      cliente_id: 'cli-uuid-1',
      itens: [{ produto_nome: 'X', quantidade: 1, preco_unitario: 10000 }],
    })
    expect(result.numero).toMatch(/^FAT-\d{6}$/)
  })

  it('retorna fatura com cancelada_em = null (activa após criação)', async () => {
    mockFetch(FATURA, 201)
    const result = await faturasService.criar({
      cliente_id: 'cli-uuid-1',
      itens: [{ produto_nome: 'X', quantidade: 1, preco_unitario: 10000 }],
    })
    expect(result.cancelada_em).toBeNull()
  })
})

/* ── cancelar ───────────────────────────────────────────────── */
describe('faturasService.cancelar — POST /faturas/{id}/cancelar', () => {
  it('chama POST /faturas/{id}/cancelar', async () => {
    const spy = mockFetch(CANCELAMENTO)
    await faturasService.cancelar('fat-uuid-1')
    expect(spy).toHaveBeenCalledWith(
      `${BASE}/faturas/fat-uuid-1/cancelar`,
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('retorna CancelamentoResponse com cancelada_em preenchida', async () => {
    mockFetch(CANCELAMENTO)
    const result = await faturasService.cancelar('fat-uuid-1')
    expect(result.cancelada_em).toBe('2026-06-28T09:00:00Z')
    expect(result.situacao).toBe('CANCELADA')
    expect(result.numero).toBe('FAT-000001')
  })

  it('não envia body no pedido de cancelamento', async () => {
    const spy = mockFetch(CANCELAMENTO)
    await faturasService.cancelar('fat-uuid-1')
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body).toEqual({})
  })
})

/* ── performance ────────────────────────────────────────────── */
describe('faturasService.performance — GET /faturas/performance/estatisticas', () => {
  it('chama GET /faturas/performance/estatisticas sem filtros', async () => {
    const spy = mockFetch(PERFORMANCE)
    await faturasService.performance()
    expect(spy.mock.calls[0][0]).toBe(`${BASE}/faturas/performance/estatisticas`)
  })

  it('inclui data_inicio na query string quando fornecida', async () => {
    const spy = mockFetch(PERFORMANCE)
    await faturasService.performance('2026-01-01')
    expect(spy.mock.calls[0][0]).toContain('data_inicio=2026-01-01')
  })

  it('inclui data_fim quando fornecida', async () => {
    const spy = mockFetch(PERFORMANCE)
    await faturasService.performance(undefined, '2026-06-30')
    expect(spy.mock.calls[0][0]).toContain('data_fim=2026-06-30')
  })

  it('retorna PerformanceResponse com resumo, valores, top_clientes, tendencia', async () => {
    mockFetch(PERFORMANCE)
    const result = await faturasService.performance()
    expect(result.resumo.total_emitidas).toBe(150)
    expect(result.resumo.taxa_cancelamento).toBe(5.33)
    expect(result.valores.total_faturado).toBe(21000000)
    expect(result.top_clientes).toHaveLength(2)
    expect(result.tendencia).toHaveLength(1)
  })

  it('total_ativas = total_emitidas - total_canceladas', async () => {
    mockFetch(PERFORMANCE)
    const result = await faturasService.performance()
    expect(result.resumo.total_ativas).toBe(
      result.resumo.total_emitidas - result.resumo.total_canceladas
    )
  })

  it('top_clientes ordenados por total_faturado desc', async () => {
    mockFetch(PERFORMANCE)
    const result = await faturasService.performance()
    expect(result.top_clientes[0].total_faturado).toBeGreaterThan(result.top_clientes[1].total_faturado)
  })

  it('tendencia contém campos dia, faturas, valor', async () => {
    mockFetch(PERFORMANCE)
    const result = await faturasService.performance()
    const dia = result.tendencia[0]
    expect(dia).toHaveProperty('dia')
    expect(dia).toHaveProperty('faturas')
    expect(dia).toHaveProperty('valor')
  })
})
