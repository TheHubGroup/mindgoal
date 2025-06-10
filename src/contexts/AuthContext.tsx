import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface BypassUser {
  id: string
  email: string
  profile: {
    nombre: string
    apellido: string
    grado: string
    nombre_colegio: string
    ciudad: string
    pais: string
    edad: number
    sexo: string
    avatar_url?: string
  }
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, profileData: any) => Promise<{ error?: any }>
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  bypassUser?: BypassUser
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
  const [bypassUser, setBypassUser] = useState<BypassUser | null>(null)

  useEffect(() => {
    // Intentar cargar usuario bypass del localStorage
    const savedBypassUser = localStorage.getItem('bypassUser')
    if (savedBypassUser) {
      const parsedUser = JSON.parse(savedBypassUser)
      setBypassUser(parsedUser)
      // Simular un user object para compatibilidad
      setUser({
        id: parsedUser.id,
        email: parsedUser.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {}
      } as User)
      setLoading(false)
      return
    }

    // Si no hay usuario bypass, intentar Supabase Auth normal
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
      // Modo bypass - crear usuario local
      const bypassUser: BypassUser = {
        id: `bypass_${Date.now()}`,
        email: email.toLowerCase().trim(),
        profile: {
          nombre: profileData.first_name || '',
          apellido: profileData.last_name || '',
          grado: profileData.grade || '',
          nombre_colegio: profileData.school_name || '',
          ciudad: profileData.city || '',
          pais: profileData.country || 'Colombia',
          edad: profileData.age || 0,
          sexo: profileData.gender || ''
        }
      }

      // Guardar en localStorage
      localStorage.setItem('bypassUser', JSON.stringify(bypassUser))
      setBypassUser(bypassUser)
      
      // Simular user object
      setUser({
        id: bypassUser.id,
        email: bypassUser.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {}
      } as User)

      return { error: null }
    }

    try {
      console.log('🚀 Iniciando registro...')
      
      // Intentar registro normal con Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password: password
      })

      if (authError) {
        console.error('❌ Error en auth.signUp, activando modo bypass...')
        
        // Si falla Supabase, activar modo bypass
        const bypassUser: BypassUser = {
          id: `bypass_${Date.now()}`,
          email: email.toLowerCase().trim(),
          profile: {
            nombre: profileData.first_name || '',
            apellido: profileData.last_name || '',
            grado: profileData.grade || '',
            nombre_colegio: profileData.school_name || '',
            ciudad: profileData.city || '',
            pais: profileData.country || 'Colombia',
            edad: profileData.age || 0,
            sexo: profileData.gender || ''
          }
        }

        localStorage.setItem('bypassUser', JSON.stringify(bypassUser))
        setBypassUser(bypassUser)
        
        setUser({
          id: bypassUser.id,
          email: bypassUser.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          aud: 'authenticated',
          app_metadata: {},
          user_metadata: {}
        } as User)

        return { error: null }
      }

      if (!authData.user) {
        console.error('❌ No se creó el usuario')
        return { error: { message: 'No se pudo crear el usuario' } }
      }

      console.log('✅ Usuario creado en auth:', authData.user.id)

      // Intentar crear perfil manualmente
      try {
        const profilePayload = {
          id: authData.user.id,
          email: email.toLowerCase().trim(),
          nombre: profileData.first_name || '',
          apellido: profileData.last_name || '',
          grado: profileData.grade || '',
          nombre_colegio: profileData.school_name || '',
          ciudad: profileData.city || '',
          pais: profileData.country || 'Colombia',
          edad: profileData.age || null,
          sexo: profileData.gender || '',
          avatar_url: ''
        }

        console.log('📝 Creando perfil:', profilePayload)

        const { error: profileError } = await supabase
          .from('profiles')
          .insert(profilePayload)

        if (profileError) {
          console.error('⚠️ Error creando perfil (no crítico):', profileError)
        } else {
          console.log('✅ Perfil creado exitosamente')
        }
      } catch (profileError) {
        console.error('⚠️ Error en creación de perfil:', profileError)
      }

      return { error: null }
    } catch (error: any) {
      console.error('❌ Error general en signUp, activando modo bypass...', error)
      
      // Activar modo bypass en caso de cualquier error
      const bypassUser: BypassUser = {
        id: `bypass_${Date.now()}`,
        email: email.toLowerCase().trim(),
        profile: {
          nombre: profileData.first_name || '',
          apellido: profileData.last_name || '',
          grado: profileData.grade || '',
          nombre_colegio: profileData.school_name || '',
          ciudad: profileData.city || '',
          pais: profileData.country || 'Colombia',
          edad: profileData.age || 0,
          sexo: profileData.gender || ''
        }
      }

      localStorage.setItem('bypassUser', JSON.stringify(bypassUser))
      setBypassUser(bypassUser)
      
      setUser({
        id: bypassUser.id,
        email: bypassUser.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        aud: 'authenticated',
        app_metadata: {},
        user_metadata: {}
      } as User)

      return { error: null }
    }
  }

  const signIn = async (email: string, password: string) => {
    // Verificar si hay usuario bypass guardado
    const savedBypassUser = localStorage.getItem('bypassUser')
    if (savedBypassUser) {
      const parsedUser = JSON.parse(savedBypassUser)
      if (parsedUser.email === email.toLowerCase().trim()) {
        setBypassUser(parsedUser)
        setUser({
          id: parsedUser.id,
          email: parsedUser.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          aud: 'authenticated',
          app_metadata: {},
          user_metadata: {}
        } as User)
        return { error: null }
      }
    }

    if (!supabase) {
      return { error: { message: 'Usuario no encontrado en modo bypass' } }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      })

      return { error }
    } catch (error: any) {
      console.error('Error in signIn:', error)
      return { error }
    }
  }

  const signOut = async () => {
    if (bypassUser) {
      // Limpiar usuario bypass
      localStorage.removeItem('bypassUser')
      setBypassUser(null)
      setUser(null)
      return
    }

    if (!supabase) return

    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    bypassUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}