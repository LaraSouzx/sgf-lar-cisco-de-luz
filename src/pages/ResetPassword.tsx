import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { useResetPassword } from '../hooks/useResetPassword'

export function ResetPassword() {
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    isLoading,
    error,
    isSubmitted,
    submit,
  } = useResetPassword()
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    submit()
  }

  if (isSubmitted) {
    return <Navigate to="/" replace />
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-5.5">
        <h2 className="m-0 mb-1.5 text-center text-4xl font-semibold tracking-[-0.02em] text-gray-900">
          Redefinir senha
        </h2>

        <p className="m-0 text-center text-sm text-gray-500">Escolha uma nova senha para sua conta.</p>

        <div className="flex flex-col gap-2.5">
          <label htmlFor="password" className="text-sm font-semibold text-gray-900">
            Nova senha
          </label>
          <div className="relative flex">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              placeholder="Digite sua nova senha"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-12 grow rounded-[14px] border-none bg-[#f4f5f7] py-0 pr-13 pl-4 text-[15px] text-gray-900 focus:outline-2 focus:outline-[#1f45d6] focus:outline-offset-0"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}
              className="absolute top-0.5 right-0.5 flex h-11 w-11 items-center justify-center text-[#6b7079]"
            >
              {showPassword ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.8 3.7M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 5.4-1.6" />
                  <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-900">
            Confirmar nova senha
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            placeholder="Digite a senha novamente"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
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
          {isLoading ? 'Salvando...' : 'Redefinir senha'}
        </button>
      </form>
    </AuthLayout>
  )
}
