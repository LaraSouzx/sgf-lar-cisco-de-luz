import { describe, expect, it } from 'vitest'
import { intervaloDoPeriodo, periodoDoMesAtual, periodoValido, rotuloDoPeriodo } from './periodo'

describe('intervaloDoPeriodo', () => {
  it('cobre do primeiro ao último dia do mês', () => {
    expect(intervaloDoPeriodo('2026-09')).toEqual({ dataInicio: '2026-09-01', dataFim: '2026-09-30' })
  })

  it('respeita fevereiro comum e bissexto', () => {
    expect(intervaloDoPeriodo('2026-02').dataFim).toBe('2026-02-28')
    expect(intervaloDoPeriodo('2028-02').dataFim).toBe('2028-02-29')
  })

  it('cobre o ano inteiro quando o período é só o ano', () => {
    expect(intervaloDoPeriodo('2026')).toEqual({ dataInicio: '2026-01-01', dataFim: '2026-12-31' })
  })
})

describe('periodoValido', () => {
  it.each(['2026-09', '2026', '1999-12'])('aceita "%s"', (periodo) => {
    expect(periodoValido(periodo)).toBe(true)
  })

  it.each(['', '2026-13', '2026-00', '26-09', '2026-9', 'abc', '2026-09-01'])('recusa "%s"', (periodo) => {
    expect(periodoValido(periodo)).toBe(false)
  })
})

describe('rotuloDoPeriodo', () => {
  it('mostra mês/ano ou só o ano', () => {
    expect(rotuloDoPeriodo('2026-09')).toBe('09/2026')
    expect(rotuloDoPeriodo('2026')).toBe('2026')
  })
})

describe('periodoDoMesAtual', () => {
  it('devolve o mês da data informada no formato aaaa-mm', () => {
    expect(periodoDoMesAtual(new Date(2026, 8, 23))).toBe('2026-09')
    expect(periodoDoMesAtual(new Date(2026, 0, 5))).toBe('2026-01')
  })
})
