export type TipoDoador = 'pessoa_fisica' | 'empresa'

export type Doador = {
  id: string
  nome: string
  // Só dígitos (CPF ou CNPJ); null quando o doador não se identificou.
  documento: string | null
  tipo: TipoDoador
}
