import { useCallback, useEffect, useRef, useState } from 'react'
import {
  cancelarLancamento,
  criarLancamento,
  editarLancamento,
  listLancamentos,
} from '../services/lancamentosService'
import { enviarComprovante, gerarLinkComprovante } from '../services/comprovanteService'
import type { Categoria } from '../types/categoria'
import type { Lancamento, NovoLancamento, TipoLancamento } from '../types/lancamento'
import { intervaloDoPeriodo } from './periodo'
import { useSalvarERecarregar } from './useSalvarERecarregar'
import { validarLancamento, type FormularioLancamento } from './validarLancamento'

export type FiltroLancamentos = { tipo?: TipoLancamento; mes?: string; semComprovante?: boolean }

export function useLancamentos({ tipo, mes, semComprovante }: FiltroLancamentos, categorias: Categoria[]) {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const ultimaRequisicao = useRef(0)

  const carregar = useCallback(() => {
    // Trocar o filtro rápido pode fazer uma resposta antiga chegar depois da nova; só a última vale.
    const requisicao = ++ultimaRequisicao.current
    return listLancamentos({ tipo, semComprovante, ...(mes && intervaloDoPeriodo(mes)) }).then((resultado) => {
      if (requisicao === ultimaRequisicao.current) setLancamentos(resultado)
    })
  }, [tipo, mes, semComprovante])

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

    const { lancamento, arquivo } = resultado
    return salvar(async () => {
      // O arquivo vai antes: se o envio falhar, o lançamento não é gravado sem a prova.
      const comprovanteUrl = arquivo ? await enviarComprovante(arquivo) : lancamento.comprovanteUrl
      await alteracao({ ...lancamento, comprovanteUrl })
    })
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

  async function abrirComprovante(caminho: string) {
    // A aba precisa ser aberta já no clique: o navegador bloqueia abas abertas depois de uma espera.
    const aba = window.open('', '_blank')
    if (!aba) {
      setError('Libere as janelas pop-up do navegador para abrir o comprovante')
      return
    }
    // A aba nunca deve ter acesso à página do sistema.
    aba.opener = null

    try {
      aba.location.href = await gerarLinkComprovante(caminho)
    } catch (err) {
      aba.close()
      setError(err instanceof Error ? err.message : 'Não foi possível abrir o comprovante')
    }
  }

  return { lancamentos, isLoading, error, criar, editar, cancelar, abrirComprovante }
}
