import { beforeEach, describe, expect, it, vi } from 'vitest'
import { criarDoador, editarDoador, listarDoadores } from './doadorService'

const { order, select, insert, updateEq, update, from } = vi.hoisted(() => {
  const order = vi.fn()
  const select = vi.fn(() => ({ order }))
  const insert = vi.fn()
  const updateEq = vi.fn()
  const update = vi.fn(() => ({ eq: updateEq }))
  const from = vi.fn((_table: string) => ({ select, insert, update }))
  return { order, select, insert, updateEq, update, from }
})

vi.mock('../lib/supabaseClient', () => ({
  supabase: { from },
}))

const dadosDoador = { nome: 'Maria Silva', tipo: 'pessoa_fisica' as const, documento: '52998224725' }

describe('doadorService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listarDoadores', () => {
    it('devolve os doadores ordenados por nome', async () => {
      const doadores = [{ id: 'd1', ...dadosDoador }]
      order.mockResolvedValue({ data: doadores, error: null })

      const result = await listarDoadores()

      expect(from).toHaveBeenCalledWith('doadores')
      expect(select).toHaveBeenCalledWith('id, nome, documento, tipo')
      expect(order).toHaveBeenCalledWith('nome')
      expect(result).toEqual(doadores)
    })

    it('lança mensagem genérica quando o Supabase retorna erro', async () => {
      order.mockResolvedValue({ data: null, error: { message: 'db error' } })

      await expect(listarDoadores()).rejects.toThrow('Não foi possível carregar os doadores')
    })
  })

  describe('criarDoador', () => {
    it('insere o doador na tabela doadores', async () => {
      insert.mockResolvedValue({ error: null })

      await criarDoador(dadosDoador)

      expect(from).toHaveBeenCalledWith('doadores')
      expect(insert).toHaveBeenCalledWith(dadosDoador)
    })

    it('avisa que o documento já existe quando a constraint de unicidade é violada', async () => {
      insert.mockResolvedValue({
        error: { code: '23505', message: 'duplicate key value (52998224725)' },
      })

      const promessa = criarDoador(dadosDoador)

      await expect(promessa).rejects.toThrow('Já existe um doador com esse documento')
      // O erro bruto do banco carrega o documento; ele nunca pode chegar à tela.
      await expect(promessa).rejects.not.toThrow(/52998224725/)
    })

    it('lança mensagem genérica para qualquer outro erro do Supabase', async () => {
      insert.mockResolvedValue({ error: { code: '42501', message: 'rls violation' } })

      await expect(criarDoador(dadosDoador)).rejects.toThrow('Não foi possível salvar o doador')
    })
  })

  describe('editarDoador', () => {
    it('atualiza nome, tipo e documento do doador informado', async () => {
      updateEq.mockResolvedValue({ error: null })

      await editarDoador('d1', dadosDoador)

      expect(update).toHaveBeenCalledWith(dadosDoador)
      expect(updateEq).toHaveBeenCalledWith('id', 'd1')
    })

    it('avisa que o documento já existe quando renomeia para um documento repetido', async () => {
      updateEq.mockResolvedValue({ error: { code: '23505', message: 'duplicate key' } })

      await expect(editarDoador('d1', dadosDoador)).rejects.toThrow(
        'Já existe um doador com esse documento',
      )
    })

    it('lança mensagem genérica para qualquer outro erro do Supabase', async () => {
      updateEq.mockResolvedValue({ error: { message: 'db error' } })

      await expect(editarDoador('d1', dadosDoador)).rejects.toThrow('Não foi possível salvar o doador')
    })
  })
})
