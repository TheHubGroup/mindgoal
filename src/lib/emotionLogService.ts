import { supabase } from './supabase'

export interface UserEmotionLog {
  id?: string
  user_id?: string
  emotion_name: string
  felt_at?: string // ISO string
  intensity?: number // 1-5
  notes?: string
  created_at?: string
  updated_at?: string
}

export const emotionLogService = {
  async logEmotion(emotionEntry: Omit<UserEmotionLog, 'id' | 'created_at' | 'updated_at'>): Promise<UserEmotionLog | null> {
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

      const entryWithUserId = {
        ...emotionEntry,
        user_id: user.id,
        felt_at: emotionEntry.felt_at || new Date().toISOString(),
        notes: emotionEntry.notes || null
      }

      const { data, error } = await supabase
        .from('user_emotion_log')
        .insert([entryWithUserId])
        .select()
        .single()

      if (error) {
        console.error('Error logging emotion:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in logEmotion:', error)
      return null
    }
  },

  async getEmotionHistory(userId: string, startDate?: string): Promise<UserEmotionLog[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      let query = supabase
        .from('user_emotion_log')
        .select('*')
        .eq('user_id', userId)
        .order('felt_at', { ascending: false })

      if (startDate) {
        query = query.gte('felt_at', startDate)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching emotion history:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getEmotionHistory:', error)
      return []
    }
  },

  async getLastEmotionLogDate(userId: string): Promise<string | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('user_emotion_log')
        .select('felt_at')
        .eq('user_id', userId)
        .order('felt_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error('Error fetching last emotion log date:', error)
        return null
      }

      return data ? data.felt_at : null
    } catch (error) {
      console.error('Error in getLastEmotionLogDate:', error)
      return null
    }
  },

  async getEmotionStats(userId: string): Promise<{
    totalLogs: number
    uniqueEmotions: number
    mostFrequentEmotion: string | null
    lastLogDate: string | null
  }> {
    if (!supabase) {
      return {
        totalLogs: 0,
        uniqueEmotions: 0,
        mostFrequentEmotion: null,
        lastLogDate: null
      }
    }

    try {
      const logs = await this.getEmotionHistory(userId)
      
      const totalLogs = logs.length
      const uniqueEmotions = new Set(logs.map(log => log.emotion_name)).size
      
      // Calcular emoción más frecuente
      const emotionCounts: Record<string, number> = {}
      logs.forEach(log => {
        emotionCounts[log.emotion_name] = (emotionCounts[log.emotion_name] || 0) + 1
      })
      
      const mostFrequentEmotion = Object.keys(emotionCounts).length > 0 
        ? Object.keys(emotionCounts).reduce((a, b) => emotionCounts[a] > emotionCounts[b] ? a : b)
        : null
      
      const lastLogDate = logs.length > 0 ? logs[0].felt_at || null : null

      return {
        totalLogs,
        uniqueEmotions,
        mostFrequentEmotion,
        lastLogDate
      }
    } catch (error) {
      console.error('Error getting emotion stats:', error)
      return {
        totalLogs: 0,
        uniqueEmotions: 0,
        mostFrequentEmotion: null,
        lastLogDate: null
      }
    }
  }
}