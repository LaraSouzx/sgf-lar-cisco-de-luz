import { render, screen, waitFor } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authService from '../services/authService'
import { AuthProvider } from '../context/AuthContext'
import { ProtectedRoute } from './ProtectedRoute'

vi.mock('../services/authService')

function renderProtectedRoute() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>Tela de login</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<p>Conteúdo protegido</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.onAuthStateChange).mockReturnValue({ unsubscribe: vi.fn() } as never)
  })

  it('mostra um estado de carregamento enquanto a sessão ainda não resolveu', () => {
    vi.mocked(authService.getSession).mockReturnValue(new Promise(() => {}))

    renderProtectedRoute()

    expect(screen.getByText(/carregando/i)).toBeInTheDocument()
  })

  it('redireciona para /login quando não há sessão ativa', async () => {
    vi.mocked(authService.getSession).mockResolvedValue(null)

    renderProtectedRoute()

    await waitFor(() => expect(screen.getByText('Tela de login')).toBeInTheDocument())
  })

  it('renderiza as rotas filhas quando há sessão ativa', async () => {
    vi.mocked(authService.getSession).mockResolvedValue({ access_token: 'token' } as Session)

    renderProtectedRoute()

    await waitFor(() => expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument())
  })
})
