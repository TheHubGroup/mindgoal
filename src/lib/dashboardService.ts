import { supabase } from './supabase'

export interface DashboardData {
  id: string
  user_id: string
  profile_info: {
    id: string
    email: string
    nombre: string
    apellido: string
    grado: string
    nombre_colegio: string
    ciudad: string
    pais: string
    edad: number
    sexo: string
    avatar_url: string
    username: string
    created_at: string
  }
  timeline_stats: {
    count: number
    chars: number
    last_activity: string | null
    score: number
  }
  responses_stats: {
    count: number
    chars: number
    last_activity: string | null
    score: number
  }
  letters_stats: {
    count: number
    chars: number
    last_activity: string | null
    score: number
  }
  meditation_stats: {
    count: number
    completed: number
    duration: number
    reflection_chars: number
    last_activity: string | null
    score: number
  }
  emotion_matches_stats: {
    attempts: number
    correct: number
    completed: number
    last_activity: string | null
    score: number
  }
  emotion_logs_stats: {
    count: number
    notes_chars: number
    last_activity: string | null
    score: number
  }
  anger_stats: {
    count: number
    completed: number
    duration: number
    reflection_chars: number
    techniques_count: number
    last_activity: string | null
    score: number
  }
  total_score: number
  level: string
  created_at: string
  last_updated: string
}

export const dashboardService = {
  // Get dashboard data for all users
  async getAllDashboardData(): Promise<DashboardData[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('public_dashboard')
        .select('*')
        .order('total_score', { ascending: false })

      if (error) {
        console.error('Error fetching dashboard data:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllDashboardData:', error)
      return []
    }
  },

  // Get dashboard data for a specific user
  async getUserDashboardData(userId: string): Promise<DashboardData | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('public_dashboard')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null
        }
        console.error('Error fetching user dashboard data:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getUserDashboardData:', error)
      return null
    }
  },

  // Get top users by total score
  async getTopUsers(limit: number = 10): Promise<DashboardData[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('public_dashboard')
        .select('*')
        .order('total_score', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching top users:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getTopUsers:', error)
      return []
    }
  },

  // Get activity statistics across all users
  async getActivityStatistics(): Promise<{
    totalUsers: number
    totalTimelines: number
    totalLetters: number
    totalMeditations: number
    totalEmotionMatches: number
    totalEmotionLogs: number
    totalAngerSessions: number
    averageScore: number
  }> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return {
        totalUsers: 0,
        totalTimelines: 0,
        totalLetters: 0,
        totalMeditations: 0,
        totalEmotionMatches: 0,
        totalEmotionLogs: 0,
        totalAngerSessions: 0,
        averageScore: 0
      }
    }

    try {
      const { data, error } = await supabase
        .from('public_dashboard')
        .select('*')

      if (error) {
        console.error('Error fetching activity statistics:', error)
        return {
          totalUsers: 0,
          totalTimelines: 0,
          totalLetters: 0,
          totalMeditations: 0,
          totalEmotionMatches: 0,
          totalEmotionLogs: 0,
          totalAngerSessions: 0,
          averageScore: 0
        }
      }

      if (!data || data.length === 0) {
        return {
          totalUsers: 0,
          totalTimelines: 0,
          totalLetters: 0,
          totalMeditations: 0,
          totalEmotionMatches: 0,
          totalEmotionLogs: 0,
          totalAngerSessions: 0,
          averageScore: 0
        }
      }

      // Calculate statistics
      const totalUsers = data.length
      let totalTimelines = 0
      let totalLetters = 0
      let totalMeditations = 0
      let totalEmotionMatches = 0
      let totalEmotionLogs = 0
      let totalAngerSessions = 0
      let totalScore = 0

      data.forEach(user => {
        totalTimelines += user.timeline_stats?.count || 0
        totalLetters += user.letters_stats?.count || 0
        totalMeditations += user.meditation_stats?.count || 0
        totalEmotionMatches += user.emotion_matches_stats?.attempts || 0
        totalEmotionLogs += user.emotion_logs_stats?.count || 0
        totalAngerSessions += user.anger_stats?.count || 0
        totalScore += user.total_score || 0
      })

      const averageScore = totalUsers > 0 ? Math.round(totalScore / totalUsers) : 0

      return {
        totalUsers,
        totalTimelines,
        totalLetters,
        totalMeditations,
        totalEmotionMatches,
        totalEmotionLogs,
        totalAngerSessions,
        averageScore
      }
    } catch (error) {
      console.error('Error in getActivityStatistics:', error)
      return {
        totalUsers: 0,
        totalTimelines: 0,
        totalLetters: 0,
        totalMeditations: 0,
        totalEmotionMatches: 0,
        totalEmotionLogs: 0,
        totalAngerSessions: 0,
        averageScore: 0
      }
    }
  },

  // Force update dashboard for current user
  async forceUpdateDashboard(userId: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      // Call the RPC function to update the dashboard
      const { error } = await supabase.rpc('update_dashboard_for_user', {
        p_user_id: userId
      })

      if (error) {
        console.error('Error forcing dashboard update:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in forceUpdateDashboard:', error)
      return false
    }
  }
}

export default dashboardService