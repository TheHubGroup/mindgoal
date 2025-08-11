import { supabase } from './supabase'

export interface CommunicationSession {
  id?: string
  user_id?: string
  messages: Array<{
    id: string
    text: string
    sender: 'sofia' | 'user'
    timestamp: string
    step: number
  }>
  current_step: number
  completed_at?: string | null
  ai_evaluation?: string | null
  created_at?: string
  updated_at?: string
}

export const communicationService = {
  // Obtener o crear sesión de comunicación
  async getOrCreateSession(userId: string): Promise<CommunicationSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      // Intentar obtener sesión existente
      const { data: existingSession, error: fetchError } = await supabase
        .from('communication_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingSession) {
        return existingSession
      }

      // Si no existe, crear nueva sesión
      if (!existingSession) {
        const { data: newSession, error: createError } = await supabase
          .from('communication_sessions')
          .insert([{
            user_id: userId,
            messages: [],
            current_step: 0
          }])
          .select()
          .single()

        if (createError) {
          console.error('Error creating communication session:', createError)
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

  // Guardar mensaje del usuario
  async saveUserMessage(userId: string, messageText: string, step: number): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      // Obtener sesión activa más reciente
      const { data: session, error: fetchError } = await supabase
        .from('communication_sessions')
        .select('id, messages')
        .eq('user_id', userId)
        .is('completed_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching session for message save:', fetchError)
        return false
      }

      if (!session) {
        console.error('No active session found for user')
        return false
      }

      // Agregar nuevo mensaje
      const newMessage = {
        id: Date.now().toString(),
        text: messageText,
        sender: 'user',
        timestamp: new Date().toISOString(),
        step: step
      }

      const updatedMessages = [...(session.messages || []), newMessage]

      // Actualizar sesión
      const { error: updateError } = await supabase
        .from('communication_sessions')
        .update({
          messages: updatedMessages,
          current_step: step,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id)

      if (updateError) {
        console.error('Error updating session with user message:', updateError)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in saveUserMessage:', error)
      return false
    }
  },

  // Completar sesión con evaluación de IA
  async completeSession(userId: string, messages: any[], aiEvaluation: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      // Obtener sesión activa más reciente
      const { data: session, error: fetchError } = await supabase
        .from('communication_sessions')
        .select('id')
        .eq('user_id', userId)
        .is('completed_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching session for completion:', fetchError)
        return false
      }

      if (!session) {
        console.error('No active session found for user')
        return false
      }

      // Completar sesión específica por ID
      const { error } = await supabase
        .from('communication_sessions')
        .update({
          messages: messages,
          completed_at: new Date().toISOString(),
          ai_evaluation: aiEvaluation,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id)

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

  // Reiniciar sesión
  async resetSession(userId: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      // Obtener sesión activa más reciente
      const { data: session, error: fetchError } = await supabase
        .from('communication_sessions')
        .select('id')
        .eq('user_id', userId)
        .is('completed_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchError) {
        console.error('Error fetching session for reset:', fetchError)
        return false
      }

      if (!session) {
        console.error('No active session found for user')
        return false
      }

      // Reiniciar sesión específica por ID
      const { error } = await supabase
        .from('communication_sessions')
        .update({
          messages: [],
          current_step: 0,
          completed_at: null,
          ai_evaluation: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.id)

      if (error) {
        console.error('Error resetting session:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in resetSession:', error)
      return false
    }
  },

  // Crear nueva sesión
  async createNewSession(userId: string): Promise<CommunicationSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data: newSession, error: createError } = await supabase
        .from('communication_sessions')
        .insert([{
          user_id: userId,
          messages: [],
          current_step: 0
        }])
        .select()
        .single()

      if (createError) {
        console.error('Error creating new communication session:', createError)
        return null
      }

      return newSession
    } catch (error) {
      console.error('Error in createNewSession:', error)
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
      const { error } = await supabase
        .from('communication_sessions')
        .delete()
        .eq('id', sessionId)

      if (error) {
        console.error('Error deleting communication session:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteSession:', error)
      return false
    }
  },

  // Obtener todas las sesiones del usuario (para estadísticas)
  async getAllSessions(userId: string): Promise<CommunicationSession[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('communication_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching communication sessions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllSessions:', error)
      return []
    }
  }
}