import { supabase } from './supabase'

export interface Letter {
  id?: string
  user_id?: string
  title: string
  content: string
  created_at?: string
  updated_at?: string
}

export const letterService = {
  // Obtener todas las cartas del usuario
  async getLetters(userId: string): Promise<Letter[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('letters')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching letters:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getLetters:', error)
      return []
    }
  },

  // Crear una nueva carta
  async createLetter(letter: Omit<Letter, 'id' | 'created_at' | 'updated_at'>): Promise<Letter | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('letters')
        .insert([letter])
        .select()
        .single()

      if (error) {
        console.error('Error creating letter:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createLetter:', error)
      return null
    }
  },

  // Actualizar una carta existente
  async updateLetter(id: string, updates: Partial<Letter>): Promise<Letter | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('letters')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating letter:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateLetter:', error)
      return null
    }
  },

  // Eliminar una carta
  async deleteLetter(id: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      const { error } = await supabase
        .from('letters')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting letter:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteLetter:', error)
      return false
    }
  }
}