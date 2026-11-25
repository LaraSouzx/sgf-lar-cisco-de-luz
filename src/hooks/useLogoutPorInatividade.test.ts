import { renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLogoutPorInatividade } from './useLogoutPorInatividade'

const LIMITE_EM_MS = 1000

describe('useLogoutPorInatividade', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('desloga quando passa o limite sem nenhuma atividade', () => {
    const aoExpirar = vi.fn()
    renderHook(() => useLogoutPorInatividade(aoExpirar, LIMITE_EM_MS))

    vi.advanceTimersByTime(LIMITE_EM_MS)

    expect(aoExpirar).toHaveBeenCalledTimes(1)
  })

  it('reinicia a contagem a cada atividade da usuária', () => {
    const aoExpirar = vi.fn()
    renderHook(() => useLogoutPorInatividade(aoExpirar, LIMITE_EM_MS))

    vi.advanceTimersByTime(LIMITE_EM_MS - 100)
    window.dispatchEvent(new Event('keydown'))
    vi.advanceTimersByTime(LIMITE_EM_MS - 100)

    expect(aoExpirar).not.toHaveBeenCalled()
  })

  it('para de contar quando o componente é desmontado', () => {
    const aoExpirar = vi.fn()
    const { unmount } = renderHook(() => useLogoutPorInatividade(aoExpirar, LIMITE_EM_MS))

    unmount()
    vi.advanceTimersByTime(LIMITE_EM_MS * 2)

    expect(aoExpirar).not.toHaveBeenCalled()
  })
})
