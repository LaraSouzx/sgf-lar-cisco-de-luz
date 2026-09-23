import { useState } from 'react'
import { signInWithPassword } from '../services/authService'

export function useLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function login() {
    setIsLoading(true)
    setError(null)

    try {
      await signInWithPassword(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  return { email, setEmail, password, setPassword, isLoading, error, login }
}
