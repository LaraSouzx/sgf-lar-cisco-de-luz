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

export type NovoLancamento = Pick<Lancamento, 'data' | 'valor' | 'tipo' | 'categoriaId' | 'descricao'>

// O tipo não muda depois de criado: a categoria escolhida só vale para um tipo.
export type EdicaoLancamento = Omit<NovoLancamento, 'tipo'>
