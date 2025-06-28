import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, profileData: any) => Promise<{ error?: any }>
  signIn: (emailOrUsername: string, password: string) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  bypassUser?: any
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, profileData: any) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } }
    }

    try {
      console.log('🚀 Iniciando registro...')
      
      // Check if this is a no-email registration with username
      const isNoEmailRegistration = email.includes('@noemail.local')
      
      // Paso 1: Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password
      })

      if (authError) {
        console.error('❌ Error en auth.signUp:', authError)
        return { error: authError }
      }

      if (!authData.user) {
        console.error('❌ No se creó el usuario')
        return { error: { message: 'No se pudo crear el usuario' } }
      }

      console.log('✅ Usuario creado en auth:', authData.user.id)

      // Paso 2: Crear perfil manualmente (después de que el usuario esté creado)
      try {
        const profilePayload = {
          id: authData.user.id,
          email: email.toLowerCase().trim(),
          nombre: isNoEmailRegistration ? profileData.username : (profileData.first_name || ''),
          apellido: profileData.last_name || '',
          grado: profileData.grade || '',
          nombre_colegio: profileData.school_name || '',
          ciudad: profileData.city || '',
          pais: profileData.country || 'Colombia',
          edad: profileData.age || null,
          sexo: profileData.gender || '',
          avatar_url: '',
          has_email: !isNoEmailRegistration
        }

        console.log('📝 Creando perfil:', profilePayload)

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profilePayload)

        if (profileError) {
          console.error('⚠️ Error creando perfil (no crítico):', profileError)
          // No retornamos error aquí - el usuario se creó exitosamente
        } else {
          console.log('✅ Perfil creado exitosamente')
        }
      } catch (profileError) {
        console.error('⚠️ Error en creación de perfil:', profileError)
        // No retornamos error - el usuario principal se creó
      }

      return { error: null }
    } catch (error: any) {
      console.error('❌ Error general en signUp:', error)
      return { error }
    }
  }

  const signIn = async (emailOrUsername: string, password: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } }
    }

    try {
      // Check if this is a username login
      let loginEmail = emailOrUsername.toLowerCase().trim()
      
      // If it doesn't look like an email, try to find the user by username
      if (!loginEmail.includes('@')) {
        console.log('🔍 Buscando usuario por nombre:', loginEmail)
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('nombre', loginEmail)
          .limit(1)
          
        if (profileError) {
          console.error('Error finding user by username:', profileError)
          return { error: { message: 'Error al buscar usuario' } }
        }
        
        if (profiles && profiles.length > 0) {
          loginEmail = profiles[0].email
          console.log('✅ Usuario encontrado, email:', loginEmail)
        } else {
          console.error('❌ Usuario no encontrado:', loginEmail)
          return { error: { message: 'Usuario no encontrado' } }
        }
      }
      
      console.log('🔑 Intentando login con email:', loginEmail)
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      })

      if (error) {
        console.error('❌ Error en login:', error)
      }

      return { error }
    } catch (error: any) {
      console.error('Error in signIn:', error)
      return { error }
    }
  }

  const signOut = async () => {
    if (!supabase) return

    try {
      // Check if we have a valid session before attempting server-side logout
      if (session?.access_token) {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.warn('Server-side logout failed:', error)
          // Continue to clear local state even if server logout fails
        }
      } else {
        console.log('No valid session found, skipping server-side logout')
      }
    } catch (error) {
      console.warn('Error during logout:', error)
      // Continue to clear local state even if server logout fails
    } finally {
      // Always clear local auth state to ensure UI consistency
      setUser(null)
      setSession(null)
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}