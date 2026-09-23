import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authService from '../services/authService'
import { ForgotPassword } from './ForgotPassword'

vi.mock('../services/authService')

function renderForgotPassword() {
  return render(
    <MemoryRouter initialEntries={['/esqueci-senha']}>
      <Routes>
        <Route path="/esqueci-senha" element={<ForgotPassword />} />
        <Route path="/login" element={<p>Tela de login</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra a confirmação após enviar o e-mail com sucesso', async () => {
    vi.mocked(authService.resetPasswordForEmail).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderForgotPassword()

    await user.type(screen.getByLabelText('E-mail'), 'lara@example.com')
    await user.click(screen.getByRole('button', { name: /enviar link de redefinição/i }))

    await waitFor(() =>
      expect(screen.getByText(/vai receber um link para redefinir sua senha/i)).toBeInTheDocument(),
    )
  })

  it('mostra mensagem de erro genérica quando o envio falha', async () => {
    vi.mocked(authService.resetPasswordForEmail).mockRejectedValue(
      new Error('Não foi possível enviar o e-mail de redefinição'),
    )
    const user = userEvent.setup()

    renderForgotPassword()

    await user.type(screen.getByLabelText('E-mail'), 'lara@example.com')
    await user.click(screen.getByRole('button', { name: /enviar link de redefinição/i }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Não foi possível enviar o e-mail de redefinição',
      ),
    )
  })
})
