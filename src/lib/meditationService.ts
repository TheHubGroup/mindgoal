import { supabase } from './supabase'

export interface MeditationSession {
  id?: string
  user_id?: string
  video_id: string
  video_title: string
  started_at?: string
  completed_at?: string | null
  watch_duration: number // en segundos
  total_duration: number // duración total del video en segundos
  completion_percentage: number
  reflection_text?: string
  created_at?: string
  updated_at?: string
}

export const meditationService = {
  // Obtener todas las sesiones de meditación del usuario
  async getSessions(userId: string): Promise<MeditationSession[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('meditation_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching meditation sessions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getSessions:', error)
      return []
    }
  },

  // Crear una nueva sesión de meditación
  async createSession(session: Omit<MeditationSession, 'id' | 'created_at' | 'updated_at'>): Promise<MeditationSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('meditation_sessions')
        .insert([session])
        .select()
        .single()

      if (error) {
        console.error('Error creating meditation session:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createSession:', error)
      return null
    }
  },

  // Actualizar una sesión existente
  async updateSession(id: string, updates: Partial<MeditationSession>): Promise<MeditationSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('meditation_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating meditation session:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateSession:', error)
      return null
    }
  },

  // Obtener la última sesión para un video específico
  async getLastSessionForVideo(userId: string, videoId: string): Promise<MeditationSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('meditation_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('video_id', videoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching last session:', error)
        return null
      }

      return data || null
    } catch (error) {
      console.error('Error in getLastSessionForVideo:', error)
      return null
    }
  }
}