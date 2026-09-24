import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LancamentoForm } from './LancamentoForm'

function renderFormulario(tipoInicial?: 'entrada' | 'saida') {
  render(
    <LancamentoForm
      categorias={[]}
      doadores={[]}
      tipoInicial={tipoInicial}
      onSubmit={vi.fn()}
      onCancelarEdicao={vi.fn()}
    />,
  )
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
