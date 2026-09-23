import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import {
  getSession,
  onAuthStateChange,
  resetPasswordForEmail,
  signInWithPassword,
  signOut,
  updatePassword,
} from './authService'

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
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

  describe('resetPasswordForEmail', () => {
    it('pede ao Supabase para enviar o e-mail de redefinição com o redirect informado', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      } as never)

      await resetPasswordForEmail('lara@example.com', 'https://app.exemplo.com/redefinir-senha')

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('lara@example.com', {
        redirectTo: 'https://app.exemplo.com/redefinir-senha',
      })
    })

    it('lança mensagem genérica quando o Supabase retorna erro', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: { message: 'Rate limit exceeded' },
      } as never)

      await expect(
        resetPasswordForEmail('lara@example.com', 'https://app.exemplo.com/redefinir-senha'),
      ).rejects.toThrow('Não foi possível enviar o e-mail de redefinição')
    })
  })

  describe('updatePassword', () => {
    it('não lança erro quando o Supabase atualiza a senha com sucesso', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never)

      await expect(updatePassword('novaSenha123')).resolves.toBeUndefined()
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'novaSenha123' })
    })

    it('lança mensagem genérica quando o Supabase retorna erro', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth session missing' },
      } as never)

      await expect(updatePassword('novaSenha123')).rejects.toThrow(
        'Não foi possível redefinir a senha',
      )
    })

    it('lança mensagem específica quando a nova senha é igual à atual', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: {
          message: 'New password should be different from the old password.',
          code: 'same_password',
        },
      } as never)

      await expect(updatePassword('novaSenha123')).rejects.toThrow(
        'A nova senha deve ser diferente da senha atual',
      )
    })
  })
})
