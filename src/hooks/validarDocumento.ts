import type { TipoDoador } from '../types/doador'

type RegraDocumento = { rotulo: string; valido: (digitos: string) => boolean }

const PESOS_CPF = [
  [10, 9, 8, 7, 6, 5, 4, 3, 2],
  [11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
]
const PESOS_CNPJ = [
  [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
  [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
]

function digitoVerificador(numeros: number[], pesos: number[]) {
  const soma = pesos.reduce((total, peso, posicao) => total + numeros[posicao] * peso, 0)
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

// CPF e CNPJ usam o mesmo cálculo (módulo 11); só mudam o tamanho e os pesos.
function documentoValido(digitos: string, tamanho: number, [pesos1, pesos2]: number[][]) {
  // Sequências repetidas (ex: 111.111.111-11) passam no cálculo, mas não são documentos reais.
  if (digitos.length !== tamanho || /^(\d)\1+$/.test(digitos)) return false

  const numeros = digitos.split('').map(Number)
  return (
    numeros[pesos1.length] === digitoVerificador(numeros, pesos1) &&
    numeros[pesos2.length] === digitoVerificador(numeros, pesos2)
  )
}

// Regra por tipo de doador (Strategy): pessoa física usa CPF, empresa usa CNPJ.
const REGRA_POR_TIPO: Record<TipoDoador, RegraDocumento> = {
  pessoa_fisica: { rotulo: 'CPF', valido: (digitos) => documentoValido(digitos, 11, PESOS_CPF) },
  empresa: { rotulo: 'CNPJ', valido: (digitos) => documentoValido(digitos, 14, PESOS_CNPJ) },
}

const SO_DIGITOS_E_PONTUACAO = /^[\d.\-/\s]+$/

export function normalizarDocumento(documento: string) {
  return documento.replace(/\D/g, '')
}

// Documento é opcional: vazio é válido; preenchido precisa ser válido para o tipo do doador.
export function validarDocumento(tipo: TipoDoador, documento: string) {
  if (!documento.trim()) return null

  const { rotulo, valido } = REGRA_POR_TIPO[tipo]
  const formatoAceito = SO_DIGITOS_E_PONTUACAO.test(documento)
  return formatoAceito && valido(normalizarDocumento(documento)) ? null : `${rotulo} inválido`
}

export function formatarDocumento(documento: string) {
  return documento
    .replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
    .replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

// Na lista só o miolo aparece, para o documento completo não ficar exposto na tela toda vez.
export function mascararDocumento(documento: string) {
  return documento
    .replace(/^\d{3}(\d{3})(\d{3})\d{2}$/, '***.$1.$2-**')
    .replace(/^\d{2}(\d{3})(\d{3})(\d{4})\d{2}$/, '**.$1.$2/$3-**')
    // Dígitos que sobraram sem casar com CPF/CNPJ completo: não exibe nada.
    .replace(/^\d+$/, '')
}
