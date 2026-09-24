import { useCallback, useEffect, useRef, useState } from 'react'
import {
  cancelarLancamento,
  criarLancamento,
  editarLancamento,
  listLancamentos,
} from '../services/lancamentosService'
import type { Categoria } from '../types/categoria'
import type { Lancamento, NovoLancamento, TipoLancamento } from '../types/lancamento'
import { useSalvarERecarregar } from './useSalvarERecarregar'
import { validarLancamento, type FormularioLancamento } from './validarLancamento'

export type FiltroLancamentos = { tipo?: TipoLancamento; mes?: string }

// "2026-02" -> do dia 1 ao último dia do mês (dia 0 do mês seguinte = último dia deste).
function intervaloDoMes(mes?: string) {
  if (!mes) return {}
  const [ano, numeroMes] = mes.split('-').map(Number)
  const ultimoDia = String(new Date(ano, numeroMes, 0).getDate()).padStart(2, '0')
  return { dataInicio: `${mes}-01`, dataFim: `${mes}-${ultimoDia}` }
}

export function useLancamentos({ tipo, mes }: FiltroLancamentos, categorias: Categoria[]) {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const ultimaRequisicao = useRef(0)

  const carregar = useCallback(() => {
    // Trocar o filtro rápido pode fazer uma resposta antiga chegar depois da nova; só a última vale.
    const requisicao = ++ultimaRequisicao.current
    return listLancamentos({ tipo, ...intervaloDoMes(mes) }).then((resultado) => {
      if (requisicao === ultimaRequisicao.current) setLancamentos(resultado)
    })
  }, [tipo, mes])

  const { error, setError, salvar } = useSalvarERecarregar(carregar, 'Erro ao salvar o lançamento')

  useEffect(() => {
    carregar()
      .then(() => setError(null))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar os lançamentos'))
      .finally(() => setIsLoading(false))
  }, [carregar, setError])

  // Só chama o service se o formulário passar na validação.
  function salvarSeValido(
    formulario: FormularioLancamento,
    alteracao: (lancamento: NovoLancamento) => Promise<void>,
  ) {
    const resultado = validarLancamento(formulario, categorias)
    if ('erro' in resultado) {
      setError(resultado.erro)
      return Promise.resolve(false)
    }

    return salvar(() => alteracao(resultado.lancamento))
  }

  function criar(formulario: FormularioLancamento) {
    return salvarSeValido(formulario, criarLancamento)
  }

  function editar(id: string, formulario: FormularioLancamento) {
    // O tipo só serve para validar a categoria; o service não altera o tipo de um lançamento existente.
    return salvarSeValido(formulario, ({ tipo: _tipo, ...edicao }) => editarLancamento(id, edicao))
  }

  function cancelar(id: string) {
    return salvar(() => cancelarLancamento(id))
  }

  return { lancamentos, isLoading, error, criar, editar, cancelar }
}
