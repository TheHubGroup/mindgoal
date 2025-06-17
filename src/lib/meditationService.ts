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
  skip_count: number // número de veces que hizo skip forward
  last_position: number // última posición vista en segundos
  view_count: number // número de veces que ha visto el video
  created_at?: string
  updated_at?: string
}

export const meditationService = {
  // Obtener o crear la sesión única del usuario para un video
  async getOrCreateSession(userId: string, videoId: string, videoTitle: string): Promise<MeditationSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      // Primero intentar obtener la sesión existente
      const { data: existingSession, error: fetchError } = await supabase
        .from('meditation_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('video_id', videoId)
        .single()

      if (existingSession) {
        return existingSession
      }

      // Si no existe, crear una nueva
      if (fetchError && fetchError.code === 'PGRST116') { // No rows returned
        const { data: newSession, error: createError } = await supabase
          .from('meditation_sessions')
          .insert([{
            user_id: userId,
            video_id: videoId,
            video_title: videoTitle,
            watch_duration: 0,
            total_duration: 0,
            completion_percentage: 0,
            skip_count: 0,
            last_position: 0,
            view_count: 0
          }])
          .select()
          .single()

        if (createError) {
          console.error('Error creating meditation session:', createError)
          return null
        }

        return newSession
      }

      console.error('Error fetching session:', fetchError)
      return null
    } catch (error) {
      console.error('Error in getOrCreateSession:', error)
      return null
    }
  },

  // Actualizar la sesión única (UPSERT)
  async updateSession(userId: string, videoId: string, updates: Partial<MeditationSession>): Promise<MeditationSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('meditation_sessions')
        .upsert({
          user_id: userId,
          video_id: videoId,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,video_id'
        })
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

  // Registrar que el usuario hizo skip forward
  async recordSkip(userId: string, videoId: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      // Obtener la sesión actual
      const { data: session, error: fetchError } = await supabase
        .from('meditation_sessions')
        .select('skip_count')
        .eq('user_id', userId)
        .eq('video_id', videoId)
        .single()

      if (fetchError) {
        console.error('Error fetching session for skip:', fetchError)
        return false
      }

      // Incrementar el contador de skips
      const { error: updateError } = await supabase
        .from('meditation_sessions')
        .update({ 
          skip_count: (session.skip_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('video_id', videoId)

      if (updateError) {
        console.error('Error updating skip count:', updateError)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in recordSkip:', error)
      return false
    }
  },

  // Reiniciar la sesión para volver a ver el video
  async restartSession(userId: string, videoId: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      // Obtener la sesión actual para incrementar view_count
      const { data: session, error: fetchError } = await supabase
        .from('meditation_sessions')
        .select('view_count')
        .eq('user_id', userId)
        .eq('video_id', videoId)
        .single()

      if (fetchError) {
        console.error('Error fetching session for restart:', fetchError)
        return false
      }

      // Reiniciar la sesión pero mantener el historial
      const { error: updateError } = await supabase
        .from('meditation_sessions')
        .update({
          started_at: new Date().toISOString(),
          completed_at: null,
          last_position: 0,
          view_count: (session.view_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('video_id', videoId)

      if (updateError) {
        console.error('Error restarting session:', updateError)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in restartSession:', error)
      return false
    }
  },

  // Obtener todas las sesiones del usuario (para estadísticas)
  async getAllSessions(userId: string): Promise<MeditationSession[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('meditation_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching meditation sessions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllSessions:', error)
      return []
    }
  }
}