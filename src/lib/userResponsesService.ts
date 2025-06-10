import { supabase } from './supabase'

export interface UserResponse {
  id?: string
  user_id?: string
  question: string
  response: string
  activity_type: string
  created_at?: string
  updated_at?: string
}

export const userResponsesService = {
  // Obtener todas las respuestas del usuario para una actividad específica
  async getResponses(userId: string, activityType: string = 'cuentame_quien_eres'): Promise<UserResponse[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('user_responses')
        .select('*')
        .eq('user_id', userId)
        .eq('activity_type', activityType)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user responses:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getResponses:', error)
      return []
    }
  },

  // Crear una nueva respuesta
  async createResponse(response: Omit<UserResponse, 'id' | 'created_at' | 'updated_at'>): Promise<UserResponse | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('user_responses')
        .insert([response])
        .select()
        .single()

      if (error) {
        console.error('Error creating user response:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createResponse:', error)
      return null
    }
  },

  // Actualizar una respuesta existente
  async updateResponse(id: string, updates: Partial<UserResponse>): Promise<UserResponse | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('user_responses')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating user response:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateResponse:', error)
      return null
    }
  },

  // Eliminar una respuesta
  async deleteResponse(id: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      const { error } = await supabase
        .from('user_responses')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting user response:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteResponse:', error)
      return false
    }
  },

  // Guardar múltiples respuestas de una vez
  async saveMultipleResponses(responses: Omit<UserResponse, 'id' | 'created_at' | 'updated_at'>[]): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      const { error } = await supabase
        .from('user_responses')
        .insert(responses)

      if (error) {
        console.error('Error saving multiple responses:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in saveMultipleResponses:', error)
      return false
    }
  }
}