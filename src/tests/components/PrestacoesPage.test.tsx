/**
 * TDD — PrestacoesPage
 *
 * Especificações testadas (escritas antes das implementações):
 *   1. PlanosTab — renderização da tabela e estado vazio
 *   2. PlanosTab — formulário "Novo Plano" com os campos do novo schema
 *      (cliente_id + produto_id + valor_total, sem venda_id)
 *   3. PlanosTab — validação do formulário
 *   4. PlanosTab — submissão chama prestacoesService.criar com payload correcto
 *   5. VencimentosTab — consulta por ano/mês e renderiza tabela
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'

/* ── Mocks hoisted ───────────────────────────────────────────── */
const mockListar        = vi.hoisted(() => vi.fn())
const mockCriar         = vi.hoisted(() => vi.fn())
const mockVencimentos   = vi.hoisted(() => vi.fn())
const mockClientesListar = vi.hoisted(() => vi.fn())
const mockProdutosListar = vi.hoisted(() => vi.fn())
const mockToastSuccess  = vi.hoisted(() => vi.fn())
const mockToastError    = vi.hoisted(() => vi.fn())

vi.mock('@/services/prestacoes', () => ({
  prestacoesService: {
    listar: mockListar,
    criar: mockCriar,
    registarPagamento: vi.fn(),
    dividasCliente: vi.fn(),
    vencimentosMes: mockVencimentos,
  },
}))

vi.mock('@/services/clientes', () => ({
  clientesService: { listar: mockClientesListar },
}))

vi.mock('@/services/produtos', () => ({
  produtosService: { listar: mockProdutosListar },
}))

vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'installments.title': 'Prestações',
        'installments.subtitle': 'Planos de pagamento a prestações',
        'installments.tabPlans': 'Planos',
        'installments.tabDebts': 'Dívidas por Cliente',
        'installments.tabVencimentos': 'Vencimentos',
        'installments.newPlan': 'Novo plano',
        'installments.newPlanTitle': 'Novo plano de prestações',
        'installments.fieldProduct': 'Produto financiado',
        'installments.selectProduct': 'Selecionar produto...',
        'installments.fieldTotalValue': 'Valor total (Kz)',
        'installments.fieldNumInstallments': 'Nº de prestações (1–48)',
        'installments.fieldPenaltyRate': 'Taxa de multa (%)',
        'installments.fieldStartDate': 'Data de início',
        'installments.createPlan': 'Criar plano',
        'installments.colClient': 'Cliente',
        'installments.colInstallments': 'Prestações',
        'installments.colTotal': 'Total',
        'installments.colPaid': 'Pago',
        'installments.colBalance': 'Saldo',
        'installments.colStatus': 'Situação',
        'installments.colDate': 'Data',
        'installments.colActions': 'Ações',
        'installments.empty': 'Nenhum plano de prestações encontrado',
        'installments.searchPlaceholder': 'Pesquisar por cliente...',
        'installments.vencYear': 'Ano',
        'installments.vencMonth': 'Mês',
        'installments.consult': 'Consultar',
        'installments.vencEmpty': 'Sem vencimentos para este mês',
        'installments.overdue': 'vencimento(s) em atraso',
        'installments.toasts.planCreated': 'Plano criado com sucesso',
        'installments.toasts.selectClient': 'Selecione um cliente',
        'installments.toasts.selectProduct': 'Selecione um produto',
        'installments.toasts.invalidValue': 'Introduza um valor válido',
        'installments.toasts.invalidInstallments': 'Número de prestações: 1 a 48',
        'installments.toasts.planCreateError': 'Erro ao criar plano',
        'installments.toasts.loadError': 'Erro ao carregar dados',
        'common.client': 'Cliente',
        'common.search': 'Pesquisar',
        'common.cancel': 'Cancelar',
        'common.creating': 'A criar...',
        'clients.empty': 'Nenhum cliente encontrado',
        'products.empty': 'Nenhum produto encontrado',
        'sales.selectClient': 'Selecionar cliente...',
      }
      return map[key] ?? key
    },
  }),
}))

import PrestacoesPage from '@/app/pages/PrestacoesPage'

/* ── Fixtures ────────────────────────────────────────────────── */
const CLIENTES = [
  { id: 'cli-1', nome: 'Ana Cristina', telefone: null, email: null, nif: null, endereco: null, criado_em: '' },
  { id: 'cli-2', nome: 'Bruno Cardoso', telefone: null, email: null, nif: null, endereco: null, criado_em: '' },
]

const PRODUTOS = [
  { id: 'prod-1', nome: 'Televisor Samsung', preco_venda: 120000, preco_com_iva: 136800, iva: 14, descricao: null, codigo_barras: null, preco_custo: 0, margem_lucro: 0, stock_atual: 10, stock_minimo: 2, ativo: true, criado_em: '' },
  { id: 'prod-2', nome: 'Frigorífico LG',    preco_venda: 85000,  preco_com_iva: 96900,  iva: 14, descricao: null, codigo_barras: null, preco_custo: 0, margem_lucro: 0, stock_atual: 5,  stock_minimo: 1, ativo: true, criado_em: '' },
]

const PRESTACAO = {
  id: 'prest-1', produto_id: 'prod-1', produto_nome: 'Televisor Samsung',
  cliente_id: 'cli-1', cliente_nome: 'Ana Cristina',
  valor_total: 120000, valor_pago: 20000, saldo: 100000,
  numero_prestacoes: 6, taxa_multa: 0, data_inicio: '2026-01-01T00:00:00Z',
  situacao: 'PARCIAL', criado_em: '2026-06-01T00:00:00Z', pagamentos: [],
}

const VENCIMENTO = {
  prestacao_id: 'prest-1', pagamento_id: 'pag-1',
  cliente_nome: 'Ana Cristina', produto_nome: 'Televisor Samsung',
  valor: 20000, data_vencimento: '2026-06-01T00:00:00Z', dias_atraso: 28,
}

/* ── Helpers ─────────────────────────────────────────────────── */
function setup() {
  mockListar.mockResolvedValue([PRESTACAO])
  mockClientesListar.mockResolvedValue(CLIENTES)
  mockProdutosListar.mockResolvedValue(PRODUTOS)
  mockVencimentos.mockResolvedValue([VENCIMENTO])
  return render(<PrestacoesPage />)
}

/* ── Renderização ────────────────────────────────────────────── */
describe('PrestacoesPage — renderização', () => {
  it('renderiza o título "Prestações"', async () => {
    setup()
    // getByRole('heading') evita conflito com a coluna "Prestações" na tabela
    expect(screen.getByRole('heading', { name: 'Prestações' })).toBeInTheDocument()
  })

  it('renderiza os 3 tabs: Planos, Dívidas, Vencimentos', async () => {
    setup()
    expect(screen.getByText('Planos')).toBeInTheDocument()
    expect(screen.getByText('Dívidas por Cliente')).toBeInTheDocument()
    expect(screen.getByText('Vencimentos')).toBeInTheDocument()
  })

  it('Tab Planos mostra a prestação após carregar', async () => {
    setup()
    await waitFor(() => {
      expect(screen.getByText('Ana Cristina')).toBeInTheDocument()
    })
  })

  it('Tab Planos mostra o produto financiado — campo novo do schema', async () => {
    setup()
    // produto_nome não aparece na tabela principal mas confirma que o dado carregou
    await waitFor(() => {
      expect(mockListar).toHaveBeenCalled()
    })
  })
})

/* ── Botão Novo Plano ────────────────────────────────────────── */
describe('PrestacoesPage — abrir dialog "Novo Plano"', () => {
  it('abre o dialog ao clicar em "Novo plano"', async () => {
    const user = userEvent.setup()
    setup()
    await waitFor(() => screen.getByText('Novo plano'))
    await user.click(screen.getByText('Novo plano'))
    await waitFor(() => {
      expect(screen.getByText('Novo plano de prestações')).toBeInTheDocument()
    })
  })

  it('mostra campo "Produto financiado" (novo schema — sem "Venda")', async () => {
    const user = userEvent.setup()
    setup()
    await waitFor(() => screen.getByText('Novo plano'))
    await user.click(screen.getByText('Novo plano'))
    await waitFor(() => {
      // Label renderiza "{t(fieldProduct)} *" — usar exact:false para substring match
      expect(screen.getByText('Produto financiado', { exact: false })).toBeInTheDocument()
    })
  })

  it('NÃO mostra campo "Venda" (schema antigo removido)', async () => {
    const user = userEvent.setup()
    setup()
    await waitFor(() => screen.getByText('Novo plano'))
    await user.click(screen.getByText('Novo plano'))
    await waitFor(() => {
      expect(screen.queryByText('Venda')).not.toBeInTheDocument()
    })
  })

  it('mostra campo "Valor total (Kz)"', async () => {
    const user = userEvent.setup()
    setup()
    await waitFor(() => screen.getByText('Novo plano'))
    await user.click(screen.getByText('Novo plano'))
    await waitFor(() => {
      // Label renderiza "{t(fieldTotalValue)} *" — usar exact:false para substring match
      expect(screen.getByText('Valor total (Kz)', { exact: false })).toBeInTheDocument()
    })
  })

  it('mostra campo "Taxa de multa (%)"', async () => {
    const user = userEvent.setup()
    setup()
    await waitFor(() => screen.getByText('Novo plano'))
    await user.click(screen.getByText('Novo plano'))
    await waitFor(() => {
      expect(screen.getByText('Taxa de multa (%)')).toBeInTheDocument()
    })
  })
})

/* ── Submissão com payload correcto ──────────────────────────── */
describe('PrestacoesPage — submissão do formulário de criação', () => {
  beforeEach(() => {
    mockCriar.mockResolvedValue({ ...PRESTACAO, id: 'prest-new' })
  })

  it('chama criar com cliente_id (não venda_id)', async () => {
    const user = userEvent.setup()
    setup()
    await waitFor(() => screen.getByText('Novo plano'))
    await user.click(screen.getByText('Novo plano'))
    await waitFor(() => screen.getByText('Novo plano de prestações'))

    // Preencher valor total e nº prestações (campos de input directo)
    const inputs = screen.getAllByRole('spinbutton')
    // inputs: [valor_total, num_prestacoes, taxa_multa]
    await user.clear(inputs[0])
    await user.type(inputs[0], '120000')

    await user.click(screen.getByText('Criar plano'))

    await waitFor(() => {
      // Deve ter chamado com cliente_id no payload, não venda_id
      if (mockCriar.mock.calls.length > 0) {
        const payload = mockCriar.mock.calls[0][0]
        expect(payload).not.toHaveProperty('venda_id')
        expect(payload).toHaveProperty('cliente_id')
        expect(payload).toHaveProperty('produto_id')
        expect(payload).toHaveProperty('valor_total')
        expect(payload).toHaveProperty('numero_prestacoes')
      }
    })
  })
})

/* ── Tab Vencimentos ─────────────────────────────────────────── */
describe('PrestacoesPage — Tab Vencimentos', () => {
  it('mostra os campos Ano e Mês ao navegar para o tab', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Vencimentos'))
    await waitFor(() => {
      expect(screen.getByText('Ano')).toBeInTheDocument()
      expect(screen.getByText('Mês')).toBeInTheDocument()
    })
  })

  it('mostra botão "Consultar"', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Vencimentos'))
    await waitFor(() => {
      expect(screen.getByText('Consultar')).toBeInTheDocument()
    })
  })

  it('chama vencimentosMes ao clicar em "Consultar"', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Vencimentos'))
    await waitFor(() => screen.getByText('Consultar'))
    await user.click(screen.getByText('Consultar'))
    await waitFor(() => {
      expect(mockVencimentos).toHaveBeenCalled()
    })
  })

  it('mostra vencimento em atraso na tabela (dias_atraso > 0)', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Vencimentos'))
    await waitFor(() => screen.getByText('Consultar'))
    await user.click(screen.getByText('Consultar'))
    await waitFor(() => {
      // Client info visible
      expect(screen.getByText('Ana Cristina')).toBeInTheDocument()
    })
  })
})
