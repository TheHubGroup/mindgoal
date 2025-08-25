import { supabase } from './supabase'

export interface ProblemaResueltoResponse {
  id?: string
  user_id?: string
  session_id: string
  problem_id: string
  problem_title: string
  problem_type: 'conflicto_otros' | 'conflicto_personal'
  user_choice: 'resiliente' | 'impulsiva'
  is_resilient: boolean
  feedback_shown: boolean
  created_at?: string
  updated_at?: string
}

export interface ProblemaResueltoSession {
  id?: string
  user_id?: string
  completed_at?: string | null
  total_problems: number
  completed_problems: number
  resilient_responses: number
  impulsive_responses: number
  resilience_score: number
  responses: ProblemaResueltoResponse[]
  created_at?: string
  updated_at?: string
}

export const problemaResueltoService = {
  // Crear nueva sesión
  async createNewSession(userId: string): Promise<ProblemaResueltoSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data: newSession, error: createError } = await supabase
        .from('problema_resuelto_sessions')
        .insert([{
          user_id: userId,
          total_problems: 4,
          completed_problems: 0,
          resilient_responses: 0,
          impulsive_responses: 0,
          resilience_score: 0
        }])
        .select()
        .single()

      if (createError) {
        console.error('Error creating problema resuelto session:', createError)
        
        // If table doesn't exist or other database error, return null gracefully
        if (createError.code === '42P01' || 
            createError.message?.includes('does not exist') ||
            createError.message?.includes('relation') ||
            !createError.message) {
          console.warn('Database tables not created yet. Please run the migration: 20250825230500_fix_problema_resuelto_policies.sql in Supabase Dashboard.')
          return null
        }
        
        console.error('Full error details:', createError)
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

  // Guardar respuesta de un problema
  async saveResponse(
    userId: string, 
    sessionId: string, 
    problemId: string, 
    problemTitle: string, 
    problemType: 'conflicto_otros' | 'conflicto_personal',
    choice: 'resiliente' | 'impulsiva',
    isResilient: boolean
  ): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      const { error } = await supabase
        .from('problema_resuelto_responses')
        .insert([{
          user_id: userId,
          session_id: sessionId,
          problem_id: problemId,
          problem_title: problemTitle,
          problem_type: problemType,
          user_choice: choice,
          is_resilient: isResilient,
          feedback_shown: true
        }])

      if (error) {
        console.error('Error saving problema resuelto response:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in saveResponse:', error)
      return false
    }
  },

  // Actualizar progreso de la sesión
  async updateSessionProgress(
    sessionId: string, 
    completedProblems: number, 
    resilientResponses: number,
    impulsiveResponses: number,
    completed = false
  ): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      const resilienceScore = completedProblems > 0 ? (resilientResponses / completedProblems) * 100 : 0

      const updates: any = {
        completed_problems: completedProblems,
        resilient_responses: resilientResponses,
        impulsive_responses: impulsiveResponses,
        resilience_score: resilienceScore,
        updated_at: new Date().toISOString()
      }

      if (completed) {
        updates.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('problema_resuelto_sessions')
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
  async getAllSessions(userId: string): Promise<ProblemaResueltoSession[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      // Obtener sesiones
      const { data: sessions, error: sessionsError } = await supabase
        .from('problema_resuelto_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (sessionsError) {
        console.error('Error fetching problema resuelto sessions:', sessionsError)
        
        // If table doesn't exist, return empty array gracefully
        if (sessionsError.code === '42P01' || sessionsError.message?.includes('does not exist')) {
          console.warn('Database tables not created yet. Please run the migration: 20250825230500_fix_problema_resuelto_policies.sql in Supabase Dashboard.')
          return []
        }
        return []
      }

      // Para cada sesión, obtener sus respuestas
      const sessionsWithResponses = await Promise.all(
        (sessions || []).map(async (session) => {
          const { data: responses, error: responsesError } = await supabase
            .from('problema_resuelto_responses')
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
  async getSession(sessionId: string): Promise<ProblemaResueltoSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      // Obtener sesión
      const { data: session, error: sessionError } = await supabase
        .from('problema_resuelto_sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionError) {
        console.error('Error fetching problema resuelto session:', sessionError)
        return null
      }

      // Obtener respuestas de la sesión
      const { data: responses, error: responsesError } = await supabase
        .from('problema_resuelto_responses')
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
        .from('problema_resuelto_responses')
        .delete()
        .eq('session_id', sessionId)

      if (responsesError) {
        console.error('Error deleting session responses:', responsesError)
        return false
      }

      // Luego eliminar la sesión
      const { error: sessionError } = await supabase
        .from('problema_resuelto_sessions')
        .delete()
        .eq('id', sessionId)

      if (sessionError) {
        console.error('Error deleting problema resuelto session:', sessionError)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteSession:', error)
      return false
    }
  },

  // Calcular estadísticas de resiliencia del usuario
  async getUserResilienceStats(userId: string): Promise<{
    totalSessions: number
    completedSessions: number
    averageResilienceScore: number
    totalProblemsResolved: number
    resilientChoicesPercentage: number
  }> {
    if (!supabase) {
      return {
        totalSessions: 0,
        completedSessions: 0,
        averageResilienceScore: 0,
        totalProblemsResolved: 0,
        resilientChoicesPercentage: 0
      }
    }

    try {
      const sessions = await this.getAllSessions(userId)
      
      const totalSessions = sessions.length
      const completedSessions = sessions.filter(s => s.completed_at).length
      const totalProblemsResolved = sessions.reduce((sum, s) => sum + s.completed_problems, 0)
      const totalResilientResponses = sessions.reduce((sum, s) => sum + s.resilient_responses, 0)
      const totalResponses = sessions.reduce((sum, s) => sum + s.resilient_responses + s.impulsive_responses, 0)
      
      const averageResilienceScore = completedSessions > 0 
        ? sessions.filter(s => s.completed_at).reduce((sum, s) => sum + s.resilience_score, 0) / completedSessions
        : 0

      const resilientChoicesPercentage = totalResponses > 0 
        ? (totalResilientResponses / totalResponses) * 100
        : 0

      return {
        totalSessions,
        completedSessions,
        averageResilienceScore: Math.round(averageResilienceScore * 100) / 100,
        totalProblemsResolved,
        resilientChoicesPercentage: Math.round(resilientChoicesPercentage * 100) / 100
      }
    } catch (error) {
      console.error('Error getting user resilience stats:', error)
      return {
        totalSessions: 0,
        completedSessions: 0,
        averageResilienceScore: 0,
        totalProblemsResolved: 0,
        resilientChoicesPercentage: 0
      }
    }
  }
}