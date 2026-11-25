import type { FormaRecebimento } from '../types/lancamento'

export const ROTULO_FORMA_RECEBIMENTO: Record<FormaRecebimento, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  transferencia: 'Transferência',
  outro: 'Outro',
}

export const FORMAS_DE_RECEBIMENTO = Object.keys(ROTULO_FORMA_RECEBIMENTO) as FormaRecebimento[]
