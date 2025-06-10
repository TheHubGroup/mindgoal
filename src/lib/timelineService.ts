import { supabase } from './supabase'

export interface TimelineNote {
  id?: string
  user_id?: string
  text: string
  emoji: string
  color: string
  shape: string
  font: string
  section: 'pasado' | 'presente' | 'futuro'
  position_x: number
  position_y: number
  created_at?: string
  updated_at?: string
}

export const timelineService = {
  // Obtener todas las notas del usuario
  async getNotes(userId: string): Promise<TimelineNote[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('timeline_notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching timeline notes:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getNotes:', error)
      return []
    }
  },

  // Crear una nueva nota
  async createNote(note: Omit<TimelineNote, 'id' | 'created_at' | 'updated_at'>): Promise<TimelineNote | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    // Mejorar posición inicial de las notas
    const improvedNote = {
      ...note,
      position_x: Math.max(20, Math.min(note.position_x, 250)), // Limitar entre 20 y 250px
      position_y: Math.max(20, Math.min(note.position_y, 180))  // Limitar entre 20 y 180px
    }

    try {
      const { data, error } = await supabase
        .from('timeline_notes')
        .insert([improvedNote])
        .select()
        .single()

      if (error) {
        console.error('Error creating timeline note:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createNote:', error)
      return null
    }
  },

  // Actualizar una nota existente
  async updateNote(id: string, updates: Partial<TimelineNote>): Promise<TimelineNote | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('timeline_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating timeline note:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateNote:', error)
      return null
    }
  },

  // Eliminar una nota
  async deleteNote(id: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      const { error } = await supabase
        .from('timeline_notes')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting timeline note:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteNote:', error)
      return false
    }
  },

  // Actualizar posición de una nota (para drag & drop)
  async updateNotePosition(id: string, x: number, y: number): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      const { error } = await supabase
        .from('timeline_notes')
        .update({ position_x: x, position_y: y })
        .eq('id', id)

      if (error) {
        console.error('Error updating note position:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateNotePosition:', error)
      return false
    }
  }
}