import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { Comparativo } from '../hooks/calcularComparativo'
import { ComparativoMensal } from './ComparativoMensal'

const comparativo: Comparativo = {
  ano: '2026',
  meses: [
    { mes: 1, entradas: 1000, saidas: 400, resultado: 600, saldoFinal: 600, variacaoEntradas: null, variacaoSaidas: null, emAndamento: false },
    { mes: 2, entradas: 1500, saidas: 200, resultado: 1300, saldoFinal: 1900, variacaoEntradas: 50, variacaoSaidas: -50, emAndamento: true },
  ],
  entradasPorCategoria: [{ categoriaId: 'c1', categoriaNome: 'Doação', total: 2500, valoresPorMes: [1000, 1500] }],
  saidasPorCategoria: [{ categoriaId: 'c2', categoriaNome: 'Luz', total: 600, valoresPorMes: [400, 200] }],
}

describe('ComparativoMensal', () => {
  it('mostra os meses com variação contra o mês anterior e marca o mês em andamento', () => {
    render(<ComparativoMensal comparativo={comparativo} />)

    const fevereiro = screen.getByRole('row', { name: /Fevereiro/ })
    expect(within(fevereiro).getByText('em andamento')).toBeInTheDocument()
    expect(within(fevereiro).getByText('+50,0%')).toBeInTheDocument()
    expect(within(fevereiro).getByText('-50,0%')).toBeInTheDocument()
    // Janeiro não tem mês anterior: variação em branco ("—").
    expect(within(screen.getByRole('row', { name: /Janeiro/ })).getAllByText('—')).toHaveLength(2)
  })

  it('mostra o saldo final de cada mês', () => {
    render(<ComparativoMensal comparativo={comparativo} />)

    expect(within(screen.getByRole('row', { name: /Fevereiro/ })).getByText(/1\.900,00/)).toBeInTheDocument()
  })

  it('lista cada categoria fechada, com o total do ano, e abre os meses ao clicar', async () => {
    const usuario = userEvent.setup()
    render(<ComparativoMensal comparativo={comparativo} />)

    const resumo = screen.getByText('Doação').closest('summary') as HTMLElement
    expect(within(resumo).getByText(/2\.500,00/)).toBeInTheDocument()
    expect(screen.getByText('Doação').closest('details')).not.toHaveAttribute('open')

    await usuario.click(resumo)

    const detalhes = screen.getByText('Doação').closest('details') as HTMLElement
    expect(detalhes).toHaveAttribute('open')
    expect(within(detalhes).getByText('Janeiro')).toBeInTheDocument()
    expect(within(detalhes).getByText('Fevereiro')).toBeInTheDocument()
  })

  it('avisa quando o ano não tem meses para mostrar', () => {
    render(<ComparativoMensal comparativo={{ ...comparativo, meses: [] }} />)

    expect(screen.getByText('Nenhum lançamento neste ano.')).toBeInTheDocument()
  })
})
