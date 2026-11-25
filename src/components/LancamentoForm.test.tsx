import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Lancamento } from '../types/lancamento'
import { LancamentoForm } from './LancamentoForm'

const doadores = [{ id: 'd1', nome: 'Maria', documento: null, tipo: 'pessoa_fisica' as const }]

function renderFormulario(tipoInicial?: 'entrada' | 'saida', lancamentoEmEdicao?: Lancamento) {
  const onSubmit = vi.fn().mockResolvedValue(true)
  render(
    <LancamentoForm
      categorias={[]}
      doadores={doadores}
      tipoInicial={tipoInicial}
      lancamentoEmEdicao={lancamentoEmEdicao}
      onSubmit={onSubmit}
      onCancelarEdicao={vi.fn()}
    />,
  )
  return onSubmit
}

describe('LancamentoForm: tipo inicial', () => {
  it('abre em Saída por padrão', () => {
    renderFormulario()

    expect(screen.getByLabelText('Tipo do lançamento')).toHaveValue('saida')
  })

  it('abre em Entrada quando o tipo inicial pedido é entrada (vindo do dashboard)', () => {
    renderFormulario('entrada')

    expect(screen.getByLabelText('Tipo do lançamento')).toHaveValue('entrada')
  })
})

describe('LancamentoForm: forma de recebimento', () => {
  it('mostra o campo só em entradas, sem valor escolhido', () => {
    renderFormulario('entrada')

    expect(screen.getByLabelText('Forma de recebimento')).toHaveValue('')
  })

  it('não mostra o campo em saídas', () => {
    renderFormulario('saida')

    expect(screen.queryByLabelText('Forma de recebimento')).not.toBeInTheDocument()
  })

  it('oferece Dinheiro, Pix, Transferência e Outro', () => {
    renderFormulario('entrada')

    const opcoes = screen.getAllByRole('option').map((opcao) => opcao.textContent)
    expect(opcoes).toEqual(expect.arrayContaining(['Dinheiro', 'Pix', 'Transferência', 'Outro']))
  })

  it('descarta a forma escolhida ao trocar para saída', async () => {
    const usuario = userEvent.setup()
    const onSubmit = renderFormulario('entrada')

    await usuario.selectOptions(screen.getByLabelText('Forma de recebimento'), 'dinheiro')
    await usuario.selectOptions(screen.getByLabelText('Tipo do lançamento'), 'saida')
    await usuario.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'saida', formaRecebimento: null }))
  })

  it('envia a forma escolhida junto com o formulário', async () => {
    const usuario = userEvent.setup()
    const onSubmit = renderFormulario('entrada')

    await usuario.selectOptions(screen.getByLabelText('Forma de recebimento'), 'pix')
    await usuario.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ formaRecebimento: 'pix' }))
  })

  it('abre a edição de uma entrada antiga sem forma escolhida, para ser preenchida', () => {
    renderFormulario('entrada', {
      id: 'l1',
      data: '2026-01-10',
      valor: 80,
      tipo: 'entrada',
      categoriaId: 'c1',
      categoriaNome: 'Doação',
      usuarioId: 'u1',
      doadorId: 'd1',
      doadorNome: 'Maria',
      formaRecebimento: null,
      descricao: 'Doação antiga',
      comprovanteUrl: null,
      cancelado: false,
    })

    expect(screen.getByLabelText('Forma de recebimento')).toHaveValue('')
  })
})
