import type { TipoLancamento } from './lancamento'

export type Categoria = {
  id: string
  nome: string
  tipo: TipoLancamento
  ativa: boolean
}
