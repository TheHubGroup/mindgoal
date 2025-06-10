import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface Profile {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  grade?: string
  school_name?: string
  city?: string
  country?: string
  age?: number
  gender?: string
  avatar_url?: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, profileData: any) => Promise<{ error?: any }>
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: any }>
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
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
      
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error in fetchProfile:', error)
    }
  }

  const signUp = async (email: string, password: string, profileData: any) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } }
    }

    try {
      console.log('Starting signup process...')
      
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: profileData.first_name,
            last_name: profileData.last_name,
          }
        }
      })

      if (error) {
        console.error('Auth signup error:', error)
        return { error }
      }

      console.log('Auth signup successful:', data)

      // If user is created, create detailed profile
      if (data.user) {
        console.log('Creating profile for user:', data.user.id)
        
        const profilePayload = {
          id: data.user.id,
          email: email.toLowerCase(),
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          grade: profileData.grade,
          school_name: profileData.school_name,
          city: profileData.city,
          country: profileData.country,
          age: profileData.age,
          gender: profileData.gender,
          avatar_url: profileData.avatar_url || '',
          user_id: data.user.id
        }

        console.log('Profile payload:', profilePayload)

        const { data: profileResult, error: profileError } = await supabase
          .from('profiles')
          .insert(profilePayload)
          .select()
          .single()

        if (profileError) {
          console.error('Error creating profile:', profileError)
          // Don't return error here - user is created, profile can be updated later
          console.warn('Profile creation failed, but user account was created successfully')
        } else {
          console.log('Profile created successfully:', profileResult)
        }
      }

      return { error: null }
    } catch (error: any) {
      console.error('Signup error:', error)
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } }
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { error }
  }

  const signOut = async () => {
    if (!supabase) return

    await supabase.auth.signOut()
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!supabase || !user) {
      return { error: { message: 'Not authenticated' } }
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)

    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null)
    }

    return { error }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}