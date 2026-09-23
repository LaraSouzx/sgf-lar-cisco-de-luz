import { act, renderHook, waitFor } from '@testing-library/react'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as authService from '../services/authService'
import { useSession } from './useSession'

vi.mock('../services/authService')

describe('useSession', () => {
  const unsubscribe = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authService.onAuthStateChange).mockReturnValue({ unsubscribe } as never)
  })

  it('expõe isLoading: true antes da sessão inicial resolver', () => {
    vi.mocked(authService.getSession).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useSession())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.session).toBeNull()
  })

  it('expõe a sessão retornada por getSession após carregar', async () => {
    const session = { access_token: 'token' } as Session
    vi.mocked(authService.getSession).mockResolvedValue(session)

    const { result } = renderHook(() => useSession())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.session).toBe(session)
  })

  it('reage a mudanças via onAuthStateChange', async () => {
    vi.mocked(authService.getSession).mockResolvedValue(null)
    let authChangeCallback: (event: AuthChangeEvent, session: Session | null) => void = () => {}
    vi.mocked(authService.onAuthStateChange).mockImplementation((callback) => {
      authChangeCallback = callback
      return { unsubscribe } as never
    })

    const { result } = renderHook(() => useSession())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const newSession = { access_token: 'novo-token' } as Session
    act(() => {
      authChangeCallback('SIGNED_IN', newSession)
    })

    expect(result.current.session).toBe(newSession)
  })

  it('cancela a inscrição ao desmontar', async () => {
    vi.mocked(authService.getSession).mockResolvedValue(null)

    const { unmount } = renderHook(() => useSession())
    await waitFor(() => expect(authService.getSession).toHaveBeenCalled())

    unmount()

    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})
