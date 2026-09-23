import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { useForgotPassword } from '../hooks/useForgotPassword'

export function ForgotPassword() {
  const { email, setEmail, isLoading, error, isSubmitted, submit } = useForgotPassword()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    submit()
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-5.5">
        <h2 className="m-0 mb-1.5 text-center text-4xl font-semibold tracking-[-0.02em] text-gray-900">
          Esqueci minha senha
        </h2>

        {isSubmitted ? (
          <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-center text-sm text-green-700">
            Se o e-mail informado estiver cadastrado, você vai receber um link para redefinir sua
            senha.
          </p>
        ) : (
          <>
            <p className="m-0 text-center text-sm text-gray-500">
              Informe seu e-mail e enviaremos um link para você criar uma nova senha.
            </p>

            <div className="flex flex-col gap-2.5">
              <label htmlFor="email" className="text-sm font-semibold text-gray-900">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="voce@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-[14px] border-none bg-[#f4f5f7] px-4 text-[15px] text-gray-900 focus:outline-2 focus:outline-[#1f45d6] focus:outline-offset-0"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-1 h-13.5 rounded-[14px] border-none bg-[#1f45d6] text-[17px] font-bold text-white hover:bg-[#1532a6] disabled:opacity-60"
            >
              {isLoading ? 'Enviando...' : 'Enviar link de redefinição'}
            </button>
          </>
        )}

        <Link
          to="/login"
          className="text-center text-[13px] font-semibold text-[#1f45d6] hover:text-[#1532a6] hover:underline"
        >
          Voltar para o login
        </Link>
      </form>
    </AuthLayout>
  )
}
