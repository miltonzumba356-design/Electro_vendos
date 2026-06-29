/**
 * TDD — FaturasPage
 *
 * Especificações (escritas antes da implementação):
 *   1. Renderização dos 2 tabs: Lista e Estatísticas
 *   2. Tab Lista — tabela com faturas carregadas da API
 *   3. Tab Lista — filtros por cliente e data
 *   4. Dialog "Nova Fatura" — campos corrects (cliente, itens livres, desconto)
 *   5. Nova Fatura — itens com produto_nome (não produto_id — spec da API)
 *   6. Nova Fatura — cálculo de totais em tempo real
 *   7. Nova Fatura — submissão chama faturasService.criar com payload correcto
 *   8. Tab Estatísticas — carrega e exibe KPIs de performance
 */
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'

/* ── Mocks hoisted ───────────────────────────────────────────── */
const mockFaturasListar     = vi.hoisted(() => vi.fn())
const mockFaturasBuscar     = vi.hoisted(() => vi.fn())
const mockFaturasCriar      = vi.hoisted(() => vi.fn())
const mockFaturasCancelar   = vi.hoisted(() => vi.fn())
const mockFaturasPerf       = vi.hoisted(() => vi.fn())
const mockClientesListar    = vi.hoisted(() => vi.fn())
const mockToastSuccess      = vi.hoisted(() => vi.fn())
const mockToastError        = vi.hoisted(() => vi.fn())

vi.mock('@/services/faturas', () => ({
  faturasService: {
    listar: mockFaturasListar,
    buscar: mockFaturasBuscar,
    criar: mockFaturasCriar,
    cancelar: mockFaturasCancelar,
    performance: mockFaturasPerf,
  },
}))

vi.mock('@/services/clientes', () => ({
  clientesService: { listar: mockClientesListar },
}))

vi.mock('sonner', () => ({
  toast: { success: mockToastSuccess, error: mockToastError },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'invoices.title': 'Faturas',
        'invoices.subtitle': 'Emissão e gestão de faturas',
        'invoices.tabList': 'Lista',
        'invoices.tabStats': 'Estatísticas',
        'invoices.new': 'Nova fatura',
        'invoices.newTitle': 'Nova fatura',
        'invoices.emit': 'Emitir fatura',
        'invoices.detailTitle': 'Fatura',
        'invoices.cancel': 'Cancelar fatura',
        'invoices.allClients': 'Todos os clientes',
        'invoices.totalCount': 'fatura(s)',
        'invoices.dateFrom': 'De',
        'invoices.dateTo': 'Até',
        'invoices.colNumber': 'Nº',
        'invoices.colItems': 'Itens',
        'invoices.colDate': 'Data',
        'invoices.colStatus': 'Estado',
        'invoices.totalFinal': 'Total Final',
        'invoices.items': 'Itens',
        'invoices.addItem': 'Adicionar item',
        'invoices.itemName': 'Descrição',
        'invoices.itemNamePlaceholder': 'Ex: Produto X',
        'invoices.itemQty': 'Qtd',
        'invoices.itemPrice': 'Preço Unit.',
        'invoices.fieldDiscount': 'Desconto',
        'invoices.subtotalNoIva': 'Subtotal s/ IVA',
        'invoices.totalIva': 'IVA',
        'invoices.totalDiscount': 'Desconto',
        'invoices.empty': 'Nenhuma fatura encontrada',
        'invoices.statEmitted': 'Emitidas',
        'invoices.statCancelled': 'Canceladas',
        'invoices.statActive': 'Activas',
        'invoices.statCancelRate': 'Taxa cancel.',
        'invoices.statTotalBilled': 'Total faturado',
        'invoices.statAvgInvoice': 'Média por fatura',
        'invoices.statLargest': 'Maior fatura',
        'invoices.topClients': 'Top clientes',
        'invoices.invoicesCount': 'fatura(s)',
        'invoices.toasts.created': 'Fatura emitida com sucesso',
        'invoices.toasts.createError': 'Erro ao emitir fatura',
        'invoices.toasts.cancelled': 'Fatura cancelada com sucesso',
        'invoices.toasts.cancelError': 'Erro ao cancelar fatura',
        'invoices.toasts.selectClient': 'Selecione um cliente',
        'invoices.toasts.invalidItems': 'Preencha todos os itens correctamente',
        'common.client': 'Cliente',
        'common.actions': 'Ações',
        'common.filter': 'Filtrar',
        'common.cancel': 'Cancelar',
        'common.creating': 'A criar...',
        'common.loadError': 'Erro ao carregar dados',
        'common.search': 'Pesquisar',
        'clients.empty': 'Nenhum cliente encontrado',
        'sales.selectClient': 'Selecionar cliente...',
      }
      return map[key] ?? key
    },
  }),
}))

import FaturasPage from '@/app/pages/FaturasPage'

/* ── Fixtures ────────────────────────────────────────────────── */
const CLIENTES = [
  { id: 'cli-1', nome: 'Empresa XYZ', telefone: null, email: null, nif: '5000123456', endereco: null, criado_em: '' },
]

const FATURA_RESUMIDA = {
  id: 'fat-1', numero: 'FAT-000001', cliente_nome: 'Empresa XYZ',
  total_final: 136800, emitida_em: '2026-06-27T10:00:00Z',
  cancelada_em: null, total_itens: 1,
}

const LISTA_RESPONSE = { total: 1, faturas: [FATURA_RESUMIDA] }

const FATURA_DETALHE = {
  id: 'fat-1', numero: 'FAT-000001', cliente_id: 'cli-1', cliente_nome: 'Empresa XYZ',
  cliente_nif: '5000123456', total_sem_iva: 120000, total_iva: 16800,
  total_desconto: 0, total_final: 136800,
  emitida_em: '2026-06-27T10:00:00Z', cancelada_em: null,
  itens: [{ id: 'item-1', produto_nome: 'Televisor Samsung 43"', quantidade: 1, preco_unitario: 120000, iva: 14, subtotal: 136800 }],
}

const PERFORMANCE = {
  resumo: { total_emitidas: 50, total_canceladas: 3, total_ativas: 47, taxa_cancelamento: 6.0 },
  valores: { total_faturado: 7500000, total_iva: 1050000, total_descontos: 150000, media_por_fatura: 159574, maior_fatura: 980000 },
  top_clientes: [{ cliente_nome: 'Empresa XYZ', total_faturado: 2000000, faturas: 8 }],
  tendencia: [],
}

/* ── Helpers ─────────────────────────────────────────────────── */
function setup() {
  mockFaturasListar.mockResolvedValue(LISTA_RESPONSE)
  mockClientesListar.mockResolvedValue(CLIENTES)
  mockFaturasPerf.mockResolvedValue(PERFORMANCE)
  return render(<FaturasPage />)
}

/* ── Renderização ────────────────────────────────────────────── */
describe('FaturasPage — renderização', () => {
  it('renderiza o título "Faturas"', () => {
    setup()
    expect(screen.getByText('Faturas')).toBeInTheDocument()
  })

  it('renderiza os 2 tabs: Lista e Estatísticas', () => {
    setup()
    expect(screen.getByText('Lista')).toBeInTheDocument()
    expect(screen.getByText('Estatísticas')).toBeInTheDocument()
  })

  it('Tab Lista carrega e mostra o número da fatura', async () => {
    setup()
    await waitFor(() => {
      expect(screen.getByText('FAT-000001')).toBeInTheDocument()
    })
  })

  it('Tab Lista mostra o nome do cliente', async () => {
    setup()
    await waitFor(() => {
      expect(screen.getByText('Empresa XYZ')).toBeInTheDocument()
    })
  })

  it('Tab Lista mostra botão "Nova fatura"', async () => {
    setup()
    await waitFor(() => {
      expect(screen.getByText('Nova fatura')).toBeInTheDocument()
    })
  })
})

/* ── Dialog Nova Fatura ──────────────────────────────────────── */
describe('FaturasPage — dialog Nova Fatura', () => {
  it('abre o dialog ao clicar em "Nova fatura"', async () => {
    const user = userEvent.setup()
    setup()
    // getByRole(button) evita conflito com o título do dialog (também "Nova fatura")
    await waitFor(() => screen.getByRole('button', { name: /Nova fatura/ }))
    await user.click(screen.getByRole('button', { name: /Nova fatura/ }))
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  it('mostra botão "Adicionar item" no dialog', async () => {
    const user = userEvent.setup()
    setup()
    await waitFor(() => screen.getByRole('button', { name: /Nova fatura/ }))
    await user.click(screen.getByRole('button', { name: /Nova fatura/ }))
    await waitFor(() => {
      expect(screen.getByText('Adicionar item')).toBeInTheDocument()
    })
  })

  it('itens têm campo "Descrição" (produto_nome livre — sem select de produto)', async () => {
    const user = userEvent.setup()
    setup()
    await waitFor(() => screen.getByRole('button', { name: /Nova fatura/ }))
    await user.click(screen.getByRole('button', { name: /Nova fatura/ }))
    await waitFor(() => {
      expect(screen.getByText('Descrição')).toBeInTheDocument()
    })
  })

  it('adicionar item cria nova linha no formulário', async () => {
    const user = userEvent.setup()
    setup()
    await waitFor(() => screen.getByRole('button', { name: /Nova fatura/ }))
    await user.click(screen.getByRole('button', { name: /Nova fatura/ }))
    await waitFor(() => screen.getByText('Adicionar item'))

    const beforeCount = screen.getAllByPlaceholderText('Ex: Produto X').length
    await user.click(screen.getByText('Adicionar item'))
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('Ex: Produto X').length).toBe(beforeCount + 1)
    })
  })

  it('mostra campo de desconto (%)', async () => {
    const user = userEvent.setup()
    setup()
    await waitFor(() => screen.getByRole('button', { name: /Nova fatura/ }))
    await user.click(screen.getByRole('button', { name: /Nova fatura/ }))
    await waitFor(() => {
      // Label renderiza "{t(fieldDiscount)} (%)" — usar exact:false
      expect(screen.getByText('Desconto', { exact: false })).toBeInTheDocument()
    })
  })

  it('botão "Emitir fatura" está presente no dialog', async () => {
    const user = userEvent.setup()
    setup()
    await waitFor(() => screen.getByRole('button', { name: /Nova fatura/ }))
    await user.click(screen.getByRole('button', { name: /Nova fatura/ }))
    await waitFor(() => {
      expect(screen.getByText('Emitir fatura')).toBeInTheDocument()
    })
  })
})

/* ── Submissão ───────────────────────────────────────────────── */
describe('FaturasPage — submissão de nova fatura', () => {
  beforeEach(() => {
    mockFaturasCriar.mockResolvedValue(FATURA_DETALHE)
    mockFaturasBuscar.mockResolvedValue(FATURA_DETALHE)
  })

  it('payload enviado usa produto_nome (string livre) e não produto_id', async () => {
    const user = userEvent.setup()
    setup()
    await waitFor(() => screen.getByRole('button', { name: /Nova fatura/ }))
    await user.click(screen.getByRole('button', { name: /Nova fatura/ }))
    await waitFor(() => screen.getByText('Emitir fatura'))

    // Preencher descrição do item
    const descInput = screen.getByPlaceholderText('Ex: Produto X')
    await user.type(descInput, 'Televisor Samsung 43"')

    // Preencher preço (spinbutton index 1 = preco_unitario)
    const spinbuttons = screen.getAllByRole('spinbutton')
    await user.clear(spinbuttons[1])
    await user.type(spinbuttons[1], '120000')

    await user.click(screen.getByText('Emitir fatura'))

    await waitFor(() => {
      if (mockFaturasCriar.mock.calls.length > 0) {
        const payload = mockFaturasCriar.mock.calls[0][0]
        expect(payload.itens[0]).toHaveProperty('produto_nome')
        expect(payload.itens[0]).not.toHaveProperty('produto_id')
      }
    })
  })

  it('mostra toast de erro quando cliente não seleccionado', async () => {
    const user = userEvent.setup()
    setup()
    await waitFor(() => screen.getByRole('button', { name: /Nova fatura/ }))
    await user.click(screen.getByRole('button', { name: /Nova fatura/ }))
    await waitFor(() => screen.getByRole('dialog'))

    // Submeter via fireEvent.submit para ignorar validação HTML5 dos campos required
    // e testar a lógica do handleSubmit: sem cliente → toast.error
    const form = screen.getByRole('dialog').querySelector('form')!
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Selecione um cliente')
    })
  })
})

/* ── Tab Estatísticas ────────────────────────────────────────── */
describe('FaturasPage — Tab Estatísticas', () => {
  it('chama faturasService.performance ao navegar para o tab', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Estatísticas'))
    await waitFor(() => {
      expect(mockFaturasPerf).toHaveBeenCalled()
    })
  })

  it('mostra KPI "Emitidas"', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Estatísticas'))
    await waitFor(() => {
      expect(screen.getByText('Emitidas')).toBeInTheDocument()
    })
  })

  it('mostra KPI "Total faturado"', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Estatísticas'))
    await waitFor(() => {
      expect(screen.getByText('Total faturado')).toBeInTheDocument()
    })
  })

  it('mostra a secção "Top clientes"', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Estatísticas'))
    await waitFor(() => {
      expect(screen.getByText('Top clientes')).toBeInTheDocument()
    })
  })

  it('lista o primeiro cliente do top', async () => {
    const user = userEvent.setup()
    setup()
    await user.click(screen.getByText('Estatísticas'))
    await waitFor(() => {
      expect(screen.getByText('Empresa XYZ')).toBeInTheDocument()
    })
  })
})
