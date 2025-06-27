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
  Sparkles
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { userResponsesService } from '../lib/userResponsesService'
import { timelineService } from '../lib/timelineService'
import { letterService } from '../lib/letterService'
import { meditationService } from '../lib/meditationService'
import { angerMenuService } from '../lib/angerMenuService'

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
}

const LeaderboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [users, setUsers] = useState<LeaderboardUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserPosition, setCurrentUserPosition] = useState<number | null>(null)
  const [animationPhase, setAnimationPhase] = useState(0)

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

  const loadLeaderboard = async () => {
    if (!supabase) return

    setIsLoading(true)
    try {
      // Obtener todos los usuarios con perfiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching profiles:', error)
        return
      }

      if (!profiles) return

      // Calcular score para cada usuario
      const usersWithScores = await Promise.all(
        profiles.map(async (profile) => {
          const score = await calculateUserScore(profile.id)
          
          return {
            id: profile.id,
            nombre: profile.nombre || 'Usuario',
            apellido: profile.apellido || '',
            grado: profile.grado || 'Sin especificar',
            avatar_url: profile.avatar_url || '',
            email: profile.email,
            score,
            level: getScoreLevel(score),
            position: 0 // Se asignará después del ordenamiento
          }
        })
      )

      // Ordenar por score y asignar posiciones
      const sortedUsers = usersWithScores
        .sort((a, b) => b.score - a.score)
        .map((user, index) => ({
          ...user,
          position: index + 1
        }))

      setUsers(sortedUsers)
      
      // Encontrar posición del usuario actual
      if (user) {
        const currentUser = sortedUsers.find(u => u.id === user.id)
        setCurrentUserPosition(currentUser?.position || null)
      }

    } catch (error) {
      console.error('Error loading leaderboard:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateUserScore = async (userId: string): Promise<number> => {
    try {
      let totalCharacters = 0

      // Respuestas de "Cuéntame quien eres"
      const responses = await userResponsesService.getResponses(userId, 'cuentame_quien_eres')
      responses.forEach(response => {
        totalCharacters += response.response.length
      })

      // Notas de línea de tiempo
      const timelineNotes = await timelineService.getNotes(userId)
      timelineNotes.forEach(note => {
        totalCharacters += note.text.length
      })

      // Cartas personales
      const letters = await letterService.getLetters(userId)
      letters.forEach(letter => {
        totalCharacters += letter.title.length + letter.content.length
      })

      // Sesiones de meditación
      const meditationSessions = await meditationService.getAllSessions(userId)
      meditationSessions.forEach(session => {
        totalCharacters += Math.floor(session.watch_duration / 60) * 50
        if (session.completed_at) {
          totalCharacters += 200
        }
        if (session.reflection_text) {
          totalCharacters += session.reflection_text.length
        }
        if (session.view_count > 1) {
          totalCharacters += (session.view_count - 1) * 100
        }
        if (session.skip_count > 5) {
          totalCharacters = Math.max(0, totalCharacters - (session.skip_count - 5) * 10)
        }
      })

      // Sesiones de "Menú de la Ira"
      const angerMenuSessions = await angerMenuService.getAllSessions(userId)
      angerMenuSessions.forEach(session => {
        totalCharacters += Math.floor(session.watch_duration / 60) * 50
        if (session.completed_at) {
          totalCharacters += 200
        }
        if (session.reflection_text) {
          totalCharacters += session.reflection_text.length
        }
        if (session.selected_techniques && session.selected_techniques.length > 0) {
          totalCharacters += session.selected_techniques.length * 50
        }
        if (session.view_count > 1) {
          totalCharacters += (session.view_count - 1) * 100
        }
        if (session.skip_count > 5) {
          totalCharacters = Math.max(0, totalCharacters - (session.skip_count - 5) * 10)
        }
      })

      return totalCharacters
    } catch (error) {
      console.error('Error calculating score for user:', userId, error)
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
          <UserMenu />
        </div>
      </div>

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
                    <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-2 rounded-full font-bold text-lg mt-2 shadow-lg">
                      {topThree[1].score.toLocaleString()}
                    </div>
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
                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-yellow-900 px-6 py-3 rounded-full font-black text-xl mt-2 shadow-xl">
                      {topThree[0].score.toLocaleString()}
                    </div>
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
                    <div className="bg-gradient-to-r from-amber-600 to-amber-500 text-white px-4 py-2 rounded-full font-bold text-lg mt-2 shadow-lg">
                      {topThree[2].score.toLocaleString()}
                    </div>
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

            <div className="space-y-3">
              {users.map((user, index) => (
                <div
                  key={user.id}
                  className={`bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-4 border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105 ${
                    user.id === user?.id ? 'ring-2 ring-yellow-400 bg-yellow-500 bg-opacity-20' : ''
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Posición */}
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${
                        user.position <= 3 
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900' 
                          : 'bg-gradient-to-br from-gray-600 to-gray-800 text-white'
                      }`}>
                        {user.position <= 3 ? getPodiumIcon(user.position) : user.position}
                      </div>
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-white border-opacity-30 shadow-lg">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
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
                          {user.nombre} {user.apellido}
                        </h3>
                        {user.id === user?.id && (
                          <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-black">
                            TÚ
                          </div>
                        )}
                      </div>
                      <p className="text-white text-opacity-80 text-lg font-medium" style={{ fontFamily: 'Comic Neue' }}>
                        {user.grado}
                      </p>
                    </div>

                    {/* Score y nivel */}
                    <div className="flex-shrink-0 text-right">
                      <div className={`bg-gradient-to-r ${getLevelColor(user.level)} text-white px-6 py-3 rounded-full font-black text-xl mb-2 shadow-lg`}>
                        {user.score.toLocaleString()}
                      </div>
                      <div className="text-white text-opacity-90 text-sm font-bold">
                        {user.level}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {users.length === 0 && (
              <div className="text-center py-12">
                <Trophy size={64} className="mx-auto text-white text-opacity-30 mb-4" />
                <p className="text-white text-opacity-70 text-lg" style={{ fontFamily: 'Comic Neue' }}>
                  No hay usuarios registrados aún
                </p>
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
      </div>
    </div>
  )
}

export default LeaderboardPage