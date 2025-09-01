import { supabase } from './supabase'
import { userResponsesService } from './userResponsesService'
import { timelineService } from './timelineService'
import { letterService } from './letterService'
import { meditationService } from './meditationService'
import { angerMenuService } from './angerMenuService'
import { emotionMatchService } from './emotionMatchService'
import { emotionLogService } from './emotionLogService'
import { communicationService } from './communicationService'
import { semaforoLimitesService } from './semaforoLimitesService'
import { problemaResueltoService } from './problemaResueltoService'
import { dulcesMagicosService } from './dulcesMagicosService'

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
  last_updated?: string
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

      // Obtener sesiones de "La Comunicación"
      const communicationSessions = await communicationService.getAllSessions(userId)
      communicationSessions.forEach(session => {
        // Puntos por mensajes escritos (1 punto por carácter)
        if (session.messages && Array.isArray(session.messages)) {
          session.messages.forEach((message: any) => {
            if (message.sender === 'user' && message.text) {
              totalCharacters += message.text.length
            }
          })
        }
        
        // Bonus por completar la conversación
        if (session.completed_at) {
          totalCharacters += 300 // Bonus por completar la actividad de comunicación
        }
        
        // Bonus por evaluación de IA generada
        if (session.ai_evaluation) {
          totalCharacters += 100 // Bonus por recibir evaluación
        }
      })
      
      // Obtener sesiones de "Semáforo de los Límites"
      const semaforoSessions = await semaforoLimitesService.getAllSessions(userId)
      semaforoSessions.forEach(session => {
        // Puntos por situaciones respondidas (50 puntos por situación)
        totalCharacters += session.completed_situations * 50
        
        // Bonus por completar toda la sesión
        if (session.completed_at) {
          totalCharacters += 200 // Bonus por completar todas las situaciones
        }
      })
      
      // Obtener sesiones de "Problema Resuelto"
      const problemaResueltoSessions = await problemaResueltoService.getAllSessions(userId)
      problemaResueltoSessions.forEach(session => {
        // Puntos por problemas resueltos (100 puntos por problema)
        totalCharacters += session.completed_problems * 100
        
        // Bonus por completar toda la sesión
        if (session.completed_at) {
          totalCharacters += 300 // Bonus por completar todos los problemas
        }
        
        // Bonus adicional según el nivel de resiliencia
        const resilienceBonus = Math.round(session.resilience_score * 2) // 2 puntos por cada % de resiliencia
        totalCharacters += resilienceBonus
        
        // Bonus por respuestas resilientes
        totalCharacters += session.resilient_responses * 50 // 50 puntos por respuesta resiliente
      })
      
      // Obtener sesiones de "Dulces Mágicos"
      const dulcesMagicosSessions = await dulcesMagicosService.getAllSessions(userId)
      dulcesMagicosSessions.forEach(session => {
        // Puntos base por completar la actividad
        totalCharacters += 300 // Bonus por completar la historia interactiva
        
        // Bonus adicional según el nivel de resiliencia alcanzado
        switch (session.resilience_level) {
          case 'Muy Resiliente':
            totalCharacters += 200 // Bonus máximo por mejor final
            break
          case 'Resiliente':
            totalCharacters += 150 // Bonus alto
            break
          case 'Poco Resiliente':
            totalCharacters += 100 // Bonus moderado
            break
          case 'Nada Resiliente':
            totalCharacters += 50 // Bonus mínimo (aún así completó la actividad)
            break
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
          position: index + 1,
          last_updated: score.last_updated
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

  // Actualizar automáticamente el puntaje del usuario actual
  async autoUpdateCurrentUserScore(userId: string): Promise<boolean> {
    if (!supabase || !userId) {
      console.warn('Supabase not configured or no user ID provided')
      return false
    }

    try {
      // Calcular el puntaje actual del usuario
      const score = await this.calculateUserScore(userId)
      
      // Actualizar el puntaje en la tabla pública
      await this.updatePublicScore(userId, score)
      
      console.log('✅ Score auto-updated successfully:', score)
      return true
    } catch (error) {
      console.error('Error auto-updating user score:', error)
      return false
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
  },

  // Actualizar los puntajes de todos los usuarios (función administrativa)
  async updateAllPublicScores(): Promise<boolean> {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    try {
      // Llamar a la función RPC que actualiza todos los puntajes
      const { error } = await supabase.rpc('update_all_public_scores')

      if (error) {
        console.error('Error updating all public scores:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateAllPublicScores:', error)
      return false
    }
  }
}