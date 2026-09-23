import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authService from '../services/authService'
import { useForgotPassword } from './useForgotPassword'

vi.mock('../services/authService')

describe('useForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('chama resetPasswordForEmail com o e-mail informado e marca como enviado', async () => {
    vi.mocked(authService.resetPasswordForEmail).mockResolvedValue(undefined)

    const { result } = renderHook(() => useForgotPassword())

    act(() => {
      result.current.setEmail('lara@example.com')
    })

    await act(async () => {
      await result.current.submit()
    })

    expect(authService.resetPasswordForEmail).toHaveBeenCalledWith(
      'lara@example.com',
      expect.stringContaining('/redefinir-senha'),
    )
    expect(result.current.isSubmitted).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('expõe mensagem de erro genérica quando o envio falha', async () => {
    vi.mocked(authService.resetPasswordForEmail).mockRejectedValue(
      new Error('Não foi possível enviar o e-mail de redefinição'),
    )

    const { result } = renderHook(() => useForgotPassword())

    await act(async () => {
      await result.current.submit()
    })

    await waitFor(() =>
      expect(result.current.error).toBe('Não foi possível enviar o e-mail de redefinição'),
    )
    expect(result.current.isSubmitted).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })
})
