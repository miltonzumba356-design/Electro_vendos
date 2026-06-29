/**
 * TDD — Componente Combobox
 *
 * Comportamentos especificados antes de qualquer ajuste ao componente:
 *   1. Renderização inicial: mostra placeholder e nada seleccionado
 *   2. Abre popover ao clicar no trigger
 *   3. Filtragem por texto — deve funcionar letra a letra sem reset
 *   4. Selecção de opção — invoca onValueChange e fecha o popover
 *   5. Limpar selecção — seleccionar item já seleccionado desselecciona
 *   6. Estado vazio — mostra emptyText quando nenhum item corresponde
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect } from 'vitest'
import { Combobox } from '@/app/components/ui/combobox'

const OPTIONS = [
  { value: 'cli-1', label: 'Ana Cristina' },
  { value: 'cli-2', label: 'Bruno Cardoso' },
  { value: 'cli-3', label: 'Carlos Mendes' },
  { value: 'cli-4', label: 'Ana Paula' },
]

function renderCombobox(overrides: Partial<React.ComponentProps<typeof Combobox>> = {}) {
  const onValueChange = vi.fn()
  render(
    <Combobox
      options={OPTIONS}
      value=""
      onValueChange={onValueChange}
      placeholder="Selecionar cliente..."
      searchPlaceholder="Pesquisar..."
      emptyText="Sem resultados"
      {...overrides}
    />
  )
  return { onValueChange }
}

/* ── Renderização ────────────────────────────────────────────── */
describe('Combobox — renderização inicial', () => {
  it('mostra placeholder quando nenhum valor está seleccionado', () => {
    renderCombobox()
    expect(screen.getByRole('combobox')).toHaveTextContent('Selecionar cliente...')
  })

  it('mostra o label do valor seleccionado quando value não é vazio', () => {
    renderCombobox({ value: 'cli-1' })
    expect(screen.getByRole('combobox')).toHaveTextContent('Ana Cristina')
  })

  it('não mostra a lista de opções antes de abrir', () => {
    renderCombobox()
    expect(screen.queryByPlaceholderText('Pesquisar...')).not.toBeInTheDocument()
  })
})

/* ── Abertura ────────────────────────────────────────────────── */
describe('Combobox — abertura do popover', () => {
  it('mostra o input de pesquisa após clicar no trigger', async () => {
    const user = userEvent.setup()
    renderCombobox()
    await user.click(screen.getByRole('combobox'))
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Pesquisar...')).toBeInTheDocument()
    })
  })

  it('mostra todas as opções ao abrir sem texto de pesquisa', async () => {
    const user = userEvent.setup()
    renderCombobox()
    await user.click(screen.getByRole('combobox'))
    await waitFor(() => {
      expect(screen.getByText('Ana Cristina')).toBeInTheDocument()
      expect(screen.getByText('Bruno Cardoso')).toBeInTheDocument()
      expect(screen.getByText('Carlos Mendes')).toBeInTheDocument()
    })
  })
})

/* ── Filtragem — núcleo do TDD ───────────────────────────────── */
describe('Combobox — pesquisa e filtragem', () => {
  it('filtra opções ao escrever no input — mostra apenas correspondências', async () => {
    const user = userEvent.setup()
    renderCombobox()
    await user.click(screen.getByRole('combobox'))
    const input = await screen.findByPlaceholderText('Pesquisar...')

    await user.type(input, 'ana')

    await waitFor(() => {
      expect(screen.getByText('Ana Cristina')).toBeInTheDocument()
      expect(screen.getByText('Ana Paula')).toBeInTheDocument()
      expect(screen.queryByText('Bruno Cardoso')).not.toBeInTheDocument()
      expect(screen.queryByText('Carlos Mendes')).not.toBeInTheDocument()
    })
  })

  it('pesquisa é case-insensitive (Ana = ANA = ana)', async () => {
    const user = userEvent.setup()
    renderCombobox()
    await user.click(screen.getByRole('combobox'))
    const input = await screen.findByPlaceholderText('Pesquisar...')

    await user.type(input, 'ANA')

    await waitFor(() => {
      expect(screen.getByText('Ana Cristina')).toBeInTheDocument()
    })
  })

  it('mantém o texto de pesquisa entre teclas (sem reset por re-render)', async () => {
    const user = userEvent.setup()
    renderCombobox()
    await user.click(screen.getByRole('combobox'))
    const input = await screen.findByPlaceholderText('Pesquisar...')

    await user.type(input, 'bru')

    await waitFor(() => {
      expect(input).toHaveValue('bru')
    })
  })

  it('mostra emptyText quando pesquisa não tem resultados', async () => {
    const user = userEvent.setup()
    renderCombobox()
    await user.click(screen.getByRole('combobox'))
    const input = await screen.findByPlaceholderText('Pesquisar...')

    await user.type(input, 'zzzz')

    await waitFor(() => {
      expect(screen.getByText('Sem resultados')).toBeInTheDocument()
    })
  })

  it('pesquisa parcial — "card" encontra "Bruno Cardoso"', async () => {
    const user = userEvent.setup()
    renderCombobox()
    await user.click(screen.getByRole('combobox'))
    const input = await screen.findByPlaceholderText('Pesquisar...')

    await user.type(input, 'card')

    await waitFor(() => {
      expect(screen.getByText('Bruno Cardoso')).toBeInTheDocument()
      expect(screen.queryByText('Ana Cristina')).not.toBeInTheDocument()
    })
  })
})

/* ── Selecção ────────────────────────────────────────────────── */
describe('Combobox — selecção de opção', () => {
  it('chama onValueChange com o value correcto ao clicar numa opção', async () => {
    const user = userEvent.setup()
    const { onValueChange } = renderCombobox()
    await user.click(screen.getByRole('combobox'))
    await waitFor(() => screen.getByText('Ana Cristina'))
    await user.click(screen.getByText('Ana Cristina'))
    expect(onValueChange).toHaveBeenCalledWith('cli-1')
  })

  it('chama onValueChange com string vazia ao seleccionar item já seleccionado (toggle off)', async () => {
    const user = userEvent.setup()
    const { onValueChange } = renderCombobox({ value: 'cli-2' })
    await user.click(screen.getByRole('combobox'))
    // trigger + option ambos têm "Bruno Cardoso" — usar role=option para a lista
    await waitFor(() => screen.getByRole('option', { name: /Bruno Cardoso/ }))
    await user.click(screen.getByRole('option', { name: /Bruno Cardoso/ }))
    expect(onValueChange).toHaveBeenCalledWith('')
  })

  it('limpa o texto de pesquisa após seleccionar uma opção', async () => {
    const user = userEvent.setup()
    renderCombobox()
    await user.click(screen.getByRole('combobox'))
    const input = await screen.findByPlaceholderText('Pesquisar...')
    await user.type(input, 'ana')
    await waitFor(() => screen.getByText('Ana Cristina'))
    await user.click(screen.getByText('Ana Cristina'))

    // Reabre para verificar que o campo de pesquisa está limpo
    await user.click(screen.getByRole('combobox'))
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Pesquisar...')).toHaveValue('')
    })
  })
})

/* ── Opções dinâmicas ────────────────────────────────────────── */
describe('Combobox — opções dinâmicas', () => {
  it('mostra lista vazia quando options = []', async () => {
    const user = userEvent.setup()
    renderCombobox({ options: [] })
    await user.click(screen.getByRole('combobox'))
    await waitFor(() => {
      expect(screen.getByText('Sem resultados')).toBeInTheDocument()
    })
  })
})
