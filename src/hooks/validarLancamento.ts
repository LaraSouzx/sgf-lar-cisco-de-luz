import type { Categoria } from '../types/categoria'
import type { NovoLancamento, TipoLancamento } from '../types/lancamento'

// Campos como chegam do formulário: o valor ainda é o texto digitado.
export type FormularioLancamento = Omit<NovoLancamento, 'valor'> & { valor: string }

type ResultadoValidacao = { lancamento: NovoLancamento } | { erro: string }

const ROTULO_TIPO: Record<TipoLancamento, string> = { entrada: 'entrada', saida: 'saída' }

// Aceita "1.234,56", "1234,56" e "150". Recusa "10.5" de propósito: ignorar o ponto
// transformaria 10,50 em 105, e é melhor pedir para digitar de novo do que gravar valor errado.
const FORMATO_VALOR_BR = /^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/

function converterValor(texto: string) {
  const valorTexto = texto.trim()
  if (!FORMATO_VALOR_BR.test(valorTexto)) return null
  return Number(valorTexto.replace(/\./g, '').replace(',', '.'))
}

// Data local (não UTC), para não virar "amanhã" no fim da tarde no fuso do Brasil.
export function dataDeHoje() {
  const agora = new Date()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

// Só categorias ativas do tipo do lançamento. A categoria atual de um lançamento antigo continua
// disponível mesmo desativada, senão editar a descrição de um lançamento velho ficaria impossível.
export function categoriasDisponiveis(
  categorias: Categoria[],
  tipo: TipoLancamento,
  categoriaAtualId?: string,
) {
  return categorias.filter(
    (categoria) =>
      categoria.tipo === tipo && (categoria.ativa || categoria.id === categoriaAtualId),
  )
}

export function validarLancamento(
  formulario: FormularioLancamento,
  categorias: Categoria[],
  hoje: string = dataDeHoje(),
): ResultadoValidacao {
  const valor = converterValor(formulario.valor)
  if (valor === null) return { erro: 'Informe um valor válido, ex: 1.234,56' }
  if (valor <= 0) return { erro: 'O valor deve ser maior que zero' }

  if (!formulario.data) return { erro: 'Informe a data' }
  if (formulario.data > hoje) return { erro: 'A data não pode ser futura' }

  const descricao = formulario.descricao.trim()
  if (!descricao) return { erro: 'Informe a descrição' }

  if (!formulario.categoriaId) return { erro: 'Escolha uma categoria' }
  // O banco só garante que a categoria existe; a compatibilidade com o tipo é regra daqui.
  const categoria = categorias.find((item) => item.id === formulario.categoriaId)
  if (categoria?.tipo !== formulario.tipo) {
    return { erro: `Escolha uma categoria de ${ROTULO_TIPO[formulario.tipo]}` }
  }

  return { lancamento: { ...formulario, valor, descricao } }
}
