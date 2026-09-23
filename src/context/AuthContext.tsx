import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, type ReactNode } from 'react'
import { useSession } from '../hooks/useSession'

type AuthContextValue = {
  session: Session | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, isLoading } = useSession()

  return <AuthContext.Provider value={{ session, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthContext deve ser usado dentro de um AuthProvider')
  }

  return context
}
