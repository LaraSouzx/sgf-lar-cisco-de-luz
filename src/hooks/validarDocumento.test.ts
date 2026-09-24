import { describe, expect, it } from 'vitest'
import {
  formatarDocumento,
  mascararDocumento,
  normalizarDocumento,
  validarDocumento,
} from './validarDocumento'

// Documentos de exemplo amplamente usados em testes; nenhum pertence a uma pessoa real.
const CPF_VALIDO = '529.982.247-25'
const CNPJ_VALIDO = '11.222.333/0001-81'

describe('normalizarDocumento', () => {
  it('mantém só os dígitos', () => {
    expect(normalizarDocumento(CPF_VALIDO)).toBe('52998224725')
    expect(normalizarDocumento(' 11.222.333/0001-81 ')).toBe('11222333000181')
  })
})

describe('validarDocumento', () => {
  it('aceita documento vazio, pois o documento é opcional', () => {
    expect(validarDocumento('pessoa_fisica', '')).toBeNull()
    expect(validarDocumento('empresa', '   ')).toBeNull()
  })

  it('aceita CPF válido para pessoa física, com ou sem pontuação', () => {
    expect(validarDocumento('pessoa_fisica', CPF_VALIDO)).toBeNull()
    expect(validarDocumento('pessoa_fisica', '52998224725')).toBeNull()
  })

  it('aceita CNPJ válido para empresa, com ou sem pontuação', () => {
    expect(validarDocumento('empresa', CNPJ_VALIDO)).toBeNull()
    expect(validarDocumento('empresa', '11222333000181')).toBeNull()
  })

  it.each([
    ['dígito verificador errado', '529.982.247-26'],
    ['tamanho errado', '529.982.247'],
    ['sequência repetida', '111.111.111-11'],
    ['letras', 'abc.def.ghi-jk'],
  ])('recusa CPF inválido (%s)', (_motivo, documento) => {
    expect(validarDocumento('pessoa_fisica', documento)).toBe('CPF inválido')
  })

  it.each([
    ['dígito verificador errado', '11.222.333/0001-82'],
    ['tamanho errado', '11.222.333/0001'],
    ['sequência repetida', '11.111.111/1111-11'],
  ])('recusa CNPJ inválido (%s)', (_motivo, documento) => {
    expect(validarDocumento('empresa', documento)).toBe('CNPJ inválido')
  })

  it('recusa CNPJ para pessoa física e CPF para empresa', () => {
    expect(validarDocumento('pessoa_fisica', CNPJ_VALIDO)).toBe('CPF inválido')
    expect(validarDocumento('empresa', CPF_VALIDO)).toBe('CNPJ inválido')
  })
})

describe('formatarDocumento', () => {
  it('aplica a máscara de CPF e de CNPJ', () => {
    expect(formatarDocumento('52998224725')).toBe(CPF_VALIDO)
    expect(formatarDocumento('11222333000181')).toBe(CNPJ_VALIDO)
  })

  it('devolve o texto como está quando não tem 11 nem 14 dígitos', () => {
    expect(formatarDocumento('123')).toBe('123')
  })
})

describe('mascararDocumento', () => {
  it('esconde os dígitos das pontas, mostrando só o miolo', () => {
    expect(mascararDocumento('52998224725')).toBe('***.982.247-**')
    expect(mascararDocumento('11222333000181')).toBe('**.222.333/0001-**')
  })

  it('devolve texto vazio quando não há documento', () => {
    expect(mascararDocumento('')).toBe('')
  })
})
