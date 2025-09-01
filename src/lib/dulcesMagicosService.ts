import { supabase } from './supabase'

export interface DulcesMagicosSession {
  id?: string
  user_id?: string
  completed_at?: string
  ending_reached: 'ending_sad' | 'ending_resilient' | 'ending_sharing' | 'ending_control'
  resilience_level: 'Nada Resiliente' | 'Poco Resiliente' | 'Resiliente' | 'Muy Resiliente'
  decision_path: string[] // Array of decisions made: ['A', 'A1'] or ['B', 'B2'], etc.
  created_at?: string
  updated_at?: string
}

export const dulcesMagicosService = {
  // Crear o reemplazar sesión del usuario
  async saveSession(userId: string, sessionData: Omit<DulcesMagicosSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<DulcesMagicosSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      // Primero eliminar sesión anterior si existe (solo una sesión por usuario)
      await supabase
        .from('dulces_magicos_sessions')
        .delete()
        .eq('user_id', userId)

      // Crear nueva sesión
      const { data, error } = await supabase
        .from('dulces_magicos_sessions')
        .insert([{
          user_id: userId,
          ...sessionData
        }])
        .select()
        .single()

      if (error) {
        console.error('Error saving dulces magicos session:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in saveSession:', error)
      return null
    }
  },

  // Obtener la sesión más reciente del usuario
  async getLatestSession(userId: string): Promise<DulcesMagicosSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('dulces_magicos_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error fetching latest dulces magicos session:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getLatestSession:', error)
      return null
    }
  },

  // Obtener todas las sesiones del usuario (para historial)
  async getAllSessions(userId: string): Promise<DulcesMagicosSession[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('dulces_magicos_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching dulces magicos sessions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllSessions:', error)
      return []
    }
  },

  // Obtener estadísticas del usuario
  async getUserStats(userId: string): Promise<{
    totalSessions: number
    lastSession: DulcesMagicosSession | null
    resilienceLevels: Record<string, number>
    mostCommonEnding: string | null
  }> {
    try {
      const sessions = await this.getAllSessions(userId)
      
      const totalSessions = sessions.length
      const lastSession = sessions.length > 0 ? sessions[0] : null
      
      // Contar niveles de resiliencia
      const resilienceLevels: Record<string, number> = {
        'Nada Resiliente': 0,
        'Poco Resiliente': 0,
        'Resiliente': 0,
        'Muy Resiliente': 0
      }
      
      sessions.forEach(session => {
        resilienceLevels[session.resilience_level]++
      })
      
      // Encontrar el final más común
      const endingCounts: Record<string, number> = {}
      sessions.forEach(session => {
        endingCounts[session.ending_reached] = (endingCounts[session.ending_reached] || 0) + 1
      })
      
      const mostCommonEnding = Object.keys(endingCounts).length > 0 
        ? Object.keys(endingCounts).reduce((a, b) => endingCounts[a] > endingCounts[b] ? a : b)
        : null

      return {
        totalSessions,
        lastSession,
        resilienceLevels,
        mostCommonEnding
      }
    } catch (error) {
      console.error('Error getting user stats:', error)
      return {
        totalSessions: 0,
        lastSession: null,
        resilienceLevels: {
          'Nada Resiliente': 0,
          'Poco Resiliente': 0,
          'Resiliente': 0,
          'Muy Resiliente': 0
        },
        mostCommonEnding: null
      }
    }
  },

  // Mapear finales a niveles de resiliencia
  getResilienceLevel(ending: string): 'Nada Resiliente' | 'Poco Resiliente' | 'Resiliente' | 'Muy Resiliente' {
    switch (ending) {
      case 'ending_sad': return 'Nada Resiliente'        // Final 1: No pedir ayuda
      case 'ending_resilient': return 'Poco Resiliente'  // Final 2: Hablar con mamá
      case 'ending_sharing': return 'Muy Resiliente'     // Final 3: Compartir con amigos
      case 'ending_control': return 'Resiliente'         // Final 4: Tomar control
      default: return 'Nada Resiliente'
    }
  },

  // Mapear decisiones a path
  getDecisionPath(ending: string): string[] {
    switch (ending) {
      case 'ending_sad': return ['A', 'A1']        // Seguir comiendo → No contar a nadie
      case 'ending_resilient': return ['A', 'A2']  // Seguir comiendo → Hablar con mamá
      case 'ending_sharing': return ['B', 'B1']    // Parar y agua → Compartir dulces
      case 'ending_control': return ['B', 'B2']    // Parar y agua → Tirar dulces
      default: return []
    }
  },

  // Obtener descripción del final
  getEndingDescription(ending: string): string {
    switch (ending) {
      case 'ending_sad': return 'Martín se queda triste y solo, aprende que ocultar el problema no lo ayuda'
      case 'ending_resilient': return 'Su mamá lo ayuda a descansar y le explica la importancia de cuidar lo que come'
      case 'ending_sharing': return 'Martín comparte los dulces con sus amigos otro día y todos disfrutan sin exagerar'
      case 'ending_control': return 'Martín aprende que no todo se soluciona botando, pero se siente mejor por haber tomado el control'
      default: return 'Final desconocido'
    }
  }
}