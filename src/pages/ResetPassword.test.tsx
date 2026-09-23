import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authService from '../services/authService'
import { ResetPassword } from './ResetPassword'

vi.mock('../services/authService')

function renderResetPassword() {
  return render(
    <MemoryRouter initialEntries={['/redefinir-senha']}>
      <Routes>
        <Route path="/redefinir-senha" element={<ResetPassword />} />
        <Route path="/" element={<p>Conteúdo protegido</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redireciona para / após redefinir a senha com sucesso', async () => {
    vi.mocked(authService.updatePassword).mockResolvedValue(undefined)
    const user = userEvent.setup()

    renderResetPassword()

    await user.type(screen.getByLabelText('Nova senha'), 'novaSenha123')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'novaSenha123')
    await user.click(screen.getByRole('button', { name: /redefinir senha/i }))

    await waitFor(() => expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument())
    expect(authService.updatePassword).toHaveBeenCalledWith('novaSenha123')
  })

  it('mostra erro quando as senhas não coincidem, sem chamar o Supabase', async () => {
    const user = userEvent.setup()

    renderResetPassword()

    await user.type(screen.getByLabelText('Nova senha'), 'novaSenha123')
    await user.type(screen.getByLabelText('Confirmar nova senha'), 'outraSenha456')
    await user.click(screen.getByRole('button', { name: /redefinir senha/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('As senhas não coincidem'))
    expect(authService.updatePassword).not.toHaveBeenCalled()
  })
})
