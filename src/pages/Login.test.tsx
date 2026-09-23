import { render, screen, waitFor } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authService from '../services/authService'
import { AuthProvider } from '../context/AuthContext'
import { Login } from './Login'

vi.mock('../services/authService')

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<p>Conteúdo protegido</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.onAuthStateChange).mockReturnValue({ unsubscribe: vi.fn() } as never)
  })

  it('redireciona para / quando já existe uma sessão ativa', async () => {
    vi.mocked(authService.getSession).mockResolvedValue({ access_token: 'token' } as Session)

    renderLogin()

    await waitFor(() => expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument())
  })

  it('permanece em /login enquanto não há sessão', async () => {
    vi.mocked(authService.getSession).mockResolvedValue(null)

    renderLogin()

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument())
  })
})
