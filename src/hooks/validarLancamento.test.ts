import { describe, expect, it } from 'vitest'
import type { Categoria } from '../types/categoria'
import {
  categoriasDisponiveis,
  validarLancamento,
  type FormularioLancamento,
} from './validarLancamento'

const HOJE = '2026-09-23'

const luz: Categoria = { id: 'c1', nome: 'Luz', tipo: 'saida', ativa: true }
const doacao: Categoria = { id: 'c2', nome: 'Doação', tipo: 'entrada', ativa: true }
const antiga: Categoria = { id: 'c3', nome: 'Antiga', tipo: 'saida', ativa: false }
const categorias = [luz, doacao, antiga]

function formulario(overrides: Partial<FormularioLancamento> = {}): FormularioLancamento {
  return {
    data: '2026-09-20',
    valor: '150,50',
    tipo: 'saida',
    categoriaId: 'c1',
    descricao: '  Conta de luz  ',
    doadorId: null,
    // O valor padrão (150,50) exige comprovante; o formulário-base já vem com um anexado.
    arquivo: null,
    comprovanteAtual: 'existente.pdf',
    ...overrides,
  }
}

function arquivo(tipo: string, tamanho = 1000) {
  const anexo = new File(['x'], 'comprovante', { type: tipo })
  Object.defineProperty(anexo, 'size', { value: tamanho })
  return anexo
}

describe('validarLancamento', () => {
  it('devolve o lançamento pronto para salvar: valor numérico e descrição sem espaços nas pontas', () => {
    expect(validarLancamento(formulario(), categorias, HOJE)).toEqual({
      lancamento: {
        data: '2026-09-20',
        valor: 150.5,
        tipo: 'saida',
        categoriaId: 'c1',
        descricao: 'Conta de luz',
        doadorId: null,
        comprovanteUrl: 'existente.pdf',
      },
      arquivo: null,
    })
  })

  it('aceita doador em uma entrada', () => {
    const resultado = validarLancamento(
      formulario({ tipo: 'entrada', categoriaId: 'c2', doadorId: 'd1' }),
      categorias,
      HOJE,
    )

    expect(resultado).toMatchObject({ lancamento: { doadorId: 'd1' } })
  })

  it('recusa doador em uma saída', () => {
    expect(validarLancamento(formulario({ tipo: 'saida', doadorId: 'd1' }), categorias, HOJE)).toEqual({
      erro: 'Só entradas podem ter doador',
    })
  })

  it.each([
    ['1.234,56', 1234.56],
    ['1234,56', 1234.56],
    ['150', 150],
    ['0,5', 0.5],
  ])('aceita o valor "%s" no formato brasileiro', (valor, esperado) => {
    expect(validarLancamento(formulario({ valor }), categorias, HOJE)).toMatchObject({
      lancamento: { valor: esperado },
    })
  })

  // "10.5" seria lido como 105 se o ponto fosse ignorado: preferimos recusar a gravar valor errado.
  it.each(['', 'abc', '10.5', '1,234,5', '12,345'])('recusa o valor "%s" como inválido', (valor) => {
    expect(validarLancamento(formulario({ valor }), categorias, HOJE)).toEqual({
      erro: 'Informe um valor válido, ex: 1.234,56',
    })
  })

  it('recusa valor zero', () => {
    expect(validarLancamento(formulario({ valor: '0' }), categorias, HOJE)).toEqual({
      erro: 'O valor deve ser maior que zero',
    })
  })

  it('recusa data vazia e data futura, mas aceita hoje', () => {
    expect(validarLancamento(formulario({ data: '' }), categorias, HOJE)).toEqual({
      erro: 'Informe a data',
    })
    expect(validarLancamento(formulario({ data: '2026-09-24' }), categorias, HOJE)).toEqual({
      erro: 'A data não pode ser futura',
    })
    expect(validarLancamento(formulario({ data: HOJE }), categorias, HOJE)).toHaveProperty('lancamento')
  })

  it('recusa descrição vazia ou só com espaços', () => {
    expect(validarLancamento(formulario({ descricao: '   ' }), categorias, HOJE)).toEqual({
      erro: 'Informe a descrição',
    })
  })

  it('recusa quando nenhuma categoria foi escolhida', () => {
    expect(validarLancamento(formulario({ categoriaId: '' }), categorias, HOJE)).toEqual({
      erro: 'Escolha uma categoria',
    })
  })

  it('recusa categoria de outro tipo (entrada com categoria de saída e vice-versa)', () => {
    expect(
      validarLancamento(formulario({ tipo: 'entrada', categoriaId: 'c1' }), categorias, HOJE),
    ).toEqual({ erro: 'Escolha uma categoria de entrada' })
    expect(
      validarLancamento(formulario({ tipo: 'saida', categoriaId: 'c2' }), categorias, HOJE),
    ).toEqual({ erro: 'Escolha uma categoria de saída' })
  })

  it('recusa categoria que não existe', () => {
    expect(validarLancamento(formulario({ categoriaId: 'x' }), categorias, HOJE)).toEqual({
      erro: 'Escolha uma categoria de saída',
    })
  })
})

describe('validarLancamento: comprovante', () => {
  const semComprovante = { arquivo: null, comprovanteAtual: null }

  it('aceita lançamento abaixo do valor mínimo sem comprovante', () => {
    const resultado = validarLancamento(formulario({ ...semComprovante, valor: '49,99' }), categorias, HOJE)

    expect(resultado).toMatchObject({ lancamento: { valor: 49.99, comprovanteUrl: null } })
  })

  it.each(['50', '50,00', '1.200,00'])('exige comprovante a partir do valor mínimo (%s)', (valor) => {
    const resultado = validarLancamento(formulario({ ...semComprovante, valor }), categorias, HOJE)

    expect(resultado).toEqual({ erro: expect.stringMatching(/^Anexe o comprovante/) })
  })

  it('exige comprovante também em entradas', () => {
    const resultado = validarLancamento(
      formulario({ ...semComprovante, tipo: 'entrada', categoriaId: 'c2', valor: '100' }),
      categorias,
      HOJE,
    )

    expect(resultado).toEqual({ erro: expect.stringMatching(/^Anexe o comprovante/) })
  })

  it('aceita o valor alto quando há um arquivo novo, devolvendo o arquivo para ser enviado', () => {
    const anexo = arquivo('application/pdf')

    const resultado = validarLancamento(formulario({ arquivo: anexo, comprovanteAtual: null }), categorias, HOJE)

    expect(resultado).toMatchObject({ lancamento: { comprovanteUrl: null }, arquivo: anexo })
  })

  it('aceita o valor alto quando o lançamento já tinha comprovante (edição)', () => {
    const resultado = validarLancamento(
      formulario({ arquivo: null, comprovanteAtual: 'antigo.pdf' }),
      categorias,
      HOJE,
    )

    expect(resultado).toMatchObject({ lancamento: { comprovanteUrl: 'antigo.pdf' }, arquivo: null })
  })

  it.each(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])('aceita arquivo do tipo %s', (tipo) => {
    expect(validarLancamento(formulario({ arquivo: arquivo(tipo) }), categorias, HOJE)).toHaveProperty('lancamento')
  })

  it.each(['text/plain', 'application/zip', 'image/gif', ''])('recusa arquivo do tipo "%s"', (tipo) => {
    expect(validarLancamento(formulario({ arquivo: arquivo(tipo) }), categorias, HOJE)).toEqual({
      erro: 'O comprovante deve ser uma foto (JPG, PNG ou WebP) ou um PDF',
    })
  })

  it('recusa arquivo maior que 5 MB, mas aceita exatamente 5 MB', () => {
    const cincoMb = 5 * 1024 * 1024

    expect(validarLancamento(formulario({ arquivo: arquivo('image/png', cincoMb + 1) }), categorias, HOJE)).toEqual({
      erro: 'O comprovante pode ter no máximo 5 MB',
    })
    expect(validarLancamento(formulario({ arquivo: arquivo('image/png', cincoMb) }), categorias, HOJE)).toHaveProperty(
      'lancamento',
    )
  })

  it('recusa arquivo inválido mesmo quando o valor não exigiria comprovante', () => {
    const resultado = validarLancamento(
      formulario({ valor: '10', arquivo: arquivo('text/plain'), comprovanteAtual: null }),
      categorias,
      HOJE,
    )

    expect(resultado).toEqual({ erro: 'O comprovante deve ser uma foto (JPG, PNG ou WebP) ou um PDF' })
  })
})

describe('categoriasDisponiveis', () => {
  it('lista só categorias ativas do tipo do lançamento', () => {
    expect(categoriasDisponiveis(categorias, 'saida')).toEqual([luz])
    expect(categoriasDisponiveis(categorias, 'entrada')).toEqual([doacao])
  })

  it('mantém a categoria atual de um lançamento antigo mesmo que ela tenha sido desativada', () => {
    expect(categoriasDisponiveis(categorias, 'saida', 'c3')).toEqual([luz, antiga])
  })
})
