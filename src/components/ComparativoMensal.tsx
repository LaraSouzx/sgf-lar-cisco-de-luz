import type { CategoriaComparativo, Comparativo } from '../hooks/calcularComparativo'
import { formatarValorEmReais, formatarVariacao } from '../hooks/formatacao'
import { NOMES_DOS_MESES } from '../hooks/periodo'

const classeCartao = 'rounded-[20px] border border-[#e0e7dc] bg-[#fafcf8] p-5'
const classeCelula = 'px-3 py-2 text-right'

// Entrada que sobe é boa e saída que sobe é ruim, então a cor segue o sentido, não só o sinal.
function Variacao({ valor, subirEBom }: { valor: number | null; subirEBom: boolean }) {
  const bom = valor !== null && valor > 0 === subirEBom
  const cor = valor === null || valor === 0 ? 'text-[#8b968a]' : bom ? 'text-[#2f7d34]' : 'text-[#b3261e]'
  return <span className={`ml-1.5 text-xs font-semibold ${cor}`}>{formatarVariacao(valor)}</span>
}

function TabelaTotais({ meses }: { meses: Comparativo['meses'] }) {
  return (
    <section className={classeCartao}>
      <h3 className="m-0 mb-2 text-base font-semibold">Totais mês a mês</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-160 border-collapse text-sm">
          <thead>
            <tr className="border-b border-[#e8ede5] text-[#4f5c4c]">
              <th className="px-3 py-2 text-left font-medium">Mês</th>
              <th className={`${classeCelula} font-medium`}>Entradas</th>
              <th className={`${classeCelula} font-medium`}>Saídas</th>
              <th className={`${classeCelula} font-medium`}>Resultado do mês</th>
              <th className={`${classeCelula} font-medium`}>Saldo final</th>
            </tr>
          </thead>
          <tbody>
            {meses.map((mes) => (
              <tr key={mes.mes} className="border-b border-[#e8ede5] last:border-0">
                <td className="px-3 py-2">
                  {NOMES_DOS_MESES[mes.mes - 1]}
                  {mes.emAndamento && <span className="ml-1.5 text-xs text-[#8a5a00]">em andamento</span>}
                </td>
                <td className={classeCelula}>
                  {formatarValorEmReais(mes.entradas)}
                  <Variacao valor={mes.variacaoEntradas} subirEBom />
                </td>
                <td className={classeCelula}>
                  {formatarValorEmReais(mes.saidas)}
                  <Variacao valor={mes.variacaoSaidas} subirEBom={false} />
                </td>
                <td className={`${classeCelula} font-semibold ${mes.resultado < 0 ? 'text-[#b3261e]' : ''}`}>
                  {formatarValorEmReais(mes.resultado)}
                </td>
                <td className={`${classeCelula} font-semibold ${mes.saldoFinal < 0 ? 'text-[#b3261e]' : ''}`}>
                  {formatarValorEmReais(mes.saldoFinal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// Fechada, cada categoria mostra o total do ano; aberta, os meses em que teve movimento.
function ListaCategorias({ titulo, categorias }: { titulo: string; categorias: CategoriaComparativo[] }) {
  return (
    <section className={classeCartao}>
      <h3 className="m-0 mb-1 text-base font-semibold">{titulo}</h3>
      {categorias.length === 0 ? (
        <p className="text-sm text-[#4f5c4c]">Nenhum lançamento neste ano.</p>
      ) : (
        <>
          {/* Sem esta dica, quem usa não sabe que a categoria abre: o <details> não tem cara de botão. */}
          <p className="m-0 mb-2 text-xs text-[#4f5c4c]">Clique numa categoria para ver o valor de cada mês.</p>
          <ul className="m-0 list-none p-0">
            {categorias.map((categoria) => (
              <li key={categoria.categoriaId} className="border-b border-[#e8ede5] last:border-0">
                <details className="group">
                  <summary className="flex min-h-10 cursor-pointer items-center gap-2 text-sm hover:bg-[#f1f5ee]">
                    <span aria-hidden className="text-xs text-[#4f5c4c] transition-transform group-open:rotate-90">
                      ▶
                    </span>
                    <span className="flex-1">{categoria.categoriaNome}</span>
                    <span className="font-semibold">{formatarValorEmReais(categoria.total)}</span>
                  </summary>
                  <ul className="m-0 mb-2 list-none p-0 pl-6">
                    {categoria.valoresPorMes.map((valor, indice) =>
                      valor > 0 ? (
                        <li key={indice} className="flex justify-between gap-3 py-1 text-sm text-[#4f5c4c]">
                          <span>{NOMES_DOS_MESES[indice]}</span>
                          <span>{formatarValorEmReais(valor)}</span>
                        </li>
                      ) : null,
                    )}
                  </ul>
                </details>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

export function ComparativoMensal({ comparativo }: { comparativo: Comparativo }) {
  if (comparativo.meses.length === 0) {
    return <p className="text-sm text-[#4f5c4c]">Nenhum lançamento neste ano.</p>
  }

  return (
    <>
      <TabelaTotais meses={comparativo.meses} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <ListaCategorias titulo="Entradas por categoria" categorias={comparativo.entradasPorCategoria} />
        <ListaCategorias titulo="Saídas por categoria" categorias={comparativo.saidasPorCategoria} />
      </div>
    </>
  )
}
