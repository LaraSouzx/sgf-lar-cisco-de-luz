import { supabase } from '../lib/supabaseClient'
import type {
  EdicaoLancamento,
  Lancamento,
  NovoLancamento,
  TipoLancamento,
} from '../types/lancamento'

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

export async function listLancamentos(filtro: {
  dataInicio?: string
  dataFim?: string
  tipo?: TipoLancamento
  doadorId?: string
  // Pendências de prestação de contas: não cancelados e sem comprovante.
  semComprovante?: boolean
}) {
  let query = supabase
    .from('lancamentos')
    .select(
      'id, data, valor, tipo, categoria_id, categorias(nome), usuario_id, doador_id, doadores(nome), descricao, comprovante_url, cancelado',
    )

  if (filtro.tipo) {
    query = query.eq('tipo', filtro.tipo)
  }
  if (filtro.doadorId) {
    query = query.eq('doador_id', filtro.doadorId)
  }
  if (filtro.semComprovante) {
    query = query.eq('cancelado', false).is('comprovante_url', null)
  }
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

// Nomes do domínio (camelCase) para as colunas do banco (snake_case).
function paraColunas<Campos extends EdicaoLancamento>({
  categoriaId,
  doadorId,
  comprovanteUrl,
  ...demaisCampos
}: Campos) {
  return { ...demaisCampos, categoria_id: categoriaId, doador_id: doadorId, comprovante_url: comprovanteUrl }
}

// usuario_id não é enviado: o banco preenche com auth.uid(), então ninguém lança em nome de outra pessoa.
export async function criarLancamento(lancamento: NovoLancamento) {
  const { error } = await supabase.from('lancamentos').insert(paraColunas(lancamento))

  if (error) {
    throw new Error('Não foi possível salvar o lançamento')
  }
}

export async function editarLancamento(id: string, lancamento: EdicaoLancamento) {
  const { error } = await supabase.from('lancamentos').update(paraColunas(lancamento)).eq('id', id)

  if (error) {
    throw new Error('Não foi possível salvar o lançamento')
  }
}

// Lançamento nunca é excluído (histórico da prestação de contas): por isso não existe função de exclusão.
export async function cancelarLancamento(id: string) {
  const { error } = await supabase.from('lancamentos').update({ cancelado: true }).eq('id', id)

  if (error) {
    throw new Error('Não foi possível cancelar o lançamento')
  }
}
