import type { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { getSession, onAuthStateChange } from '../services/authService'

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getSession().then((currentSession) => {
      setSession(currentSession)
      setIsLoading(false)
    })

    const subscription = onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { session, isLoading }
}
