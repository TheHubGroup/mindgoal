import { supabase } from './supabase'

export interface CumplirSuenoStep {
  id?: string
  session_id: string
  step_number: number
  step_title: string
  step_description: string
  estimated_time?: string
  resources?: string[]
  is_completed: boolean
  created_at?: string
  updated_at?: string
}

export interface CumplirSuenoSession {
  id?: string
  user_id?: string
  dream_title: string
  dream_description: string
  ai_roadmap?: string
  ai_generated_image_url?: string
  completed_at?: string | null
  steps?: CumplirSuenoStep[]
  created_at?: string
  updated_at?: string
}

export const cumplirSuenoService = {
  // Crear nueva sesión
  async createSession(userId: string, dreamTitle: string, dreamDescription: string): Promise<CumplirSuenoSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data: newSession, error: createError } = await supabase
        .from('cumplir_sueno_sessions')
        .insert([{
          user_id: userId,
          dream_title: dreamTitle,
          dream_description: dreamDescription
        }])
        .select()
        .single()

      if (createError) {
        console.error('Error creating cumplir sueno session:', createError)
        return null
      }

      return {
        ...newSession,
        steps: []
      }
    } catch (error) {
      console.error('Error in createSession:', error)
      return null
    }
  },

  // Actualizar sesión con roadmap de IA e imagen
  async updateSessionWithAI(sessionId: string, aiRoadmap: string, imageUrl?: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      const updates: any = {
        ai_roadmap: aiRoadmap,
        updated_at: new Date().toISOString()
      }

      if (imageUrl) {
        updates.ai_generated_image_url = imageUrl
      }

      const { error } = await supabase
        .from('cumplir_sueno_sessions')
        .update(updates)
        .eq('id', sessionId)

      if (error) {
        console.error('Error updating session with AI:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateSessionWithAI:', error)
      return false
    }
  },

  // Guardar pasos del roadmap
  async saveSteps(sessionId: string, steps: Omit<CumplirSuenoStep, 'id' | 'session_id' | 'created_at' | 'updated_at'>[]): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      // Primero eliminar pasos existentes
      await supabase
        .from('cumplir_sueno_steps')
        .delete()
        .eq('session_id', sessionId)

      // Insertar nuevos pasos
      const stepsToInsert = steps.map(step => ({
        session_id: sessionId,
        ...step
      }))

      const { error } = await supabase
        .from('cumplir_sueno_steps')
        .insert(stepsToInsert)

      if (error) {
        console.error('Error saving steps:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in saveSteps:', error)
      return false
    }
  },

  // Marcar paso como completado
  async toggleStepCompletion(stepId: string, isCompleted: boolean): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      const { error } = await supabase
        .from('cumplir_sueno_steps')
        .update({ 
          is_completed: isCompleted,
          updated_at: new Date().toISOString()
        })
        .eq('id', stepId)

      if (error) {
        console.error('Error toggling step completion:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in toggleStepCompletion:', error)
      return false
    }
  },

  // Completar sesión
  async completeSession(sessionId: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      const { error } = await supabase
        .from('cumplir_sueno_sessions')
        .update({ 
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) {
        console.error('Error completing session:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in completeSession:', error)
      return false
    }
  },

  // Obtener sesión con pasos
  async getSessionWithSteps(sessionId: string): Promise<CumplirSuenoSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      // Obtener sesión
      const { data: session, error: sessionError } = await supabase
        .from('cumplir_sueno_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionError) {
        console.error('Error fetching session:', sessionError)
        return null
      }

      // Obtener pasos
      const { data: steps, error: stepsError } = await supabase
        .from('cumplir_sueno_steps')
        .select('*')
        .eq('session_id', sessionId)
        .order('step_number', { ascending: true })

      if (stepsError) {
        console.error('Error fetching steps:', stepsError)
        return { ...session, steps: [] }
      }

      return { ...session, steps: steps || [] }
    } catch (error) {
      console.error('Error in getSessionWithSteps:', error)
      return null
    }
  },

  // Obtener todas las sesiones del usuario
  async getAllSessions(userId: string): Promise<CumplirSuenoSession[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      const { data: sessions, error: sessionsError } = await supabase
        .from('cumplir_sueno_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError)
        return []
      }

      // Para cada sesión, obtener sus pasos
      const sessionsWithSteps = await Promise.all(
        (sessions || []).map(async (session) => {
          const { data: steps, error: stepsError } = await supabase
            .from('cumplir_sueno_steps')
            .select('*')
            .eq('session_id', session.id)
            .order('step_number', { ascending: true })

          if (stepsError) {
            console.error('Error fetching steps for session:', stepsError)
            return { ...session, steps: [] }
          }

          return { ...session, steps: steps || [] }
        })
      )

      return sessionsWithSteps
    } catch (error) {
      console.error('Error in getAllSessions:', error)
      return []
    }
  },

  // Eliminar sesión
  async deleteSession(sessionId: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      // Los pasos se eliminan automáticamente por CASCADE
      const { error } = await supabase
        .from('cumplir_sueno_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) {
        console.error('Error deleting session:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteSession:', error)
      return false
    }
  }
}