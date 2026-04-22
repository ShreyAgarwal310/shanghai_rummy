import { createContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { ProfileRow } from '../types/database'

type AuthCredentials = {
  email: string
  password: string
}

type SignUpCredentials = AuthCredentials & {
  displayName: string
}

type AuthContextValue = {
  loading: boolean
  isConfigured: boolean
  user: User | null
  session: Session | null
  profile: ProfileRow | null
  errorMessage: string
  signIn: (credentials: AuthCredentials) => Promise<void>
  signUp: (credentials: SignUpCredentials) => Promise<string | null>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  changePassword: (newPassword: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type AuthProviderProps = {
  children: ReactNode
}

async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) {
    throw error
  }

  return data
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setLoading(false)
      setErrorMessage('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
      return
    }

    const supabaseClient = supabase

    const bootstrap = async () => {
      const { data, error } = await supabaseClient.auth.getSession()
      if (error) {
        setErrorMessage(error.message)
        setLoading(false)
        return
      }

      setSession(data.session)
      setUser(data.session?.user ?? null)

      if (data.session?.user) {
        try {
          setProfile(await fetchProfile(data.session.user.id))
        } catch (profileError) {
          const message = profileError instanceof Error ? profileError.message : 'Unable to load profile.'
          setErrorMessage(message)
        }
      }

      setLoading(false)
    }

    void bootstrap()

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)

      if (!nextSession?.user) {
        setProfile(null)
        return
      }

      void fetchProfile(nextSession.user.id)
        .then((nextProfile) => {
          setProfile(nextProfile)
        })
        .catch((profileError) => {
          const message = profileError instanceof Error ? profileError.message : 'Unable to load profile.'
          setErrorMessage(message)
        })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null)
      return
    }

    setProfile(await fetchProfile(user.id))
  }

  const signIn = async ({ email, password }: AuthCredentials) => {
    if (!supabase) {
      throw new Error('Supabase is not configured.')
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      throw error
    }
  }

  const signUp = async ({ email, password, displayName }: SignUpCredentials) => {
    if (!supabase) {
      throw new Error('Supabase is not configured.')
    }

    const { data: existingEmail } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', email.trim())
      .maybeSingle()

    if (existingEmail) {
      throw new Error('An account with that email already exists.')
    }

    const { data: existingName } = await supabase
      .from('profiles')
      .select('id')
      .ilike('display_name', displayName.trim())
      .maybeSingle()

    if (existingName) {
      throw new Error('That display name is already taken.')
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim(),
        },
      },
    })

    if (error) {
      throw error
    }

    if (data.user && data.session) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email ?? email,
        display_name: displayName.trim(),
      })

      if (profileError) {
        throw profileError
      }
    }

    if (!data.session) {
      return 'Check your email to confirm your account before signing in.'
    }

    return null
  }

  const forgotPassword = async (email: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured.')
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/profile`,
    })
    if (error) {
      throw error
    }
  }

  const changePassword = async (newPassword: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured.')
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      throw error
    }
  }

  const signOut = async () => {
    if (!supabase) {
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      throw error
    }

    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        loading,
        isConfigured: isSupabaseConfigured,
        user,
        session,
        profile,
        errorMessage,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        changePassword,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
