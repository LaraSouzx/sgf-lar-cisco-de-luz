import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  criarCategoria,
  desativarCategoria,
  editarCategoria,
  excluirCategoria,
  listarCategorias,
  reativarCategoria,
} from './categoriaService'

const { order, insert, eq, update, excluirEq, excluir, from } = vi.hoisted(() => {
  const order = vi.fn()
  const select = vi.fn(() => ({ order }))
  const insert = vi.fn()
  const eq = vi.fn()
  const update = vi.fn(() => ({ eq }))
  const excluirEq = vi.fn()
  const excluir = vi.fn(() => ({ eq: excluirEq }))
  const from = vi.fn((_table: string) => ({ select, insert, update, delete: excluir }))
  return { order, insert, eq, update, excluirEq, excluir, from }
})

vi.mock('../lib/supabaseClient', () => ({
  supabase: { from },
}))

describe('categoriaService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listarCategorias', () => {
    it('devolve todas as categorias, inclusive as desativadas, ordenadas por nome', async () => {
      const categorias = [
        { id: 'c1', nome: 'Aluguel', tipo: 'saida', ativa: true },
        { id: 'c2', nome: 'Doação', tipo: 'entrada', ativa: false },
      ]
      order.mockResolvedValue({ data: categorias, error: null })

      const result = await listarCategorias()

      expect(from).toHaveBeenCalledWith('categorias')
      expect(order).toHaveBeenCalledWith('nome')
      expect(result).toEqual(categorias)
    })

    it('lança mensagem genérica quando o Supabase retorna erro', async () => {
      order.mockResolvedValue({ data: null, error: { message: 'db error' } })

      await expect(listarCategorias()).rejects.toThrow('Não foi possível carregar as categorias')
    })
  })

  describe('criarCategoria', () => {
    it('insere a categoria com nome e tipo na tabela categorias', async () => {
      insert.mockResolvedValue({ error: null })

      await criarCategoria({ nome: 'Aluguel', tipo: 'saida' })

      expect(from).toHaveBeenCalledWith('categorias')
      expect(insert).toHaveBeenCalledWith({ nome: 'Aluguel', tipo: 'saida' })
    })

    it('avisa que o nome já existe quando a constraint de unicidade é violada', async () => {
      insert.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } })

      await expect(criarCategoria({ nome: 'Aluguel', tipo: 'saida' })).rejects.toThrow(
        'Já existe uma categoria com esse nome',
      )
    })

    it('lança mensagem genérica para qualquer outro erro do Supabase', async () => {
      insert.mockResolvedValue({ error: { code: '42501', message: 'rls violation' } })

      await expect(criarCategoria({ nome: 'Aluguel', tipo: 'saida' })).rejects.toThrow(
        'Não foi possível salvar a categoria',
      )
    })
  })

  describe('editarCategoria', () => {
    it('atualiza apenas o nome da categoria informada', async () => {
      eq.mockResolvedValue({ error: null })

      await editarCategoria('c1', { nome: 'Aluguel da sede' })

      expect(from).toHaveBeenCalledWith('categorias')
      expect(update).toHaveBeenCalledWith({ nome: 'Aluguel da sede' })
      expect(eq).toHaveBeenCalledWith('id', 'c1')
    })

    it('avisa que o nome já existe quando renomeia para um nome repetido', async () => {
      eq.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } })

      await expect(editarCategoria('c1', { nome: 'Doação' })).rejects.toThrow(
        'Já existe uma categoria com esse nome',
      )
    })
  })

  describe('reativarCategoria', () => {
    it('marca a categoria como ativa novamente', async () => {
      eq.mockResolvedValue({ error: null })

      await reativarCategoria('c1')

      expect(update).toHaveBeenCalledWith({ ativa: true })
      expect(eq).toHaveBeenCalledWith('id', 'c1')
    })
  })

  describe('desativarCategoria', () => {
    it('marca a categoria como inativa em vez de excluí-la', async () => {
      eq.mockResolvedValue({ error: null })

      await desativarCategoria('c1')

      expect(update).toHaveBeenCalledWith({ ativa: false })
      expect(eq).toHaveBeenCalledWith('id', 'c1')
    })

    it('lança mensagem genérica quando o Supabase retorna erro', async () => {
      eq.mockResolvedValue({ error: { code: '42501', message: 'rls violation' } })

      await expect(desativarCategoria('c1')).rejects.toThrow('Não foi possível salvar a categoria')
    })
  })

  describe('excluirCategoria', () => {
    it('exclui a categoria informada da tabela categorias', async () => {
      excluirEq.mockResolvedValue({ error: null })

      await excluirCategoria('c1')

      expect(from).toHaveBeenCalledWith('categorias')
      expect(excluir).toHaveBeenCalled()
      expect(excluirEq).toHaveBeenCalledWith('id', 'c1')
    })

    // O banco recusa a exclusão (chave estrangeira) quando ainda há lançamentos na categoria.
    it('explica que não dá para excluir quando já há lançamentos ligados', async () => {
      excluirEq.mockResolvedValue({ error: { code: '23503', message: 'foreign key violation' } })

      await expect(excluirCategoria('c1')).rejects.toThrow(
        'Não é possível excluir: já há lançamentos nesta categoria. Desative-a para que ela deixe de aparecer.',
      )
    })

    it('lança mensagem genérica para qualquer outro erro do Supabase', async () => {
      excluirEq.mockResolvedValue({ error: { code: '42501', message: 'rls violation' } })

      await expect(excluirCategoria('c1')).rejects.toThrow('Não foi possível excluir a categoria')
    })
  })
})
