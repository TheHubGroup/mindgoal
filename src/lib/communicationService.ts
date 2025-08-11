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
        .single()

      if (existingSession) {
        return existingSession
      }

      // Si no existe, crear nueva sesión
      if (fetchError && fetchError.code === 'PGRST116') { // No rows returned
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
      // Obtener sesión actual
      const { data: session, error: fetchError } = await supabase
        .from('communication_sessions')
        .select('messages')
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        console.error('Error fetching session for message save:', fetchError)
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
        .eq('user_id', userId)

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
      const { error } = await supabase
        .from('communication_sessions')
        .update({
          messages: messages.map(msg => ({
            id: msg.id,
            text: msg.text,
            sender: msg.sender,
            timestamp: msg.timestamp.toISOString(),
            step: 0
          })),
          completed_at: new Date().toISOString(),
          ai_evaluation: aiEvaluation,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

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
      const { error } = await supabase
        .from('communication_sessions')
        .update({
          messages: [],
          current_step: 0,
          completed_at: null,
          ai_evaluation: null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

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