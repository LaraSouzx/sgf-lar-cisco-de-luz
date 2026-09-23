import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  criarCategoria,
  desativarCategoria,
  editarCategoria,
  listarCategorias,
} from './categoriaService'

const { order, insert, eq, update, from } = vi.hoisted(() => {
  const order = vi.fn()
  const select = vi.fn(() => ({ order }))
  const insert = vi.fn()
  const eq = vi.fn()
  const update = vi.fn(() => ({ eq }))
  const from = vi.fn((_table: string) => ({ select, insert, update }))
  return { order, insert, eq, update, from }
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
})
