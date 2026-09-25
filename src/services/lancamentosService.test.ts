import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cancelarLancamento,
  criarLancamento,
  editarLancamento,
  excluirLancamento,
  listLancamentos,
} from './lancamentosService'

const { order, lte, gte, eq, is, select, insert, update, updateEq, excluirSelect, excluirMatch, excluir, from } =
  vi.hoisted(() => {
  const order = vi.fn()
  // Os filtros da listagem são opcionais e encadeáveis em qualquer combinação.
  const consulta: Record<string, unknown> = { order }
  const gte = vi.fn(() => consulta)
  const lte = vi.fn(() => consulta)
  const eq = vi.fn(() => consulta)
  const is = vi.fn(() => consulta)
  Object.assign(consulta, { gte, lte, eq, is })

  const select = vi.fn(() => consulta)
  const insert = vi.fn()
  const updateEq = vi.fn()
  const update = vi.fn(() => ({ eq: updateEq }))
  const excluirSelect = vi.fn()
  const excluirMatch = vi.fn(() => ({ select: excluirSelect }))
  const excluir = vi.fn(() => ({ match: excluirMatch }))
  const from = vi.fn((_table: string) => ({ select, insert, update, delete: excluir }))
  return { order, lte, gte, eq, is, select, insert, update, updateEq, excluirSelect, excluirMatch, excluir, from }
  })

vi.mock('../lib/supabaseClient', () => ({
  supabase: { from },
}))

describe('lancamentosService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listLancamentos', () => {
    it('busca na tabela lancamentos com os relacionamentos de categoria e doador', async () => {
      order.mockResolvedValue({ data: [], error: null })

      await listLancamentos({})

      expect(from).toHaveBeenCalledWith('lancamentos')
      expect(select).toHaveBeenCalledWith(
        expect.stringContaining('categorias'),
      )
    })

    it('filtra por período quando dataInicio e dataFim são informados', async () => {
      order.mockResolvedValue({ data: [], error: null })

      await listLancamentos({ dataInicio: '2026-09-01', dataFim: '2026-09-30' })

      expect(gte).toHaveBeenCalledWith('data', '2026-09-01')
      expect(lte).toHaveBeenCalledWith('data', '2026-09-30')
    })

    it('filtra por tipo quando informado e não filtra quando ausente', async () => {
      order.mockResolvedValue({ data: [], error: null })

      await listLancamentos({ tipo: 'entrada' })
      expect(eq).toHaveBeenCalledWith('tipo', 'entrada')

      eq.mockClear()
      await listLancamentos({})
      expect(eq).not.toHaveBeenCalled()
    })

    it('lista só os não cancelados e sem comprovante quando semComprovante é pedido', async () => {
      order.mockResolvedValue({ data: [], error: null })

      await listLancamentos({ semComprovante: true })

      // Mesma regra do card "Prestação de contas": cancelado não conta como pendência.
      expect(eq).toHaveBeenCalledWith('cancelado', false)
      expect(is).toHaveBeenCalledWith('comprovante_url', null)
    })

    it('não filtra por comprovante quando semComprovante não é pedido', async () => {
      order.mockResolvedValue({ data: [], error: null })

      await listLancamentos({})

      expect(is).not.toHaveBeenCalled()
    })

    it('filtra pelo doador quando informado', async () => {
      order.mockResolvedValue({ data: [], error: null })

      await listLancamentos({ doadorId: 'd1' })

      expect(eq).toHaveBeenCalledWith('doador_id', 'd1')
    })

    it('converte as linhas do banco para o formato do domínio', async () => {
      order.mockResolvedValue({
        data: [
          {
            id: 'l1',
            data: '2026-09-20',
            valor: 150,
            tipo: 'entrada',
            categoria_id: 'c1',
            categorias: { nome: 'Doações' },
            usuario_id: 'u1',
            doador_id: 'd1',
            doadores: { nome: 'Maria' },
            descricao: 'Doação mensal',
            comprovante_url: null,
            cancelado: false,
          },
        ],
        error: null,
      })

      const result = await listLancamentos({})

      expect(result).toEqual([
        {
          id: 'l1',
          data: '2026-09-20',
          valor: 150,
          tipo: 'entrada',
          categoriaId: 'c1',
          categoriaNome: 'Doações',
          usuarioId: 'u1',
          doadorId: 'd1',
          doadorNome: 'Maria',
          descricao: 'Doação mensal',
          comprovanteUrl: null,
          cancelado: false,
        },
      ])
    })

    it('lança mensagem genérica quando o Supabase retorna erro', async () => {
      order.mockResolvedValue({ data: null, error: { message: 'db error' } })

      await expect(listLancamentos({})).rejects.toThrow('Não foi possível carregar os lançamentos')
    })
  })

  describe('criarLancamento', () => {
    const novo = {
      data: '2026-09-20',
      valor: 150.5,
      tipo: 'saida' as const,
      categoriaId: 'c1',
      descricao: 'Conta de luz',
      doadorId: null,
      comprovanteUrl: null,
    }

    it('insere o lançamento com as colunas do banco, sem informar o usuário (o banco preenche)', async () => {
      insert.mockResolvedValue({ error: null })

      await criarLancamento(novo)

      expect(from).toHaveBeenCalledWith('lancamentos')
      expect(insert).toHaveBeenCalledWith({
        data: '2026-09-20',
        valor: 150.5,
        tipo: 'saida',
        categoria_id: 'c1',
        descricao: 'Conta de luz',
        doador_id: null,
        comprovante_url: null,
      })
    })

    it('grava o caminho do comprovante quando há um', async () => {
      insert.mockResolvedValue({ error: null })

      await criarLancamento({ ...novo, comprovanteUrl: 'abc.pdf' })

      expect(insert).toHaveBeenCalledWith(expect.objectContaining({ comprovante_url: 'abc.pdf' }))
    })

    it('envia o doador quando a entrada tem um', async () => {
      insert.mockResolvedValue({ error: null })

      await criarLancamento({ ...novo, tipo: 'entrada', doadorId: 'd1' })

      expect(insert).toHaveBeenCalledWith(expect.objectContaining({ doador_id: 'd1' }))
    })

    it('lança mensagem genérica quando o Supabase retorna erro', async () => {
      insert.mockResolvedValue({ error: { code: '42501', message: 'rls violation' } })

      await expect(criarLancamento(novo)).rejects.toThrow('Não foi possível salvar o lançamento')
    })
  })

  describe('editarLancamento', () => {
    it('atualiza data, valor, categoria, descrição e doador do lançamento informado, sem mexer no tipo', async () => {
      updateEq.mockResolvedValue({ error: null })

      await editarLancamento('l1', {
        data: '2026-09-21',
        valor: 99,
        categoriaId: 'c2',
        descricao: 'Corrigido',
        doadorId: 'd1',
        comprovanteUrl: 'novo.pdf',
      })

      expect(update).toHaveBeenCalledWith({
        data: '2026-09-21',
        valor: 99,
        categoria_id: 'c2',
        descricao: 'Corrigido',
        doador_id: 'd1',
        comprovante_url: 'novo.pdf',
      })
      expect(updateEq).toHaveBeenCalledWith('id', 'l1')
    })

    it('lança mensagem genérica quando o Supabase retorna erro', async () => {
      updateEq.mockResolvedValue({ error: { message: 'db error' } })

      await expect(
        editarLancamento('l1', {
          data: '2026-09-21',
          valor: 99,
          categoriaId: 'c2',
          descricao: 'x',
          doadorId: null,
          comprovanteUrl: null,
        }),
      ).rejects.toThrow('Não foi possível salvar o lançamento')
    })
  })

  describe('cancelarLancamento', () => {
    it('marca o lançamento como cancelado em vez de excluí-lo', async () => {
      updateEq.mockResolvedValue({ error: null })

      await cancelarLancamento('l1')

      expect(update).toHaveBeenCalledWith({ cancelado: true })
      expect(updateEq).toHaveBeenCalledWith('id', 'l1')
    })

    it('lança mensagem genérica quando o Supabase retorna erro', async () => {
      updateEq.mockResolvedValue({ error: { message: 'db error' } })

      await expect(cancelarLancamento('l1')).rejects.toThrow('Não foi possível cancelar o lançamento')
    })
  })

  describe('excluirLancamento', () => {
    it('exclui só o lançamento informado, e apenas se ele já estiver cancelado', async () => {
      excluirSelect.mockResolvedValue({ data: [{ id: 'l1' }], error: null })

      await excluirLancamento('l1')

      expect(from).toHaveBeenCalledWith('lancamentos')
      expect(excluir).toHaveBeenCalled()
      expect(excluirMatch).toHaveBeenCalledWith({ id: 'l1', cancelado: true })
    })

    // O banco ignora em silêncio um DELETE que não casa com a regra (0 linhas), então o service confere.
    it('avisa que só é possível excluir lançamento cancelado quando nada foi excluído', async () => {
      excluirSelect.mockResolvedValue({ data: [], error: null })

      await expect(excluirLancamento('l1')).rejects.toThrow(
        'Só é possível excluir um lançamento que já foi cancelado.',
      )
    })

    it('lança mensagem genérica quando o Supabase retorna erro', async () => {
      excluirSelect.mockResolvedValue({ data: null, error: { message: 'db error' } })

      await expect(excluirLancamento('l1')).rejects.toThrow('Não foi possível excluir o lançamento')
    })
  })
})
