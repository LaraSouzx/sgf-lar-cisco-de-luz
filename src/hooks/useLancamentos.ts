import { useCallback, useEffect, useRef, useState } from 'react'
import {
  cancelarLancamento,
  criarLancamento,
  editarLancamento,
  listLancamentos,
} from '../services/lancamentosService'
import { irParaEndereco } from '../lib/navegador'
import { ehPdf } from '../lib/regrasDeComprovante'
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
  const [comprovanteAberto, setComprovanteAberto] = useState<string | null>(null)
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

  // Foto abre num modal na própria tela (o link fica em `comprovanteAberto`); PDF leva a aba para o leitor do navegador.
  async function abrirComprovante(caminho: string) {
    setError(null)
    try {
      const link = await gerarLinkComprovante(caminho)
      if (ehPdf(caminho)) irParaEndereco(link)
      else setComprovanteAberto(link)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível abrir o comprovante')
    }
  }

  function fecharComprovante() {
    setComprovanteAberto(null)
  }

  return {
    lancamentos,
    isLoading,
    error,
    criar,
    editar,
    cancelar,
    abrirComprovante,
    comprovanteAberto,
    fecharComprovante,
  }
}
