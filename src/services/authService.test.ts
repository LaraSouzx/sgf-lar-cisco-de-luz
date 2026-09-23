import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { getSession, onAuthStateChange, signInWithPassword, signOut } from './authService'

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('signInWithPassword', () => {
    it('não lança erro quando o Supabase autentica com sucesso', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      } as never)

      await expect(signInWithPassword('lara@example.com', 'senha123')).resolves.toBeUndefined()
    })

    it('lança mensagem genérica quando o Supabase retorna erro', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      } as never)

      await expect(signInWithPassword('lara@example.com', 'errada')).rejects.toThrow(
        'E-mail ou senha inválidos',
      )
    })
  })

  describe('getSession', () => {
    it('retorna a sessão atual do Supabase', async () => {
      const session = { access_token: 'token' } as Session
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session },
        error: null,
      } as never)

      await expect(getSession()).resolves.toBe(session)
    })

    it('retorna null quando não há sessão ativa', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as never)

      await expect(getSession()).resolves.toBeNull()
    })
  })

  describe('signOut', () => {
    it('chama o signOut do Supabase', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as never)

      await signOut()

      expect(supabase.auth.signOut).toHaveBeenCalledOnce()
    })
  })

  describe('onAuthStateChange', () => {
    it('repassa o callback para o Supabase e retorna a função de cancelamento', () => {
      const unsubscribe = vi.fn()
      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: { unsubscribe } },
      } as never)

      const callback = vi.fn()
      const result = onAuthStateChange(callback)

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(callback)
      result.unsubscribe()
      expect(unsubscribe).toHaveBeenCalledOnce()
    })
  })
})
