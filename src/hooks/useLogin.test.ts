import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authService from '../services/authService'
import { useLogin } from './useLogin'

vi.mock('../services/authService')

describe('useLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('chama signInWithPassword com e-mail e senha informados', async () => {
    vi.mocked(authService.signInWithPassword).mockResolvedValue(undefined)

    const { result } = renderHook(() => useLogin())

    act(() => {
      result.current.setEmail('lara@example.com')
      result.current.setPassword('senha123')
    })

    await act(async () => {
      await result.current.login()
    })

    expect(authService.signInWithPassword).toHaveBeenCalledWith('lara@example.com', 'senha123')
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('expõe mensagem de erro genérica quando o login falha', async () => {
    vi.mocked(authService.signInWithPassword).mockRejectedValue(
      new Error('E-mail ou senha inválidos'),
    )

    const { result } = renderHook(() => useLogin())

    await act(async () => {
      await result.current.login()
    })

    await waitFor(() => expect(result.current.error).toBe('E-mail ou senha inválidos'))
    expect(result.current.isLoading).toBe(false)
  })
})
