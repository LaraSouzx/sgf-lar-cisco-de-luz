import { useState } from 'react'
import { updatePassword } from '../services/authService'

export function useResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function submit() {
    setError(null)

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setIsLoading(true)

    try {
      await updatePassword(password)
      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir a senha')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    error,
    isSubmitted,
    submit,
  }
}
