import { supabase } from './supabase'

export interface UserActivityDetails {
  user_id: string
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
  timeline_notes: Array<{
    id: string
    text: string
    emoji: string
    color: string
    section: string
    created_at: string
  }> | null
  user_responses: Array<{
    id: string
    question: string
    response: string
    activity_type: string
    created_at: string
  }> | null
  letters: Array<{
    id: string
    title: string
    content: string
    created_at: string
  }> | null
  meditation_sessions: Array<{
    id: string
    video_id: string
    video_title: string
    watch_duration: number
    completion_percentage: number
    reflection_text: string | null
    completed_at: string | null
    created_at: string
  }> | null
  emotion_matches: Array<{
    id: string
    emotion_name: string
    is_correct: boolean
    explanation_shown: boolean
    created_at: string
  }> | null
  emotion_logs: Array<{
    id: string
    emotion_name: string
    felt_at: string
    intensity: number | null
    notes: string | null
    created_at: string
  }> | null
  anger_management_sessions: Array<{
    id: string
    video_id: string
    video_title: string
    watch_duration: number
    completion_percentage: number
    reflection_text: string | null
    techniques_applied: string[] | null
    completed_at: string | null
    created_at: string
  }> | null
  communication_sessions?: Array<{
    id: string
    messages: any[]
    current_step: number
    completed_at: string | null
    ai_evaluation: string | null
    created_at: string
  }> | null
  semaforo_limites_sessions?: Array<{
    id: string
    completed_at: string | null
    total_situations: number
    completed_situations: number
    responses: any[]
    created_at: string
  }> | null
  problema_resuelto_sessions?: Array<{
    id: string
    completed_at: string | null
    total_problems: number
    completed_problems: number
    resilient_responses: number
    impulsive_responses: number
    resilience_score: number
    responses: any[]
    created_at: string
  }> | null
  dulces_magicos_sessions?: Array<{
    id: string
    completed_at: string | null
    ending_reached: string
    resilience_level: string
    decision_path: string[]
    created_at: string
  }> | null
}

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
        totalCommunicationSessions,
        totalSemaforoSessions,
        totalProblemaResueltoSessions,
        totalDulcesMagicosSessions,
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
  },

  // Get detailed activity data for a specific user
  async getUserActivityDetails(userId: string): Promise<UserActivityDetails | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_activity_details', {
          p_user_id: userId
        })
        .single()

      if (error) {
        console.error('Error getting user activity details:', error)
        return null
      }

      return data as UserActivityDetails
    } catch (error) {
      console.error('Error in getUserActivityDetails:', error)
      return null
    }
  },

  // Get user responses for a specific activity type
  async getUserResponsesByActivity(userId: string, activityType: string): Promise<any[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      const { data, error } = await supabase.rpc('get_user_activity_responses', {
        p_user_id: userId,
        p_activity_type: activityType
      })

      if (error) {
        console.error(`Error fetching ${activityType} responses:`, error)
        return []
      }

      // La función devuelve un array dentro de un objeto JSON
      return data || []
    } catch (error) {
      console.error(`Error in getUserResponsesByActivity for ${activityType}:`, error)
      return []
    }
  },
  
  // Obtener detalles de una actividad específica
  async getUserActivityByType(userId: string, activityType: string): Promise<any[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }
    
    try {
      // Primero obtenemos todos los detalles del usuario
      const userDetails = await this.getUserActivityDetails(userId)
      
      if (!userDetails) {
        return []
      }
      
      // Dependiendo del tipo de actividad, devolvemos los datos correspondientes
      switch (activityType) {
        case 'timeline':
          return userDetails.timeline_notes || []
        case 'responses':
          return userDetails.user_responses || []
        case 'letters':
          return userDetails.letters || []
        case 'meditation':
          return userDetails.meditation_sessions || []
        case 'emotion_matches':
          return userDetails.emotion_matches || []
        case 'emotion_logs':
          return userDetails.emotion_logs || []
        case 'anger':
          return userDetails.anger_management_sessions || []
        case 'communication':
          return userDetails.communication_sessions || []
        case 'semaforo_limites':
          return userDetails.semaforo_limites_sessions || []
        case 'problema_resuelto':
          return userDetails.problema_resuelto_sessions || []
        case 'dulces_magicos':
          return userDetails.dulces_magicos_sessions || []
        default:
          return []
      }
    } catch (error) {
      console.error(`Error in getUserActivityByType for ${activityType}:`, error)
      return []
    }
  }
}

export default dashboardService