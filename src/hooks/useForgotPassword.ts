import { useState } from 'react'
import { resetPasswordForEmail } from '../services/authService'

export function useForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function submit() {
    setIsLoading(true)
    setError(null)

    try {
      const redirectTo = `${window.location.origin}/redefinir-senha`
      await resetPasswordForEmail(email, redirectTo)
      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar o e-mail de redefinição')
    } finally {
      setIsLoading(false)
    }
  }

  return { email, setEmail, isLoading, error, isSubmitted, submit }
}
