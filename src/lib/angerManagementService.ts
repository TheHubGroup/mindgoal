import { supabase } from './supabase'

export interface AngerManagementSession {
  id?: string
  user_id?: string
  video_id: string
  video_title: string
  started_at?: string
  completed_at?: string | null
  watch_duration: number // in seconds
  total_duration: number // total video duration in seconds
  completion_percentage: number
  reflection_text?: string
  techniques_applied?: string[] // array of selected techniques
  skip_count: number // number of times skipped forward
  last_position: number // last watched position in seconds
  view_count: number // number of times viewed
  created_at?: string
  updated_at?: string
}

export const angerManagementService = {
  // Get or create the unique session for a user and video
  async getOrCreateSession(userId: string, videoId: string, videoTitle: string): Promise<AngerManagementSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      // First try to get the existing session
      const { data: existingSession, error: fetchError } = await supabase
        .from('anger_management_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('video_id', videoId)
        .single()

      if (existingSession) {
        return existingSession
      }

      // If no session exists, create a new one
      if (fetchError && fetchError.code === 'PGRST116') { // No rows returned
        const { data: newSession, error: createError } = await supabase
          .from('anger_management_sessions')
          .insert([{
            user_id: userId,
            video_id: videoId,
            video_title: videoTitle,
            watch_duration: 0,
            total_duration: 0,
            completion_percentage: 0,
            skip_count: 0,
            last_position: 0,
            view_count: 0,
            techniques_applied: []
          }])
          .select()
          .single()

        if (createError) {
          console.error('Error creating anger management session:', createError)
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

  // Update the session (UPSERT)
  async updateSession(userId: string, videoId: string, videoTitle: string, updates: Partial<AngerManagementSession>): Promise<AngerManagementSession | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('anger_management_sessions')
        .upsert({
          user_id: userId,
          video_id: videoId,
          video_title: videoTitle,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,video_id'
        })
        .select()
        .single()

      if (error) {
        console.error('Error updating anger management session:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateSession:', error)
      return null
    }
  },

  // Record that the user skipped forward
  async recordSkip(userId: string, videoId: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      // Get the current session
      const { data: session, error: fetchError } = await supabase
        .from('anger_management_sessions')
        .select('skip_count')
        .eq('user_id', userId)
        .eq('video_id', videoId)
        .single()

      if (fetchError) {
        console.error('Error fetching session for skip:', fetchError)
        return false
      }

      // Increment the skip counter
      const { error: updateError } = await supabase
        .from('anger_management_sessions')
        .update({ 
          skip_count: (session.skip_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('video_id', videoId)

      if (updateError) {
        console.error('Error updating skip count:', updateError)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in recordSkip:', error)
      return false
    }
  },

  // Restart the session to watch the video again
  async restartSession(userId: string, videoId: string): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      // Get the current session to increment view_count
      const { data: session, error: fetchError } = await supabase
        .from('anger_management_sessions')
        .select('view_count')
        .eq('user_id', userId)
        .eq('video_id', videoId)
        .single()

      if (fetchError) {
        console.error('Error fetching session for restart:', fetchError)
        return false
      }

      // Reset the session but keep the history
      const { error: updateError } = await supabase
        .from('anger_management_sessions')
        .update({
          started_at: new Date().toISOString(),
          completed_at: null,
          last_position: 0,
          view_count: (session.view_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('video_id', videoId)

      if (updateError) {
        console.error('Error restarting session:', updateError)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in restartSession:', error)
      return false
    }
  },

  // Save selected techniques
  async saveTechniques(userId: string, videoId: string, techniques: string[]): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      const { error } = await supabase
        .from('anger_management_sessions')
        .update({ 
          techniques_applied: techniques,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('video_id', videoId)

      if (error) {
        console.error('Error saving techniques:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in saveTechniques:', error)
      return false
    }
  },

  // Get all sessions for a user (for statistics)
  async getAllSessions(userId: string): Promise<AngerManagementSession[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      const { data, error } = await supabase
        .from('anger_management_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Error fetching anger management sessions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllSessions:', error)
      return []
    }
  }
}