import { useCallback, useEffect, useState } from 'react'
import {
  criarCategoria,
  desativarCategoria,
  editarCategoria,
  listarCategorias,
  reativarCategoria,
} from '../services/categoriaService'
import type { Categoria } from '../types/categoria'
import { useSalvarERecarregar } from './useSalvarERecarregar'

// Feedback imediato no formulário; a constraint UNIQUE no banco continua sendo a garantia real.
// `idIgnorado` evita acusar duplicidade da categoria com ela mesma ao editar.
function validarNome(nome: string, categorias: Categoria[], idIgnorado?: string) {
  if (!nome) return 'Informe o nome da categoria'

  const jaExiste = categorias.some(
    (categoria) => categoria.id !== idIgnorado && categoria.nome.toLowerCase() === nome.toLowerCase(),
  )
  return jaExiste ? 'Já existe uma categoria com esse nome' : null
}

export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const carregar = useCallback(() => listarCategorias().then(setCategorias), [])
  const { error, setError, salvar } = useSalvarERecarregar(carregar, 'Erro ao salvar a categoria')

  useEffect(() => {
    carregar()
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar as categorias'))
      .finally(() => setIsLoading(false))
  }, [carregar, setError])

  // Só chama o service se o nome passar na validação do formulário.
  function salvarComNomeValido(nome: string, idIgnorado: string | undefined, alteracao: (nomeLimpo: string) => Promise<void>) {
    const nomeLimpo = nome.trim()
    const erroValidacao = validarNome(nomeLimpo, categorias, idIgnorado)
    if (erroValidacao) {
      setError(erroValidacao)
      return Promise.resolve(false)
    }

    return salvar(() => alteracao(nomeLimpo))
  }

  function criar(nome: string, tipo: Categoria['tipo']) {
    return salvarComNomeValido(nome, undefined, (nomeLimpo) => criarCategoria({ nome: nomeLimpo, tipo }))
  }

  function editar(id: string, nome: string) {
    return salvarComNomeValido(nome, id, (nomeLimpo) => editarCategoria(id, { nome: nomeLimpo }))
  }

  function desativar(id: string) {
    return salvar(() => desativarCategoria(id))
  }

  function reativar(id: string) {
    return salvar(() => reativarCategoria(id))
  }

  return { categorias, isLoading, error, criar, editar, desativar, reativar }
}
