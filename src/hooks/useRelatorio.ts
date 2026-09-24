import { useEffect, useState } from 'react'
import { listLancamentos } from '../services/lancamentosService'
import {
  calcularRelatorio,
  calcularRelatorioDoador,
  type Relatorio,
  type RelatorioDoador,
} from './calcularRelatorio'
import { intervaloDoPeriodo } from './periodo'

// O resultado guarda de qual pedido (período + doador) ele é.
type Resultado = {
  chave: string
  relatorio: Relatorio | null
  relatorioDoador: RelatorioDoador | null
  error: string | null
}

export function useRelatorio(periodo: string, doadorId?: string) {
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const chave = `${periodo}|${doadorId ?? ''}`

  useEffect(() => {
    // Trocar período ou doador rápido pode fazer uma resposta antiga chegar depois da nova.
    let atual = true
    const { dataInicio, dataFim } = intervaloDoPeriodo(periodo)

    // O relatório geral precisa do histórico até o fim do período (saldo anterior);
    // o de um doador só precisa das doações dentro do período.
    const busca = doadorId
      ? listLancamentos({ dataInicio, dataFim, doadorId })
      : listLancamentos({ dataFim })

    busca
      .then((lancamentos) => {
        if (!atual) return
        setResultado({
          chave,
          relatorio: doadorId ? null : calcularRelatorio(lancamentos, periodo),
          relatorioDoador: doadorId ? calcularRelatorioDoador(lancamentos, periodo) : null,
          error: null,
        })
      })
      .catch((err) => {
        if (!atual) return
        const error = err instanceof Error ? err.message : 'Erro ao carregar o relatório'
        setResultado({ chave, relatorio: null, relatorioDoador: null, error })
      })

    return () => {
      atual = false
    }
  }, [periodo, doadorId, chave])

  // Enquanto o resultado guardado for de outro pedido, está carregando (sem mostrar dados do período anterior).
  const pronto = resultado?.chave === chave ? resultado : null

  return {
    relatorio: pronto?.relatorio ?? null,
    relatorioDoador: pronto?.relatorioDoador ?? null,
    isLoading: !pronto,
    error: pronto?.error ?? null,
  }
}
