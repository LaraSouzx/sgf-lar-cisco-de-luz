import { useCallback, useEffect, useState } from 'react'
import { criarDoador, editarDoador, listarDoadores } from '../services/doadorService'
import type { Doador, TipoDoador } from '../types/doador'
import { useSalvarERecarregar } from './useSalvarERecarregar'
import { normalizarDocumento, validarDocumento } from './validarDocumento'

export type FormularioDoador = { nome: string; tipo: TipoDoador; documento: string }

function semAcentoEmMinusculas(texto: string) {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

// Feedback imediato no formulário; o índice único no banco continua sendo a garantia real.
// `idIgnorado` evita acusar duplicidade do doador com o próprio documento ao editar.
function validarDoador({ nome, tipo, documento }: FormularioDoador, doadores: Doador[], idIgnorado?: string) {
  if (!nome.trim()) return 'Informe o nome do doador'

  const erroDocumento = validarDocumento(tipo, documento)
  if (erroDocumento) return erroDocumento

  const digitos = normalizarDocumento(documento)
  const duplicado = digitos && doadores.some((doador) => doador.id !== idIgnorado && doador.documento === digitos)
  return duplicado ? 'Já existe um doador com esse documento' : null
}

export function useDoadores() {
  const [doadores, setDoadores] = useState<Doador[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busca, setBusca] = useState('')

  const carregar = useCallback(() => listarDoadores().then(setDoadores), [])
  const { error, setError, salvar } = useSalvarERecarregar(carregar, 'Erro ao salvar o doador')

  useEffect(() => {
    carregar()
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar os doadores'))
      .finally(() => setIsLoading(false))
  }, [carregar, setError])

  // Só chama o service se o formulário passar na validação.
  function salvarSeValido(
    formulario: FormularioDoador,
    idIgnorado: string | undefined,
    alteracao: (dados: Omit<Doador, 'id'>) => Promise<void>,
  ) {
    const erroValidacao = validarDoador(formulario, doadores, idIgnorado)
    if (erroValidacao) {
      setError(erroValidacao)
      return Promise.resolve(false)
    }

    const { nome, tipo, documento } = formulario
    return salvar(() =>
      alteracao({ nome: nome.trim(), tipo, documento: normalizarDocumento(documento) || null }),
    )
  }

  function criar(formulario: FormularioDoador) {
    return salvarSeValido(formulario, undefined, criarDoador)
  }

  function editar(id: string, formulario: FormularioDoador) {
    return salvarSeValido(formulario, id, (dados) => editarDoador(id, dados))
  }

  const termoBusca = semAcentoEmMinusculas(busca.trim())
  const doadoresFiltrados = doadores.filter((doador) => semAcentoEmMinusculas(doador.nome).includes(termoBusca))

  return { doadores: doadoresFiltrados, isLoading, error, busca, setBusca, criar, editar }
}
