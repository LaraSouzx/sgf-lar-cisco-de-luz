import { beforeEach, describe, expect, it, vi } from 'vitest'
import { enviarComprovante, gerarLinkComprovante } from './comprovanteService'

const { upload, createSignedUrl, storageFrom } = vi.hoisted(() => {
  const upload = vi.fn()
  const createSignedUrl = vi.fn()
  const storageFrom = vi.fn((_bucket: string) => ({ upload, createSignedUrl }))
  return { upload, createSignedUrl, storageFrom }
})

vi.mock('../lib/supabaseClient', () => ({
  supabase: { storage: { from: storageFrom } },
}))

function arquivo(nome: string, tipo: string) {
  return new File(['conteudo'], nome, { type: tipo })
}

describe('comprovanteService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('enviarComprovante', () => {
    it('envia o arquivo para o bucket privado e devolve o caminho guardado', async () => {
      upload.mockResolvedValue({ error: null })
      const original = arquivo('nota-maria-silva-cpf.pdf', 'application/pdf')

      const caminho = await enviarComprovante(original)

      expect(storageFrom).toHaveBeenCalledWith('comprovantes')
      expect(upload).toHaveBeenCalledWith(caminho, original, { contentType: 'application/pdf' })
      expect(caminho).toMatch(/^[0-9a-f-]{36}\.pdf$/)
    })

    it('não reaproveita o nome original do arquivo, que pode conter dados pessoais', async () => {
      upload.mockResolvedValue({ error: null })

      const caminho = await enviarComprovante(arquivo('nota-maria-silva-cpf.jpeg', 'image/jpeg'))

      expect(caminho).not.toContain('maria')
      expect(caminho.endsWith('.jpg')).toBe(true)
    })

    it('gera um caminho diferente a cada envio, para nunca sobrescrever um comprovante', async () => {
      upload.mockResolvedValue({ error: null })
      const foto = arquivo('foto.png', 'image/png')

      const primeiro = await enviarComprovante(foto)
      const segundo = await enviarComprovante(foto)

      expect(primeiro).not.toBe(segundo)
    })

    it('lança mensagem genérica quando o envio falha', async () => {
      upload.mockResolvedValue({ error: { message: 'storage error' } })

      await expect(enviarComprovante(arquivo('a.pdf', 'application/pdf'))).rejects.toThrow(
        'Não foi possível enviar o comprovante',
      )
    })
  })

  describe('gerarLinkComprovante', () => {
    it('gera um link temporário de 60 segundos para o caminho informado', async () => {
      createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://exemplo.com/link' }, error: null })

      const link = await gerarLinkComprovante('abc.pdf')

      expect(storageFrom).toHaveBeenCalledWith('comprovantes')
      expect(createSignedUrl).toHaveBeenCalledWith('abc.pdf', 60)
      expect(link).toBe('https://exemplo.com/link')
    })

    it('lança mensagem genérica quando não consegue gerar o link', async () => {
      createSignedUrl.mockResolvedValue({ data: null, error: { message: 'not found' } })

      await expect(gerarLinkComprovante('abc.pdf')).rejects.toThrow('Não foi possível abrir o comprovante')
    })
  })
})
