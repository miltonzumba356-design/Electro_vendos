/**
 * CDD — Componente LoginPage
 * Abrange: renderização, validação de formulário (zod), fluxos de submissão,
 * estados de erro e estado de carregamento.
 *
 * Dependências mockadas:
 *   - react-router   → useNavigate
 *   - AuthContext    → useAuth ({ login })
 *   - sonner         → toast
 *   - motion/react   → componentes passam children sem animação
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'

/* ── Hoisted mocks (executados antes de qualquer import) ──── */
const mockNavigate  = vi.hoisted(() => vi.fn())
const mockLogin     = vi.hoisted(() => vi.fn())
const mockToastErr  = vi.hoisted(() => vi.fn())

vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}))

vi.mock('sonner', () => ({
  toast: { error: mockToastErr, success: vi.fn() },
}))

// Substitui motion.* por HTML simples — evita WAAPI em jsdom
vi.mock('motion/react', async () => {
  const React = await import('react')
  const cache: Record<string, unknown> = {}
  const makeEl = (tag: string) => {
    if (!cache[tag]) {
      cache[tag] = React.forwardRef(
        ({ children, variants, initial, animate, transition, whileHover, whileTap, ...props }: any, ref: any) =>
          React.createElement(tag, { ...props, ref }, children)
      )
    }
    return cache[tag]
  }
  return { motion: new Proxy({} as any, { get: (_: any, tag: string) => makeEl(tag) }) }
})

import LoginPage from '@/app/pages/LoginPage'

/* ── Helpers ──────────────────────────────────────────────── */
function renderLogin() {
  return render(<LoginPage />)
}

// jsdom não aplica media queries: mobile + desktop renderizam em simultâneo.
// Usamos sempre o primeiro elemento encontrado (= instância mobile).
const getEmail    = () => screen.getAllByPlaceholderText('milton@gmail.com')[0]
const getPassword = () => screen.getAllByPlaceholderText('••••••••')[0]
const getSubmit   = () => screen.getAllByRole('button', { name: /entrar/i })[0]
const getForm     = (container: HTMLElement) => container.querySelector('form')!

/* Submete o formulário directamente via fireEvent (mais fiável em jsdom) */
async function submitForm(container: HTMLElement) {
  await fireEvent.submit(getForm(container))
}

/* ── Suíte ────────────────────────────────────────────────── */
describe('LoginPage — renderização', () => {
  it('renderiza campo de email', () => {
    renderLogin()
    expect(getEmail()).toBeInTheDocument()
  })

  it('renderiza campo de palavra-passe (type=password)', () => {
    renderLogin()
    const pw = getPassword()
    expect(pw).toBeInTheDocument()
    expect(pw).toHaveAttribute('type', 'password')
  })

  it('renderiza botão de submissão "Entrar"', () => {
    renderLogin()
    expect(getSubmit()).toBeInTheDocument()
  })

  it('renderiza o link "Esqueceu a senha?"', () => {
    renderLogin()
    expect(screen.getAllByText(/esqueceu a senha/i)[0]).toBeInTheDocument()
  })
})

describe('LoginPage — validação de formulário (zod)', () => {
  it('marca email como inválido ao submeter com email sem @', async () => {
    const user = userEvent.setup()
    const { container } = renderLogin()

    await user.type(getEmail(), 'invalido-sem-arroba')
    await user.type(getPassword(), 'senha123')
    await submitForm(container)

    await waitFor(() => {
      expect(getEmail()).toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('marca password como inválida ao submeter com campos vazios', async () => {
    const { container } = renderLogin()
    await submitForm(container)

    await waitFor(() => {
      expect(getPassword()).toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('não mostra erros antes de qualquer submissão', () => {
    renderLogin()
    expect(getEmail()).toHaveAttribute('aria-invalid', 'false')
    expect(getPassword()).toHaveAttribute('aria-invalid', 'false')
  })

  it('não chama login() quando os dados são inválidos', async () => {
    const { container } = renderLogin()
    await submitForm(container)

    await waitFor(() => {
      expect(getPassword()).toHaveAttribute('aria-invalid', 'true')
    })
    expect(mockLogin).not.toHaveBeenCalled()
  })
})

describe('LoginPage — submissão bem-sucedida', () => {
  beforeEach(() => {
    mockLogin.mockResolvedValue(undefined)
  })

  it('chama login() com email e password corretos', async () => {
    const user = userEvent.setup()
    const { container } = renderLogin()

    await user.type(getEmail(), 'admin@bisness.com')
    await user.type(getPassword(), 'admin123')
    await submitForm(container)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'admin@bisness.com',
        password: 'admin123',
      })
    })
  })

  it('navega para "/" após login bem-sucedido', async () => {
    const user = userEvent.setup()
    const { container } = renderLogin()

    await user.type(getEmail(), 'gestor@bisness.com')
    await user.type(getPassword(), 'gestor123')
    await submitForm(container)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })
})

describe('LoginPage — tratamento de erros', () => {
  it('chama toast.error quando login lança erro', async () => {
    mockLogin.mockRejectedValue(new Error('Credenciais inválidas'))
    const user = userEvent.setup()
    const { container } = renderLogin()

    await user.type(getEmail(), 'errado@bisness.com')
    await user.type(getPassword(), 'errado123')
    await submitForm(container)

    await waitFor(() => {
      expect(mockToastErr).toHaveBeenCalledWith('Credenciais inválidas')
    })
  })

  it('não navega para "/" quando login falha', async () => {
    mockLogin.mockRejectedValue(new Error('401'))
    const user = userEvent.setup()
    const { container } = renderLogin()

    await user.type(getEmail(), 'x@x.com')
    await user.type(getPassword(), 'wrong')
    await submitForm(container)

    await waitFor(() => expect(mockToastErr).toHaveBeenCalled())
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})

describe('LoginPage — estado de carregamento', () => {
  it('desactiva o botão enquanto o login está em curso', async () => {
    let resolveLogin!: () => void
    mockLogin.mockImplementation(
      () => new Promise<void>((res) => { resolveLogin = res })
    )

    const user = userEvent.setup()
    const { container } = renderLogin()

    await user.type(getEmail(), 'admin@bisness.com')
    await user.type(getPassword(), 'admin123')
    await submitForm(container)

    await waitFor(() => expect(getSubmit()).toBeDisabled())

    resolveLogin()
    await waitFor(() => expect(getSubmit()).not.toBeDisabled())
  })

  it('mostra "A entrar..." durante o carregamento', async () => {
    let resolveLogin!: () => void
    mockLogin.mockImplementation(
      () => new Promise<void>((res) => { resolveLogin = res })
    )

    const user = userEvent.setup()
    const { container } = renderLogin()

    await user.type(getEmail(), 'admin@bisness.com')
    await user.type(getPassword(), 'admin123')
    await submitForm(container)

    await waitFor(() => {
      expect(screen.getAllByText(/a entrar\.\.\./i)[0]).toBeInTheDocument()
    })

    resolveLogin()
  })
})
