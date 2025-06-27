import { supabase } from './supabase'
import { userResponsesService } from './userResponsesService'
import { timelineService } from './timelineService'
import { letterService } from './letterService'
import { meditationService } from './meditationService'
import { angerMenuService } from './angerMenuService'
import { emotionMatchService } from './emotionMatchService'
import { emotionLogService } from './emotionLogService'

export interface LeaderboardUser {
  id: string
  nombre: string
  apellido: string
  grado: string
  avatar_url: string
  email: string
  score: number
  level: string
  position: number
}

export const leaderboardService = {
  // Calcular el puntaje de un usuario basado en todas sus actividades
  async calculateUserScore(userId: string): Promise<number> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return 0
    }

    try {
      let totalCharacters = 0

      // Obtener respuestas de "Cuéntame quien eres"
      const responses = await userResponsesService.getResponses(userId, 'cuentame_quien_eres')
      responses.forEach(response => {
        totalCharacters += response.response.length
      })

      // Obtener notas de línea de tiempo
      const timelineNotes = await timelineService.getNotes(userId)
      timelineNotes.forEach(note => {
        totalCharacters += note.text.length
      })

      // Obtener cartas de "Carta a mí mismo"
      const letters = await letterService.getLetters(userId)
      letters.forEach(letter => {
        totalCharacters += letter.title.length + letter.content.length
      })

      // Obtener sesiones de meditación y reflexiones
      const meditationSessions = await meditationService.getAllSessions(userId)
      meditationSessions.forEach(session => {
        // Puntos por tiempo de meditación (1 punto por minuto visto)
        totalCharacters += Math.floor(session.watch_duration / 60) * 50 // 50 caracteres equivalentes por minuto
        
        // Puntos por completar la meditación
        if (session.completed_at) {
          totalCharacters += 200 // Bonus por completar
        }
        
        // Puntos por reflexión escrita
        if (session.reflection_text) {
          totalCharacters += session.reflection_text.length
        }
        
        // Bonus por múltiples visualizaciones (dedicación)
        if (session.view_count > 1) {
          totalCharacters += (session.view_count - 1) * 100
        }
        
        // Penalización leve por muchos skips (para fomentar la práctica completa)
        if (session.skip_count > 5) {
          totalCharacters = Math.max(0, totalCharacters - (session.skip_count - 5) * 10)
        }
      })

      // Obtener sesiones de "Menú de la Ira"
      const angerMenuSessions = await angerMenuService.getAllSessions(userId)
      angerMenuSessions.forEach(session => {
        // Puntos por tiempo de video visto (1 punto por minuto visto)
        totalCharacters += Math.floor(session.watch_duration / 60) * 50 // 50 caracteres equivalentes por minuto
        
        // Puntos por completar el video
        if (session.completed_at) {
          totalCharacters += 200 // Bonus por completar
        }
        
        // Puntos por reflexión escrita
        if (session.reflection_text) {
          totalCharacters += session.reflection_text.length
        }
        
        // Puntos por técnicas seleccionadas (engagement)
        if (session.selected_techniques && session.selected_techniques.length > 0) {
          totalCharacters += session.selected_techniques.length * 50 // 50 puntos por técnica seleccionada
        }
        
        // Bonus por múltiples visualizaciones (dedicación)
        if (session.view_count > 1) {
          totalCharacters += (session.view_count - 1) * 100
        }
        
        // Penalización leve por muchos skips (para fomentar la práctica completa)
        if (session.skip_count > 5) {
          totalCharacters = Math.max(0, totalCharacters - (session.skip_count - 5) * 10)
        }
      })

      // Resultados de "Nombra tus Emociones"
      const emotionStats = await emotionMatchService.getUserStats(userId)
      totalCharacters += emotionStats.totalAttempts * 10
      totalCharacters += emotionStats.correctMatches * 30
      totalCharacters += emotionStats.completedEmotions.length * 100

      // Registros de "Calculadora de Emociones"
      const emotionLogs = await emotionLogService.getEmotionHistory(userId)
      totalCharacters += emotionLogs.length * 50
      emotionLogs.forEach(log => {
        if (log.notes) {
          totalCharacters += log.notes.length
        }
      })

      return totalCharacters
    } catch (error) {
      console.error('Error calculating user score:', error)
      return 0
    }
  },

  // Obtener el nivel basado en el puntaje
  getScoreLevel(score: number): string {
    if (score >= 2000) return 'Maestro'
    if (score >= 1000) return 'Experto'
    if (score >= 500) return 'Avanzado'
    if (score >= 200) return 'Intermedio'
    return 'Principiante'
  },

  // Actualizar o crear el puntaje público de un usuario
  async updatePublicScore(userId: string, score: number): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      const level = this.getScoreLevel(score)
      
      const { error } = await supabase
        .from('public_scores')
        .upsert({
          user_id: userId,
          score,
          level,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Error updating public score:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updatePublicScore:', error)
      return false
    }
  },

  // Obtener todos los puntajes públicos para el leaderboard
  async getAllPublicScores(): Promise<LeaderboardUser[]> {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty array')
      return []
    }

    try {
      // Obtener todos los puntajes públicos
      const { data: publicScores, error: scoresError } = await supabase
        .from('public_scores')
        .select('*')
        .order('score', { ascending: false })

      if (scoresError) {
        console.error('Error fetching public scores:', scoresError)
        return []
      }

      // Obtener todos los perfiles para combinar con los puntajes
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        return []
      }

      // Combinar puntajes con perfiles
      const leaderboardUsers = publicScores.map((score, index) => {
        const profile = profiles.find(p => p.id === score.user_id) || {
          nombre: 'Usuario',
          apellido: '',
          grado: 'Sin especificar',
          avatar_url: '',
          email: ''
        }

        return {
          id: score.user_id,
          nombre: profile.nombre || 'Usuario',
          apellido: profile.apellido || '',
          grado: profile.grado || 'Sin especificar',
          avatar_url: profile.avatar_url || '',
          email: profile.email || '',
          score: score.score,
          level: score.level,
          position: index + 1
        }
      })

      return leaderboardUsers
    } catch (error) {
      console.error('Error in getAllPublicScores:', error)
      return []
    }
  },

  // Obtener el puntaje público de un usuario específico
  async getUserPublicScore(userId: string): Promise<{ score: number, level: string } | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('public_scores')
        .select('score, level')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return null
        }
        console.error('Error fetching user public score:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getUserPublicScore:', error)
      return null
    }
  },

  // Obtener la posición de un usuario en el leaderboard
  async getUserPosition(userId: string): Promise<number | null> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return null
    }

    try {
      const { data, error } = await supabase
        .from('public_scores')
        .select('user_id, score')
        .order('score', { ascending: false })

      if (error) {
        console.error('Error fetching leaderboard positions:', error)
        return null
      }

      const position = data.findIndex(item => item.user_id === userId)
      return position >= 0 ? position + 1 : null
    } catch (error) {
      console.error('Error in getUserPosition:', error)
      return null
    }
  }
}