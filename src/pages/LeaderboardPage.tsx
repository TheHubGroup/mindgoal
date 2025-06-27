import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import { 
  ArrowLeft, 
  Trophy, 
  Crown, 
  Medal,
  Star,
  Zap,
  Target,
  Award,
  TrendingUp,
  Users,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Info,
  Lock
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { userResponsesService } from '../lib/userResponsesService'
import { timelineService } from '../lib/timelineService'
import { letterService } from '../lib/letterService'
import { meditationService } from '../lib/meditationService'
import { angerManagementService } from '../lib/angerManagementService'
import { emotionMatchService } from '../lib/emotionMatchService'
import { emotionLogService } from '../lib/emotionLogService'

interface LeaderboardUser {
  id: string
  nombre: string
  apellido: string
  grado: string
  avatar_url: string
  email: string
  score: number
  level: string
  position: number
  hasCompletedProfile: boolean
}

const LeaderboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserPosition, setCurrentUserPosition] = useState<number | null>(null)
  const [animationPhase, setAnimationPhase] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [showDebugInfo, setShowDebugInfo] = useState(false)

  useEffect(() => {
    loadLeaderboard()
    
    // Animación de entrada escalonada
    const timer = setTimeout(() => setAnimationPhase(1), 100)
    const timer2 = setTimeout(() => setAnimationPhase(2), 600)
    const timer3 = setTimeout(() => setAnimationPhase(3), 1200)
    
    return () => {
      clearTimeout(timer)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${info}`])
  }

  const loadLeaderboard = async () => {
    if (!supabase) {
      setError("Supabase not configured")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    setDebugInfo([])
    try {
      addDebugInfo("Fetching profiles...")
      // Obtener todos los usuarios con perfiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
        setError(`Error fetching profiles: ${profilesError.message}`)
        addDebugInfo(`Error fetching profiles: ${profilesError.message}`)
        setIsLoading(false)
        return
      }

      if (!profiles || profiles.length === 0) {
        console.log("No profiles found")
        addDebugInfo("No profiles found")
        setUsers([])
        setIsLoading(false)
        return
      }

      addDebugInfo(`Found ${profiles.length} profiles, calculating scores...`)

      // Calcular score para cada usuario
      const usersWithScores = await Promise.all(
        profiles.map(async (profile, index) => {
          try {
            // Solo calcular el score para el usuario actual, para los demás dejarlo en 0
            const isCurrentUser = user && user.id === profile.id;
            addDebugInfo(`Processing user ${index+1}/${profiles.length}: ${profile.email} ${isCurrentUser ? '(current user)' : ''}`)
            
            let score = 0;
            if (isCurrentUser) {
              score = await calculateUserScore(profile.id);
              addDebugInfo(`Score for ${profile.email} (current user): ${score}`);
            } else {
              addDebugInfo(`Not calculating score for other user: ${profile.email}`);
            }
            
            // Check if profile has basic info filled
            const hasCompletedProfile = Boolean(
              profile.nombre && 
              profile.apellido && 
              profile.grado && 
              profile.nombre_colegio
            );
            
            return {
              id: profile.id,
              nombre: profile.nombre || 'Usuario',
              apellido: profile.apellido || '',
              grado: profile.grado || 'Sin especificar',
              avatar_url: profile.avatar_url || '',
              email: profile.email,
              score,
              level: getScoreLevel(score),
              position: 0, // Se asignará después del ordenamiento
              hasCompletedProfile
            }
          } catch (error: any) {
            console.error(`Error processing user ${profile.id}:`, error)
            addDebugInfo(`Error processing user ${profile.email}: ${error.message || 'Unknown error'}`)
            return {
              id: profile.id,
              nombre: profile.nombre || 'Usuario',
              apellido: profile.apellido || '',
              grado: profile.grado || 'Sin especificar',
              avatar_url: profile.avatar_url || '',
              email: profile.email,
              score: 0,
              level: getScoreLevel(0),
              position: 0,
              hasCompletedProfile: false
            }
          }
        })
      );

      // Filtrar usuarios sin información básica
      const usersWithInfo = usersWithScores.filter(user => user.hasCompletedProfile);
      addDebugInfo(`Filtered out ${usersWithScores.length - usersWithInfo.length} users without profile info`);

      // Solo para ordenar, calculamos temporalmente los scores de todos
      const allUsersWithTempScores = await Promise.all(
        usersWithInfo.map(async (userInfo) => {
          if (userInfo.id === user?.id) {
            return userInfo; // Ya tiene el score calculado
          }
          
          try {
            const tempScore = await calculateUserScore(userInfo.id);
            return {
              ...userInfo,
              tempScoreForSorting: tempScore
            };
          } catch (error) {
            return {
              ...userInfo,
              tempScoreForSorting: 0
            };
          }
        })
      );

      // Ordenar por tempScoreForSorting (o score para el usuario actual)
      const sortedUsers = allUsersWithTempScores
        .sort((a, b) => {
          const scoreA = a.tempScoreForSorting !== undefined ? a.tempScoreForSorting : a.score;
          const scoreB = b.tempScoreForSorting !== undefined ? b.tempScoreForSorting : b.score;
          return scoreB - scoreA;
        })
        .map((user, index) => {
          // Eliminar el campo tempScoreForSorting y asignar posición
          const { tempScoreForSorting, ...userWithoutTempScore } = user as any;
          return {
            ...userWithoutTempScore,
            position: index + 1
          };
        });

      addDebugInfo(`Processed ${sortedUsers.length} users for leaderboard`);
      setUsers(sortedUsers);
      
      // Encontrar posición del usuario actual
      if (user) {
        const currentUser = sortedUsers.find(u => u.id === user.id);
        setCurrentUserPosition(currentUser?.position || null);
      }

    } catch (error: any) {
      console.error('Error loading leaderboard:', error)
      setError(`Error loading leaderboard: ${error.message || 'Unknown error'}`)
      addDebugInfo(`Error loading leaderboard: ${error.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const refreshLeaderboard = () => {
    setIsRefreshing(true)
    loadLeaderboard()
  }

  const calculateUserScore = async (userId: string): Promise<number> => {
    try {
      let totalCharacters = 0

      // Obtener respuestas de "Cuéntame quien eres"
      try {
        const responses = await userResponsesService.getResponses(userId, 'cuentame_quien_eres')
        responses.forEach(response => {
          totalCharacters += response.response.length
        })
        addDebugInfo(`User ${userId}: ${responses.length} responses, +${responses.reduce((sum, r) => sum + r.response.length, 0)} points`)
      } catch (error) {
        console.error(`Error getting responses for user ${userId}:`, error)
        addDebugInfo(`Error getting responses for user ${userId}`)
      }

      // Obtener notas de línea de tiempo
      try {
        const timelineNotes = await timelineService.getNotes(userId)
        timelineNotes.forEach(note => {
          totalCharacters += note.text.length
        })
        addDebugInfo(`User ${userId}: ${timelineNotes.length} timeline notes, +${timelineNotes.reduce((sum, n) => sum + n.text.length, 0)} points`)
      } catch (error) {
        console.error(`Error getting timeline notes for user ${userId}:`, error)
        addDebugInfo(`Error getting timeline notes for user ${userId}`)
      }

      // Obtener cartas de "Carta a mí mismo"
      try {
        const letters = await letterService.getLetters(userId)
        letters.forEach(letter => {
          totalCharacters += letter.title.length + letter.content.length
        })
        addDebugInfo(`User ${userId}: ${letters.length} letters, +${letters.reduce((sum, l) => sum + l.title.length + l.content.length, 0)} points`)
      } catch (error) {
        console.error(`Error getting letters for user ${userId}:`, error)
        addDebugInfo(`Error getting letters for user ${userId}`)
      }

      // Obtener sesiones de meditación y reflexiones
      try {
        const meditationSessions = await meditationService.getAllSessions(userId)
        let meditationPoints = 0
        
        meditationSessions.forEach(session => {
          // Puntos por tiempo de meditación (1 punto por minuto visto)
          const timePoints = Math.floor(session.watch_duration / 60) * 50
          meditationPoints += timePoints
          
          // Puntos por completar la meditación
          if (session.completed_at) {
            meditationPoints += 200 // Bonus por completar
          }
          
          // Puntos por reflexión escrita
          if (session.reflection_text) {
            meditationPoints += session.reflection_text.length
          }
          
          // Bonus por múltiples visualizaciones (dedicación)
          if (session.view_count > 1) {
            meditationPoints += (session.view_count - 1) * 100
          }
          
          // Penalización leve por muchos skips (para fomentar la práctica completa)
          if (session.skip_count > 5) {
            meditationPoints = Math.max(0, meditationPoints - (session.skip_count - 5) * 10)
          }
        })
        
        totalCharacters += meditationPoints
        addDebugInfo(`User ${userId}: ${meditationSessions.length} meditation sessions, +${meditationPoints} points`)
      } catch (error) {
        console.error(`Error getting meditation sessions for user ${userId}:`, error)
        addDebugInfo(`Error getting meditation sessions for user ${userId}`)
      }

      // Resultados de "Nombra tus Emociones"
      try {
        const emotionStats = await emotionMatchService.getUserStats(userId)
        const emotionPoints = emotionStats.totalAttempts * 10 + 
                             emotionStats.correctMatches * 30 + 
                             emotionStats.completedEmotions.length * 100
        
        totalCharacters += emotionPoints
        addDebugInfo(`User ${userId}: ${emotionStats.completedEmotions.length} completed emotions, +${emotionPoints} points`)
      } catch (error) {
        console.error(`Error getting emotion stats for user ${userId}:`, error)
        addDebugInfo(`Error getting emotion stats for user ${userId}`)
      }

      // Registros de "Calculadora de Emociones"
      try {
        const emotionLogs = await emotionLogService.getEmotionHistory(userId)
        let emotionLogPoints = emotionLogs.length * 50
        
        emotionLogs.forEach(log => {
          if (log.notes) {
            emotionLogPoints += log.notes.length
          }
        })
        
        totalCharacters += emotionLogPoints
        addDebugInfo(`User ${userId}: ${emotionLogs.length} emotion logs, +${emotionLogPoints} points`)
      } catch (error) {
        console.error(`Error getting emotion logs for user ${userId}:`, error)
        addDebugInfo(`Error getting emotion logs for user ${userId}`)
      }

      // Sesiones de "Menú de la Ira"
      try {
        const angerSessions = await angerManagementService.getAllSessions(userId)
        let angerPoints = 0
        
        angerSessions.forEach(session => {
          // Puntos por tiempo de video visto
          angerPoints += Math.floor(session.watch_duration / 60) * 50
          
          // Puntos por completar el video
          if (session.completed_at) {
            angerPoints += 200
          }
          
          // Puntos por reflexión escrita
          if (session.reflection_text) {
            angerPoints += session.reflection_text.length
          }
          
          // Puntos por técnicas seleccionadas
          if (session.techniques_applied && session.techniques_applied.length > 0) {
            angerPoints += session.techniques_applied.length * 50
          }
          
          // Bonus por múltiples visualizaciones
          if (session.view_count > 1) {
            angerPoints += (session.view_count - 1) * 100
          }
          
          // Penalización por muchos skips
          if (session.skip_count > 5) {
            angerPoints = Math.max(0, angerPoints - (session.skip_count - 5) * 10)
          }
        })
        
        totalCharacters += angerPoints
        addDebugInfo(`User ${userId}: ${angerSessions.length} anger sessions, +${angerPoints} points`)
      } catch (error) {
        console.error(`Error getting anger sessions for user ${userId}:`, error)
        addDebugInfo(`Error getting anger sessions for user ${userId}`)
      }

      // Asegurar que el puntaje sea al menos 10 si el usuario tiene alguna actividad
      if (totalCharacters > 0 && totalCharacters < 10) {
        totalCharacters = 10
      }

      return totalCharacters
    } catch (error) {
      console.error('Error calculating score for user:', userId, error)
      addDebugInfo(`Error calculating total score for user ${userId}: ${error}`)
      return 0
    }
  }

  const getScoreLevel = (score: number): string => {
    if (score >= 2000) return 'Maestro'
    if (score >= 1000) return 'Experto'
    if (score >= 500) return 'Avanzado'
    if (score >= 200) return 'Intermedio'
    return 'Principiante'
  }

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'Maestro': return 'from-purple-500 to-pink-500'
      case 'Experto': return 'from-blue-500 to-indigo-500'
      case 'Avanzado': return 'from-green-500 to-emerald-500'
      case 'Intermedio': return 'from-yellow-500 to-orange-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getPodiumIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown size={32} className="text-yellow-400" />
      case 2: return <Medal size={32} className="text-gray-400" />
      case 3: return <Award size={32} className="text-amber-600" />
      default: return <Trophy size={24} className="text-gray-500" />
    }
  }

  const getPodiumHeight = (position: number): string => {
    switch (position) {
      case 1: return 'h-32'
      case 2: return 'h-24'
      case 3: return 'h-20'
      default: return 'h-16'
    }
  }

  const topThree = users.slice(0, 3)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 text-center border border-white border-opacity-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
            Cargando Leaderboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Efectos de fondo animados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Partículas flotantes */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
        
        {/* Ondas de fondo */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <div className="bg-black bg-opacity-20 backdrop-blur-lg border-b border-white border-opacity-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-white hover:text-gray-300 transition-colors bg-white bg-opacity-10 rounded-full p-3 hover:bg-opacity-20 backdrop-blur-sm"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Trophy size={40} className="text-yellow-400" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Sparkles size={12} className="text-yellow-900" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: 'Fredoka' }}>
                  LEADERBOARD
                </h1>
                <p className="text-white text-opacity-80" style={{ fontFamily: 'Comic Neue' }}>
                  Ranking de estudiantes más activos
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={refreshLeaderboard}
              disabled={isRefreshing}
              className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white rounded-full p-3 transition-all transform hover:scale-105 disabled:opacity-50"
              title="Actualizar leaderboard"
            >
              <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white rounded-full p-3 transition-all transform hover:scale-105"
              title="Mostrar/ocultar información de depuración"
            >
              <Info size={20} />
            </button>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-4 mt-4">
          <div className="bg-red-500 bg-opacity-20 backdrop-blur-sm rounded-xl p-4 border border-red-500 text-white">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <AlertCircle size={20} />
              Error al cargar el leaderboard:
            </h3>
            <p>{error}</p>
            <button 
              onClick={loadLeaderboard}
              className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Debug Info */}
      {showDebugInfo && (
        <div className="max-w-7xl mx-auto px-4 py-4 mt-4">
          <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-xl p-4 border border-blue-500 text-white">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Info size={20} className="text-blue-400" />
              Información de Depuración
            </h3>
            <div className="bg-black bg-opacity-50 p-4 rounded-lg max-h-40 overflow-y-auto text-xs font-mono">
              {debugInfo.length > 0 ? (
                debugInfo.map((info, index) => (
                  <div key={index} className="mb-1">{info}</div>
                ))
              ) : (
                <div>No hay información de depuración disponible</div>
              )}
            </div>
            <div className="mt-2 flex justify-end">
              <button 
                onClick={() => setShowDebugInfo(false)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Podio de los 3 primeros */}
        {topThree.length > 0 && (
          <div className={`mb-12 transform transition-all duration-1000 ${animationPhase >= 1 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Fredoka' }}>
                🏆 TOP 3 ESTUDIANTES 🏆
              </h2>
              <p className="text-white text-opacity-80" style={{ fontFamily: 'Comic Neue' }}>
                Los estudiantes más destacados de la plataforma
              </p>
            </div>

            <div className="flex justify-center items-end gap-8 mb-8">
              {/* Segundo lugar */}
              {topThree[1] && (
                <div className={`transform transition-all duration-700 delay-300 ${animationPhase >= 2 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'}`}>
                  <div className="text-center mb-4">
                    <div className="relative mx-auto mb-3">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-gray-300 shadow-xl bg-gradient-to-br from-gray-100 to-gray-300">
                        {topThree[1].avatar_url ? (
                          <img src={topThree[1].avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600">
                            <Users size={32} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -top-3 -right-3 bg-gray-400 rounded-full p-2 shadow-lg">
                        <Medal size={20} className="text-white" />
                      </div>
                    </div>
                    <h3 className="font-black text-white text-lg" style={{ fontFamily: 'Fredoka' }}>
                      {topThree[1].nombre} {topThree[1].apellido}
                    </h3>
                    <p className="text-gray-300 text-sm font-medium">{topThree[1].grado}</p>
                    
                    {/* Mostrar puntuación solo si es el usuario actual */}
                    {user && topThree[1].id === user.id ? (
                      <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-full font-bold text-lg mt-2 shadow-lg">
                        {topThree[1].score.toLocaleString()} puntos
                      </div>
                    ) : (
                      <div className="bg-gray-700 bg-opacity-50 text-white px-4 py-2 rounded-full font-bold text-lg mt-2 shadow-lg flex items-center justify-center gap-2">
                        <Lock size={14} />
                        <span>Puntuación oculta</span>
                      </div>
                    )}
                  </div>
                  <div className={`bg-gradient-to-t from-gray-500 to-gray-400 ${getPodiumHeight(2)} rounded-t-2xl flex items-center justify-center shadow-2xl border-4 border-gray-300`}>
                    <div className="text-white font-black text-4xl" style={{ fontFamily: 'Fredoka' }}>2</div>
                  </div>
                </div>
              )}

              {/* Primer lugar */}
              {topThree[0] && (
                <div className={`transform transition-all duration-700 delay-100 ${animationPhase >= 2 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'}`}>
                  <div className="text-center mb-4">
                    <div className="relative mx-auto mb-3">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-yellow-400 shadow-2xl bg-gradient-to-br from-yellow-200 to-yellow-400 animate-pulse">
                        {topThree[0].avatar_url ? (
                          <img src={topThree[0].avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600">
                            <Users size={36} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -top-4 -right-4 bg-yellow-400 rounded-full p-3 shadow-xl animate-bounce">
                        <Crown size={24} className="text-yellow-900" />
                      </div>
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-black">
                        CAMPEÓN
                      </div>
                    </div>
                    <h3 className="font-black text-white text-xl" style={{ fontFamily: 'Fredoka' }}>
                      {topThree[0].nombre} {topThree[0].apellido}
                    </h3>
                    <p className="text-yellow-300 text-sm font-bold">{topThree[0].grado}</p>
                    
                    {/* Mostrar puntuación solo si es el usuario actual */}
                    {user && topThree[0].id === user.id ? (
                      <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-yellow-900 px-6 py-3 rounded-full font-black text-xl mt-2 shadow-xl">
                        {topThree[0].score.toLocaleString()} puntos
                      </div>
                    ) : (
                      <div className="bg-yellow-700 bg-opacity-50 text-white px-6 py-3 rounded-full font-bold text-xl mt-2 shadow-xl flex items-center justify-center gap-2">
                        <Lock size={16} />
                        <span>Puntuación oculta</span>
                      </div>
                    )}
                  </div>
                  <div className={`bg-gradient-to-t from-yellow-600 to-yellow-400 ${getPodiumHeight(1)} rounded-t-2xl flex items-center justify-center shadow-2xl border-4 border-yellow-300 relative overflow-hidden`}>
                    <div className="text-white font-black text-5xl" style={{ fontFamily: 'Fredoka' }}>1</div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse" />
                  </div>
                </div>
              )}

              {/* Tercer lugar */}
              {topThree[2] && (
                <div className={`transform transition-all duration-700 delay-500 ${animationPhase >= 2 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'}`}>
                  <div className="text-center mb-4">
                    <div className="relative mx-auto mb-3">
                      <div className="w-18 h-18 rounded-full overflow-hidden border-4 border-amber-500 shadow-xl bg-gradient-to-br from-amber-200 to-amber-400">
                        {topThree[2].avatar_url ? (
                          <img src={topThree[2].avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600">
                            <Users size={28} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="absolute -top-3 -right-3 bg-amber-500 rounded-full p-2 shadow-lg">
                        <Award size={18} className="text-white" />
                      </div>
                    </div>
                    <h3 className="font-black text-white text-lg" style={{ fontFamily: 'Fredoka' }}>
                      {topThree[2].nombre} {topThree[2].apellido}
                    </h3>
                    <p className="text-amber-300 text-sm font-medium">{topThree[2].grado}</p>
                    
                    {/* Mostrar puntuación solo si es el usuario actual */}
                    {user && topThree[2].id === user.id ? (
                      <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-2 rounded-full font-bold text-lg mt-2 shadow-lg">
                        {topThree[2].score.toLocaleString()} puntos
                      </div>
                    ) : (
                      <div className="bg-amber-700 bg-opacity-50 text-white px-4 py-2 rounded-full font-bold text-lg mt-2 shadow-lg flex items-center justify-center gap-2">
                        <Lock size={14} />
                        <span>Puntuación oculta</span>
                      </div>
                    )}
                  </div>
                  <div className={`bg-gradient-to-t from-amber-700 to-amber-500 ${getPodiumHeight(3)} rounded-t-2xl flex items-center justify-center shadow-2xl border-4 border-amber-400`}>
                    <div className="text-white font-black text-4xl" style={{ fontFamily: 'Fredoka' }}>3</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lista completa del leaderboard */}
        <div className={`transform transition-all duration-1000 delay-700 ${animationPhase >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="bg-black bg-opacity-20 backdrop-blur-lg rounded-3xl p-6 border border-white border-opacity-10">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp size={32} className="text-blue-400" />
              <h2 className="text-2xl font-black text-white" style={{ fontFamily: 'Fredoka' }}>
                RANKING COMPLETO
              </h2>
              <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                {users.length} estudiantes
              </div>
            </div>

            {users.length === 0 && !error ? (
              <div className="text-center py-12">
                <Trophy size={64} className="mx-auto text-white text-opacity-30 mb-4" />
                <p className="text-white text-opacity-70 text-lg" style={{ fontFamily: 'Comic Neue' }}>
                  No hay usuarios registrados aún
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((leaderboardUser, index) => (
                  <div
                    key={leaderboardUser.id}
                    className={`bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-4 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105 ${
                      leaderboardUser.id === user?.id ? 'ring-2 ring-yellow-400 bg-yellow-500 bg-opacity-20' : ''
                    }`}
                    style={{
                      animationDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Posición */}
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${
                          leaderboardUser.position <= 3 
                            ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900' 
                            : 'bg-gradient-to-br from-gray-600 to-gray-800 text-white'
                        }`}>
                          {leaderboardUser.position <= 3 ? getPodiumIcon(leaderboardUser.position) : leaderboardUser.position}
                        </div>
                      </div>

                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-white border-opacity-30 shadow-lg">
                          {leaderboardUser.avatar_url ? (
                            <img src={leaderboardUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                              <Users size={24} className="text-white" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Información del usuario */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-black text-white text-xl truncate" style={{ fontFamily: 'Fredoka' }}>
                            {leaderboardUser.nombre} {leaderboardUser.apellido}
                          </h3>
                          {leaderboardUser.id === user?.id && (
                            <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-black">
                              TÚ
                            </div>
                          )}
                        </div>
                        <p className="text-white text-opacity-80 text-lg font-medium" style={{ fontFamily: 'Comic Neue' }}>
                          {leaderboardUser.grado}
                        </p>
                      </div>

                      {/* Score y nivel */}
                      <div className="flex-shrink-0 text-right">
                        {/* Solo mostrar puntaje para el usuario actual */}
                        {user && leaderboardUser.id === user.id ? (
                          <div className={`bg-gradient-to-r ${getLevelColor(leaderboardUser.level)} text-white px-6 py-3 rounded-full font-black text-xl mb-2 shadow-lg`}>
                            {leaderboardUser.score.toLocaleString()} puntos
                          </div>
                        ) : (
                          <div className="bg-gray-700 bg-opacity-60 text-white px-6 py-3 rounded-full font-bold text-lg mb-2 shadow-lg flex items-center justify-center gap-2">
                            <Lock size={16} />
                            <span>Puntuación oculta</span>
                          </div>
                        )}
                        <div className="text-white text-opacity-90 text-sm font-bold">
                          {leaderboardUser.level}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tu posición actual */}
        {currentUserPosition && (
          <div className="mt-8 bg-yellow-500 bg-opacity-20 backdrop-blur-lg rounded-2xl p-6 border-2 border-yellow-400 border-opacity-50">
            <div className="text-center">
              <h3 className="text-xl font-black text-yellow-300 mb-2" style={{ fontFamily: 'Fredoka' }}>
                🎯 TU POSICIÓN ACTUAL
              </h3>
              <div className="text-4xl font-black text-white mb-2">
                #{currentUserPosition}
              </div>
              <p className="text-yellow-200" style={{ fontFamily: 'Comic Neue' }}>
                ¡Sigue participando en actividades para subir en el ranking!
              </p>
            </div>
          </div>
        )}

        {/* Explicación de puntuación */}
        <div className="mt-8 bg-black bg-opacity-20 backdrop-blur-lg rounded-2xl p-6 border border-white border-opacity-10">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
            <Zap size={24} className="text-yellow-400" />
            ¿Cómo se calcula tu puntuación?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white text-opacity-90" style={{ fontFamily: 'Comic Neue' }}>
            <div>
              <h4 className="font-bold text-white mb-2">📝 Actividades de Escritura:</h4>
              <ul className="space-y-1 text-sm">
                <li>• Línea del tiempo: 1 punto por carácter</li>
                <li>• Cuéntame quien eres: 1 punto por carácter</li>
                <li>• Cartas personales: 1 punto por carácter</li>
                <li>• Reflexiones de meditación: 1 punto por carácter</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-2">🧘‍♀️ Actividades Interactivas:</h4>
              <ul className="space-y-1 text-sm">
                <li>• 50 puntos por minuto de meditación</li>
                <li>• 200 puntos bonus por completar actividades</li>
                <li>• 100 puntos por cada re-visualización</li>
                <li>• 30 puntos por cada match correcto en "Nombra tus Emociones"</li>
                <li>• 50 puntos por cada registro en "Calculadora de Emociones"</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-900 bg-opacity-30 rounded-xl border border-blue-500 border-opacity-30">
            <div className="flex items-center gap-2 mb-2">
              <Info size={20} className="text-blue-300" />
              <h4 className="font-bold text-blue-300">Nota sobre puntuaciones</h4>
            </div>
            <p className="text-blue-100 text-sm">
              Por razones de privacidad, solo puedes ver tu propia puntuación. Las puntuaciones de otros usuarios están ocultas, pero el ranking se mantiene según la participación en actividades.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage