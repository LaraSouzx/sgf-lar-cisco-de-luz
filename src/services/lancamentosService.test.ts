import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cancelarLancamento,
  criarLancamento,
  editarLancamento,
  listLancamentos,
} from './lancamentosService'

const { order, lte, gte, eq, select, insert, update, updateEq, from } = vi.hoisted(() => {
  const order = vi.fn()
  // Os filtros da listagem são opcionais e encadeáveis em qualquer combinação.
  const consulta: Record<string, unknown> = { order }
  const gte = vi.fn(() => consulta)
  const lte = vi.fn(() => consulta)
  const eq = vi.fn(() => consulta)
  Object.assign(consulta, { gte, lte, eq })

  const select = vi.fn(() => consulta)
  const insert = vi.fn()
  const updateEq = vi.fn()
  const update = vi.fn(() => ({ eq: updateEq }))
  const from = vi.fn((_table: string) => ({ select, insert, update }))
  return { order, lte, gte, eq, select, insert, update, updateEq, from }
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
      })
    })

    it('lança mensagem genérica quando o Supabase retorna erro', async () => {
      insert.mockResolvedValue({ error: { code: '42501', message: 'rls violation' } })

      await expect(criarLancamento(novo)).rejects.toThrow('Não foi possível salvar o lançamento')
    })
  })

  describe('editarLancamento', () => {
    it('atualiza data, valor, categoria e descrição do lançamento informado, sem mexer no tipo', async () => {
      updateEq.mockResolvedValue({ error: null })

      await editarLancamento('l1', {
        data: '2026-09-21',
        valor: 99,
        categoriaId: 'c2',
        descricao: 'Corrigido',
      })

      expect(update).toHaveBeenCalledWith({
        data: '2026-09-21',
        valor: 99,
        categoria_id: 'c2',
        descricao: 'Corrigido',
      })
      expect(updateEq).toHaveBeenCalledWith('id', 'l1')
    })

    it('lança mensagem genérica quando o Supabase retorna erro', async () => {
      updateEq.mockResolvedValue({ error: { message: 'db error' } })

      await expect(
        editarLancamento('l1', { data: '2026-09-21', valor: 99, categoriaId: 'c2', descricao: 'x' }),
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
})
