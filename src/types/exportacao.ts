// Informações que acompanham qualquer arquivo exportado (CSV, PDF), para ninguém confundir versões.
export type ContextoExportacao = {
  // Data de geração no formato aaaa-mm-dd.
  geradoEm: string
  usuario: string
}
