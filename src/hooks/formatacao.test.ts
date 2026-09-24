import { describe, expect, it } from 'vitest'
import { formatarData, formatarValorEmReais, formatarValorParaPlanilha } from './formatacao'

describe('formatação', () => {
  it('formata a data como dd/mm/aaaa sem deslocar o dia por fuso horário', () => {
    expect(formatarData('2026-09-05')).toBe('05/09/2026')
  })

  it('formata valores em reais no padrão brasileiro', () => {
    // O espaço depois de "R$" é um espaço não separável; normalizo para comparar.
    expect(formatarValorEmReais(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50')
  })

  it('formata valores para planilha: vírgula decimal, sem separador de milhar', () => {
    expect(formatarValorParaPlanilha(1234.5)).toBe('1234,50')
    expect(formatarValorParaPlanilha(-100)).toBe('-100,00')
  })
})
