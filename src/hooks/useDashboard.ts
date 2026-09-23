import { useEffect, useState } from 'react'
import { listLancamentos } from '../services/lancamentosService'
import { calcularResumoDashboard, type ResumoDashboard } from './calcularResumoDashboard'

export function useDashboard() {
  const [resumo, setResumo] = useState<ResumoDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listLancamentos({})
      .then((lancamentos) => setResumo(calcularResumoDashboard(lancamentos)))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar o painel'))
      .finally(() => setIsLoading(false))
  }, [])

  return { resumo, isLoading, error }
}
