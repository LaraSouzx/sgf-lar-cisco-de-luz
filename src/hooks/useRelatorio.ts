import { useEffect, useState } from 'react'
import { listLancamentos } from '../services/lancamentosService'
import {
  calcularRelatorio,
  calcularRelatorioDoador,
  type Relatorio,
  type RelatorioDoador,
} from './calcularRelatorio'
import { intervaloDoPeriodo } from './periodo'

export function useRelatorio(periodo: string, doadorId?: string) {
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null)
  const [relatorioDoador, setRelatorioDoador] = useState<RelatorioDoador | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Trocar período ou doador rápido pode fazer uma resposta antiga chegar depois da nova.
    let atual = true
    const { dataInicio, dataFim } = intervaloDoPeriodo(periodo)

    setIsLoading(true)
    setError(null)
    setRelatorio(null)
    setRelatorioDoador(null)

    // O relatório geral precisa do histórico até o fim do período (saldo anterior);
    // o de um doador só precisa das doações dentro do período.
    const busca = doadorId
      ? listLancamentos({ dataInicio, dataFim, doadorId })
      : listLancamentos({ dataFim })

    busca
      .then((lancamentos) => {
        if (!atual) return
        if (doadorId) setRelatorioDoador(calcularRelatorioDoador(lancamentos, periodo))
        else setRelatorio(calcularRelatorio(lancamentos, periodo))
      })
      .catch((err) => {
        if (atual) setError(err instanceof Error ? err.message : 'Erro ao carregar o relatório')
      })
      .finally(() => {
        if (atual) setIsLoading(false)
      })

    return () => {
      atual = false
    }
  }, [periodo, doadorId])

  return { relatorio, relatorioDoador, isLoading, error }
}
