// Regras dos comprovantes num só lugar. Tipos e tamanho também estão no bucket
// (supabase/migrations/0003_comprovantes_storage.sql): mantenha os dois em sincronia.

// Padrão até a OSC confirmar o valor (pendência do CONTEXT.md). Lançamentos a partir dele exigem comprovante.
export const VALOR_MINIMO_COMPROVANTE = 50

export const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024

// A extensão do arquivo guardado vem do tipo, nunca do nome original (que pode ter dados pessoais).
export const EXTENSAO_POR_TIPO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

export const TIPOS_ACEITOS = Object.keys(EXTENSAO_POR_TIPO)
