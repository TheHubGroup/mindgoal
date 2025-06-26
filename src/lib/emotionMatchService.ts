import { supabase } from './supabase'

export interface EmotionMatch {
  id?: string
  user_id?: string
  emotion_name: string
  is_correct: boolean
  explanation_shown: boolean
  created_at?: string
}

export const emotionMatchService = {
  // Guardar resultado de un match
  async saveMatchResult(emotionName: string, isCorrect: boolean, explanationShown: boolean = false): Promise<EmotionMatch | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.warn('User not authenticated')
        return null
      }

      const matchData = {
        user_id: user.id,
        emotion_name: emotionName,
        is_correct: isCorrect,
        explanation_shown: explanationShown
      }

      const { data, error } = await supabase
        .from('emotion_matches')
        .insert([matchData])
        .select()
        .single()

      if (error) {
        console.error('Error saving emotion match:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in saveMatchResult:', error)
      return null
    }
  },

  // Obtener todos los matches del usuario
  async getUserMatches(userId: string): Promise<EmotionMatch[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('emotion_matches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching emotion matches:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getUserMatches:', error)
      return []
    }
  },

  // Obtener estadísticas del usuario
  async getUserStats(userId: string): Promise<{
    totalAttempts: number
    correctMatches: number
    accuracy: number
    completedEmotions: string[]
  }> {
    if (!supabase) {
      return {
        totalAttempts: 0,
        correctMatches: 0,
        accuracy: 0,
        completedEmotions: []
      }
    }

    try {
      const matches = await this.getUserMatches(userId)
      
      const totalAttempts = matches.length
      const correctMatches = matches.filter(match => match.is_correct).length
      const accuracy = totalAttempts > 0 ? Math.round((correctMatches / totalAttempts) * 100) : 0
      
      // Obtener emociones que ha completado correctamente
      const completedEmotions = [...new Set(
        matches
          .filter(match => match.is_correct)
          .map(match => match.emotion_name)
      )]

      return {
        totalAttempts,
        correctMatches,
        accuracy,
        completedEmotions
      }
    } catch (error) {
      console.error('Error getting user stats:', error)
      return {
        totalAttempts: 0,
        correctMatches: 0,
        accuracy: 0,
        completedEmotions: []
      }
    }
  }
}