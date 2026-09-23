export type TipoLancamento = 'entrada' | 'saida'

export type Lancamento = {
  id: string
  data: string
  valor: number
  tipo: TipoLancamento
  categoriaId: string
  categoriaNome: string
  usuarioId: string
  doadorId: string | null
  doadorNome: string | null
  descricao: string
  comprovanteUrl: string | null
  cancelado: boolean
}
