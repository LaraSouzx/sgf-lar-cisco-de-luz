import { supabase } from '../lib/supabaseClient'
import { EXTENSAO_POR_TIPO } from '../lib/regrasDeComprovante'

const BUCKET = 'comprovantes'
// O link só precisa durar o tempo de abrir a aba; um link copiado deixa de funcionar logo em seguida.
const VALIDADE_DO_LINK_EM_SEGUNDOS = 60

// Devolve o caminho guardado no lançamento. O nome é aleatório: nunca reaproveita o nome original
// (pode ter dado pessoal) e nunca sobrescreve outro comprovante.
export async function enviarComprovante(arquivo: File) {
  const caminho = `${crypto.randomUUID()}.${EXTENSAO_POR_TIPO[arquivo.type]}`
  const { error } = await supabase.storage.from(BUCKET).upload(caminho, arquivo, { contentType: arquivo.type })

  if (error) {
    throw new Error('Não foi possível enviar o comprovante')
  }

  return caminho
}

// O bucket é privado: não existe endereço fixo do arquivo, só links temporários.
export async function gerarLinkComprovante(caminho: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(caminho, VALIDADE_DO_LINK_EM_SEGUNDOS)

  if (error || !data) {
    throw new Error('Não foi possível abrir o comprovante')
  }

  return data.signedUrl
}
