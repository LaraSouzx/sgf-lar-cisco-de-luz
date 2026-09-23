import { supabase } from '../lib/supabaseClient'
import type { Lancamento } from '../types/lancamento'

type LancamentoRow = {
  id: string
  data: string
  valor: number
  tipo: 'entrada' | 'saida'
  categoria_id: string
  categorias: { nome: string } | null
  usuario_id: string
  doador_id: string | null
  doadores: { nome: string } | null
  descricao: string
  comprovante_url: string | null
  cancelado: boolean
}

function mapLancamento(row: LancamentoRow): Lancamento {
  return {
    id: row.id,
    data: row.data,
    valor: row.valor,
    tipo: row.tipo,
    categoriaId: row.categoria_id,
    categoriaNome: row.categorias?.nome ?? '',
    usuarioId: row.usuario_id,
    doadorId: row.doador_id,
    doadorNome: row.doadores?.nome ?? null,
    descricao: row.descricao,
    comprovanteUrl: row.comprovante_url,
    cancelado: row.cancelado,
  }
}

export async function listLancamentos(filtro: { dataInicio?: string; dataFim?: string }) {
  let query = supabase
    .from('lancamentos')
    .select(
      'id, data, valor, tipo, categoria_id, categorias(nome), usuario_id, doador_id, doadores(nome), descricao, comprovante_url, cancelado',
    )

  if (filtro.dataInicio) {
    query = query.gte('data', filtro.dataInicio)
  }
  if (filtro.dataFim) {
    query = query.lte('data', filtro.dataFim)
  }

  const { data, error } = await query.order('data', { ascending: false })

  if (error) {
    throw new Error('Não foi possível carregar os lançamentos')
  }

  return (data ?? []).map((row) => mapLancamento(row as unknown as LancamentoRow))
}
