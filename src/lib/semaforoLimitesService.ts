import { supabase } from './supabase'

export interface SemaforoResponse {
  id?: string
  user_id?: string
  session_id: string
  situation_id: string
  situation_title: string
  user_choice: 'rojo' | 'amarillo' | 'verde'
  created_at?: string
  updated_at?: string
}

export interface SemaforoSession {
  id?: string
  user_id?: string
  completed_at?: string | null
  total_situations: number
  completed_situations: number
  responses: SemaforoResponse[]
  created_at?: string
  updated_at?: string
}

export const semaforoLimitesService = {
  // Crear nueva sesión
  async createNewSession(userId: string): Promise<SemaforoSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data: newSession, error: createError } = await supabase
        .from('semaforo_limites_sessions')
        .insert([{
          user_id: userId,
          total_situations: 8,
          completed_situations: 0
        }])
        .select()
        .single()

      if (createError) {
        console.error('Error creating semaforo session:', createError)
        return null
      }

      return {
        ...newSession,
        responses: []
      }
    } catch (error) {
      console.error('Error in createNewSession:', error)
      return null
    }
  },

  // Guardar respuesta de una situación
  async saveResponse(userId: string, sessionId: string, situationId: string, situationTitle: string, choice: 'rojo' | 'amarillo' | 'verde'): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      const { error } = await supabase
        .from('semaforo_limites_responses')
        .insert([{
          user_id: userId,
          session_id: sessionId,
          situation_id: situationId,
          situation_title: situationTitle,
          user_choice: choice
        }])

      if (error) {
        console.error('Error saving semaforo response:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in saveResponse:', error)
      return false
    }
  },

  // Actualizar progreso de la sesión
  async updateSessionProgress(sessionId: string, completedSituations: number, completed = false): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      const updates: any = {
        completed_situations: completedSituations,
        updated_at: new Date().toISOString()
      }

      if (completed) {
        updates.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('semaforo_limites_sessions')
        .update(updates)
        .eq('id', sessionId)

      if (error) {
        console.error('Error updating session progress:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateSessionProgress:', error)
      return false
    }
  },

  // Obtener todas las sesiones del usuario
  async getAllSessions(userId: string): Promise<SemaforoSession[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      // Obtener sesiones
      const { data: sessions, error: sessionsError } = await supabase
        .from('semaforo_limites_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (sessionsError) {
        console.error('Error fetching semaforo sessions:', sessionsError)
        return []
      }

      // Para cada sesión, obtener sus respuestas
      const sessionsWithResponses = await Promise.all(
        (sessions || []).map(async (session) => {
          const { data: responses, error: responsesError } = await supabase
            .from('semaforo_limites_responses')
            .select('*')
            .eq('session_id', session.id)
            .order('created_at', { ascending: true })

          if (responsesError) {
            console.error('Error fetching responses for session:', responsesError)
            return { ...session, responses: [] }
          }

          return { ...session, responses: responses || [] }
        })
      )

      return sessionsWithResponses
    } catch (error) {
      console.error('Error in getAllSessions:', error)
      return []
    }
  },

  // Obtener sesión específica con respuestas
  async getSession(sessionId: string): Promise<SemaforoSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      // Obtener sesión
      const { data: session, error: sessionError } = await supabase
        .from('semaforo_limites_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionError) {
        console.error('Error fetching semaforo session:', sessionError)
        return null
      }

      // Obtener respuestas de la sesión
      const { data: responses, error: responsesError } = await supabase
        .from('semaforo_limites_responses')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (responsesError) {
        console.error('Error fetching session responses:', responsesError)
        return { ...session, responses: [] }
      }

      return { ...session, responses: responses || [] }
    } catch (error) {
      console.error('Error in getSession:', error)
      return null
    }
  },

  // Eliminar sesión
  async deleteSession(sessionId: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      // Primero eliminar las respuestas
      const { error: responsesError } = await supabase
        .from('semaforo_limites_responses')
        .delete()
        .eq('session_id', sessionId)

      if (responsesError) {
        console.error('Error deleting session responses:', responsesError)
        return false
      }

      // Luego eliminar la sesión
      const { error: sessionError } = await supabase
        .from('semaforo_limites_sessions')
        .delete()
        .eq('id', sessionId)

      if (sessionError) {
        console.error('Error deleting semaforo session:', sessionError)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteSession:', error)
      return false
    }
  }
}