import { supabase } from './supabase'

export interface EmotionMatch {
  id?: string
  user_id?: string
  emotion_name: string
  is_correct: boolean
  explanation_shown: boolean
  created_at?: string
}

export interface UserProgress {
  completedEmotions: string[]
  totalAttempts: number
  correctMatches: number
  accuracy: number
  lastPlayedAt: string
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

  // Obtener emociones completadas correctamente (para continuar el juego)
  async getCompletedEmotions(userId: string): Promise<string[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('emotion_matches')
        .select('emotion_name')
        .eq('user_id', userId)
        .eq('is_correct', true)
        .eq('explanation_shown', true) // Solo contar las que vieron la explicación completa

      if (error) {
        console.error('Error fetching completed emotions:', error)
        return []
      }

      // Obtener emociones únicas
      const uniqueEmotions = [...new Set(data?.map(match => match.emotion_name) || [])]
      return uniqueEmotions
    } catch (error) {
      console.error('Error in getCompletedEmotions:', error)
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
      const completedEmotions = await this.getCompletedEmotions(userId)
      
      const totalAttempts = matches.length
      const correctMatches = matches.filter(match => match.is_correct).length
      const accuracy = totalAttempts > 0 ? Math.round((correctMatches / totalAttempts) * 100) : 0

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
  },

  // Obtener progreso completo del usuario
  async getUserProgress(userId: string): Promise<UserProgress> {
    try {
      const stats = await this.getUserStats(userId)
      const matches = await this.getUserMatches(userId)
      
      const lastMatch = matches.length > 0 ? matches[0] : null
      const lastPlayedAt = lastMatch?.created_at || new Date().toISOString()

      return {
        completedEmotions: stats.completedEmotions,
        totalAttempts: stats.totalAttempts,
        correctMatches: stats.correctMatches,
        accuracy: stats.accuracy,
        lastPlayedAt
      }
    } catch (error) {
      console.error('Error getting user progress:', error)
      return {
        completedEmotions: [],
        totalAttempts: 0,
        correctMatches: 0,
        accuracy: 0,
        lastPlayedAt: new Date().toISOString()
      }
    }
  },

  // Verificar si una emoción específica ya fue completada
  async isEmotionCompleted(userId: string, emotionName: string): Promise<boolean> {
    try {
      const completedEmotions = await this.getCompletedEmotions(userId)
      return completedEmotions.includes(emotionName)
    } catch (error) {
      console.error('Error checking if emotion is completed:', error)
      return false
    }
  },

  // Resetear progreso del usuario (para empezar de nuevo)
  async resetUserProgress(userId: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      const { error } = await supabase
        .from('emotion_matches')
        .delete()
        .eq('user_id', userId)

      if (error) {
        console.error('Error resetting user progress:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in resetUserProgress:', error)
      return false
    }
  }
}