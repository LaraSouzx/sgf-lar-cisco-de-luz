import { supabase } from '../lib/supabaseClient'
import type { Categoria } from '../types/categoria'

const CODIGO_VIOLACAO_UNICIDADE = '23505'

// Nunca repassa o erro técnico do banco para a tela; só o caso de nome repetido tem mensagem própria.
function erroAoSalvar(error: { code?: string }) {
  if (error.code === CODIGO_VIOLACAO_UNICIDADE) {
    return new Error('Já existe uma categoria com esse nome')
  }
  return new Error('Não foi possível salvar a categoria')
}

export async function listarCategorias() {
  const { data, error } = await supabase
    .from('categorias')
    .select('id, nome, tipo, ativa')
    .order('nome')

  if (error) {
    throw new Error('Não foi possível carregar as categorias')
  }

  return (data ?? []) as Categoria[]
}

export async function criarCategoria(categoria: Pick<Categoria, 'nome' | 'tipo'>) {
  const { error } = await supabase.from('categorias').insert(categoria)

  if (error) {
    throw erroAoSalvar(error)
  }
}

async function atualizarCategoria(id: string, campos: Partial<Pick<Categoria, 'nome' | 'ativa'>>) {
  const { error } = await supabase.from('categorias').update(campos).eq('id', id)

  if (error) {
    throw erroAoSalvar(error)
  }
}

export function editarCategoria(id: string, campos: Pick<Categoria, 'nome'>) {
  return atualizarCategoria(id, campos)
}

// Categoria com lançamentos vinculados nunca é excluída (rastreabilidade da prestação de contas):
// por isso não existe função de exclusão neste módulo, só desativação.
export function desativarCategoria(id: string) {
  return atualizarCategoria(id, { ativa: false })
}
