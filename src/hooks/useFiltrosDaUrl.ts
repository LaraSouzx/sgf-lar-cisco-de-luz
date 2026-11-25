import { useSearchParams } from 'react-router-dom'

// Filtros ficam na URL (ex: /lancamentos?tipo=entrada&mes=2026-09) para poderem ser linkados de outras telas.
export function useFiltrosDaUrl() {
  const [parametros, setParametros] = useSearchParams()

  // Valor vazio remove o filtro da URL. Vários de uma vez, porque duas chamadas seguidas
  // partiriam dos mesmos parâmetros e a segunda desfaria a primeira.
  function atualizarFiltros(alteracoes: Record<string, string>) {
    const proximos = new URLSearchParams(parametros)
    for (const [chave, valor] of Object.entries(alteracoes)) {
      if (valor) proximos.set(chave, valor)
      else proximos.delete(chave)
    }
    setParametros(proximos)
  }

  const atualizarFiltro = (chave: string, valor: string) => atualizarFiltros({ [chave]: valor })

  return { parametros, atualizarFiltro, atualizarFiltros }
}
