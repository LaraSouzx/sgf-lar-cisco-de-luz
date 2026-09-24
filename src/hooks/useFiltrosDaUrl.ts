import { useSearchParams } from 'react-router-dom'

// Filtros ficam na URL (ex: /lancamentos?tipo=entrada&mes=2026-09) para poderem ser linkados de outras telas.
export function useFiltrosDaUrl() {
  const [parametros, setParametros] = useSearchParams()

  // Valor vazio remove o filtro da URL.
  function atualizarFiltro(chave: string, valor: string) {
    const proximos = new URLSearchParams(parametros)
    if (valor) proximos.set(chave, valor)
    else proximos.delete(chave)
    setParametros(proximos)
  }

  return { parametros, atualizarFiltro }
}
