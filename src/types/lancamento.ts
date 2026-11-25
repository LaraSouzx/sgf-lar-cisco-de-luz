export type TipoLancamento = 'entrada' | 'saida'

export type FormaRecebimento = 'dinheiro' | 'pix' | 'transferencia' | 'outro'

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
  // Só entradas têm forma; as lançadas antes do campo existir também ficam sem.
  formaRecebimento: FormaRecebimento | null
  descricao: string
  comprovanteUrl: string | null
  cancelado: boolean
}

export type NovoLancamento = Pick<
  Lancamento,
  'data' | 'valor' | 'tipo' | 'categoriaId' | 'descricao' | 'doadorId' | 'formaRecebimento' | 'comprovanteUrl'
>

// O tipo não muda depois de criado: a categoria escolhida só vale para um tipo.
export type EdicaoLancamento = Omit<NovoLancamento, 'tipo'>
