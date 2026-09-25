import { supabase } from '../lib/supabaseClient'
import type { Doador } from '../types/doador'

type DadosDoador = Omit<Doador, 'id'>

const CODIGO_VIOLACAO_UNICIDADE = '23505'
const CODIGO_VIOLACAO_CHAVE_ESTRANGEIRA = '23503'

// Nunca repassa o erro do banco para a tela: ele pode carregar o CPF/CNPJ do doador.
function erroAoSalvar(error: { code?: string }) {
  if (error.code === CODIGO_VIOLACAO_UNICIDADE) {
    return new Error('Já existe um doador com esse documento')
  }
  return new Error('Não foi possível salvar o doador')
}

export async function listarDoadores() {
  const { data, error } = await supabase
    .from('doadores')
    .select('id, nome, documento, tipo')
    .order('nome')

  if (error) {
    throw new Error('Não foi possível carregar os doadores')
  }

  return (data ?? []) as Doador[]
}

export async function criarDoador(doador: DadosDoador) {
  const { error } = await supabase.from('doadores').insert(doador)

  if (error) {
    throw erroAoSalvar(error)
  }
}

export async function editarDoador(id: string, doador: DadosDoador) {
  const { error } = await supabase.from('doadores').update(doador).eq('id', id)

  if (error) {
    throw erroAoSalvar(error)
  }
}

// Doador com lançamentos ligados nunca some (rastreabilidade da prestação de contas): a chave estrangeira
// do banco recusa a exclusão nesse caso, e aqui o erro vira uma orientação em vez de um erro técnico.
export async function excluirDoador(id: string) {
  const { error } = await supabase.from('doadores').delete().eq('id', id)

  if (error?.code === CODIGO_VIOLACAO_CHAVE_ESTRANGEIRA) {
    throw new Error('Não é possível excluir: já há lançamentos ligados a este doador.')
  }
  if (error) {
    throw new Error('Não foi possível excluir o doador')
  }
}
