import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authService from '../services/authService'
import { useResetPassword } from './useResetPassword'

vi.mock('../services/authService')

describe('useResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('chama updatePassword quando as senhas coincidem', async () => {
    vi.mocked(authService.updatePassword).mockResolvedValue(undefined)

    const { result } = renderHook(() => useResetPassword())

    act(() => {
      result.current.setPassword('novaSenha123')
      result.current.setConfirmPassword('novaSenha123')
    })

    await act(async () => {
      await result.current.submit()
    })

    expect(authService.updatePassword).toHaveBeenCalledWith('novaSenha123')
    expect(result.current.isSubmitted).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('não chama updatePassword e expõe erro quando as senhas são diferentes', async () => {
    const { result } = renderHook(() => useResetPassword())

    act(() => {
      result.current.setPassword('novaSenha123')
      result.current.setConfirmPassword('outraSenha456')
    })

    await act(async () => {
      await result.current.submit()
    })

    expect(authService.updatePassword).not.toHaveBeenCalled()
    expect(result.current.error).toBe('As senhas não coincidem')
    expect(result.current.isSubmitted).toBe(false)
  })

  it('expõe mensagem de erro genérica quando o Supabase falha', async () => {
    vi.mocked(authService.updatePassword).mockRejectedValue(
      new Error('Não foi possível redefinir a senha'),
    )

    const { result } = renderHook(() => useResetPassword())

    act(() => {
      result.current.setPassword('novaSenha123')
      result.current.setConfirmPassword('novaSenha123')
    })

    await act(async () => {
      await result.current.submit()
    })

    await waitFor(() => expect(result.current.error).toBe('Não foi possível redefinir a senha'))
    expect(result.current.isSubmitted).toBe(false)
  })
})
