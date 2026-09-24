import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authService from '../services/authService'
import { AuthProvider } from '../context/AuthContext'
import { AppShell } from './AppShell'

vi.mock('../services/authService')

function renderAppShell() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AppShell>
          <p>Conteúdo</p>
        </AppShell>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('AppShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.getSession).mockResolvedValue(null)
    vi.mocked(authService.onAuthStateChange).mockReturnValue({ unsubscribe: vi.fn() } as never)
  })

  it('links de telas que ainda não existem não são navegáveis', () => {
    renderAppShell()

    const configuracoes = screen.getByText('Configurações')
    expect(configuracoes.tagName).toBe('SPAN')
    expect(configuracoes).toHaveAttribute('aria-disabled', 'true')
  })

  it('"Visão geral" navega para /', () => {
    renderAppShell()

    const link = screen.getByRole('link', { name: /visão geral/i })
    expect(link).toHaveAttribute('href', '/')
  })

  it('botão Sair chama o signOut de verdade', async () => {
    vi.mocked(authService.signOut).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderAppShell()
    await user.click(screen.getByRole('button', { name: /sair/i }))

    expect(authService.signOut).toHaveBeenCalledOnce()
  })

  it('recolhe e reabre o menu lateral ao clicar no botão de alternância', async () => {
    const user = userEvent.setup()
    renderAppShell()

    const botaoMenu = screen.getByRole('button', { name: 'Fechar menu lateral' })
    expect(botaoMenu).toHaveAttribute('aria-expanded', 'true')

    await user.click(botaoMenu)

    expect(screen.getByRole('button', { name: 'Abrir menu lateral' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })
})
