import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { leaderboardService } from '../lib/leaderboardService'
import { dashboardService } from '../lib/dashboardService'
import UserMenu from '../components/UserMenu'
import WelcomeModal from '../components/WelcomeModal'
import { 
  Clock, 
  Heart,
  Mail,
  Brain,
  Sparkles,
  Star,
  Palette,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Trophy,
  Flame
} from 'lucide-react'
import { timelineService } from '../lib/timelineService'
import { userResponsesService } from '../lib/userResponsesService'
import { letterService } from '../lib/letterService'
import { meditationService } from '../lib/meditationService'
import { angerMenuService } from '../lib/angerMenuService'

interface ActivityStatus {
  hasData: boolean
  count: number
  lastActivity?: string
}

const HomePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const [activityStatuses, setActivityStatuses] = useState<Record<string, ActivityStatus>>({})
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true)

  // Mostrar modal de bienvenida cuando el usuario inicia sesión
  useEffect(() => {
    if (user && !profileLoading) {
      setShowWelcomeModal(true)
      
      // Auto-update user score when homepage loads
      if (user.id) {
        leaderboardService.autoUpdateCurrentUserScore(user.id)
          .then(success => {
            console.log('✅ User score auto-updated on homepage load:', success)
            
            // Also update dashboard data
            return dashboardService.forceUpdateDashboard(user.id)
          })
          .then(success => {
            console.log('✅ Dashboard data updated:', success)
          })
          .catch(err => console.error('Error auto-updating score:', err))
      }
    }
  }, [user, profileLoading])

  // Cargar estados de actividades
  useEffect(() => {
    if (user) {
      loadActivityStatuses()
    }
  }, [user])

  const loadActivityStatuses = async () => {
    if (!user) return

    setIsLoadingStatuses(true)
    try {
      const statuses: Record<string, ActivityStatus> = {}

      // Timeline Activity
      const timelineNotes = await timelineService.getNotes(user.id)
      statuses['linea-tiempo'] = {
        hasData: timelineNotes.length > 0,
        count: timelineNotes.length,
        lastActivity: timelineNotes.length > 0 ? 'Última nota creada' : undefined
      }

      // Timeline Activity V2 (same data)
      statuses['linea-tiempo-v2'] = {
        hasData: timelineNotes.length > 0,
        count: timelineNotes.length,
        lastActivity: timelineNotes.length > 0 ? 'Última nota creada' : undefined
      }

      // Cuéntame quien eres
      const responses = await userResponsesService.getResponses(user.id, 'cuentame_quien_eres')
      statuses['cuentame-quien-eres'] = {
        hasData: responses.length > 0,
        count: responses.length,
        lastActivity: responses.length > 0 ? 'Preferencias guardadas' : undefined
      }

      // Carta a mí mismo
      const letters = await letterService.getLetters(user.id)
      statuses['carta-mi-mismo'] = {
        hasData: letters.length > 0,
        count: letters.length,
        lastActivity: letters.length > 0 ? `${letters.length} carta${letters.length > 1 ? 's' : ''} escrita${letters.length > 1 ? 's' : ''}` : undefined
      }

      // Meditación del Autoconocimiento
      const meditationSessions = await meditationService.getAllSessions(user.id)
      const completedSessions = meditationSessions.filter(s => s.completed_at)
      statuses['meditacion-autoconocimiento'] = {
        hasData: meditationSessions.length > 0,
        count: completedSessions.length,
        lastActivity: meditationSessions.length > 0 ? 
          completedSessions.length > 0 ? 
            `${completedSessions.length} sesión${completedSessions.length > 1 ? 'es' : ''} completada${completedSessions.length > 1 ? 's' : ''}` :
            'Sesión iniciada' : undefined
      }

      // Menú de la Ira
      const angerMenuSessions = await angerMenuService.getAllSessions(user.id)
      const completedAngerSessions = angerMenuSessions.filter(s => s.completed_at)
      statuses['menu-ira'] = {
        hasData: angerMenuSessions.length > 0,
        count: completedAngerSessions.length,
        lastActivity: angerMenuSessions.length > 0 ? 
          completedAngerSessions.length > 0 ? 
            `${completedAngerSessions.length} sesión${completedAngerSessions.length > 1 ? 'es' : ''} completada${completedAngerSessions.length > 1 ? 's' : ''}` :
            'Sesión iniciada' : undefined
      }

      setActivityStatuses(statuses)
    } catch (error) {
      console.error('Error loading activity statuses:', error)
    } finally {
      setIsLoadingStatuses(false)
    }
  }

  const activities = [
    {
      id: 'linea-tiempo',
      title: 'Línea del Tiempo',
      description: 'Crea tu propia línea del tiempo con momentos especiales',
      icon: Clock,
      color: 'from-purple-500 to-pink-500',
      available: true,
      route: '/actividad/linea-tiempo'
    },
    {
      id: 'linea-tiempo-v2',
      title: 'Línea del Tiempo v2',
      description: 'Versión experimental con nuevo diseño y efectos visuales',
      icon: Palette,
      color: 'from-indigo-500 to-purple-500',
      available: true,
      route: '/actividad/linea-tiempo-v2',
      isExperimental: true
    },
    {
      id: 'cuentame-quien-eres',
      title: 'Cuéntame quien eres',
      description: 'Comparte tus gustos y preferencias de manera divertida',
      icon: Heart,
      color: 'from-green-500 to-blue-500',
      available: true,
      route: '/actividad/cuentame-quien-eres'
    },
    {
      id: 'carta-mi-mismo',
      title: 'Carta a mí mismo',
      description: 'Escribe cartas para tu yo del futuro con efectos de escritura a mano',
      icon: Mail,
      color: 'from-amber-500 to-orange-500',
      available: true,
      route: '/actividad/carta-mi-mismo'
    },
    {
      id: 'meditacion-autoconocimiento',
      title: 'Meditación del Autoconocimiento',
      description: 'Practica mindfulness y reflexiona sobre tu experiencia interior',
      icon: Brain,
      color: 'from-indigo-500 to-purple-500',
      available: true,
      route: '/actividad/meditacion-autoconocimiento'
    },
    {
      id: 'menu-ira',
      title: 'Menú de la Ira',
      description: 'Aprende técnicas para manejar la ira de manera saludable',
      icon: Flame,
      color: 'from-red-500 to-orange-500',
      available: true,
      route: '/actividad/menu-ira'
    }
  ]

  const handleActivityClick = (activity: any) => {
    if (activity.available) {
      navigate(activity.route)
    }
  }

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false)
  }

  const getActivityStatusBadge = (activityId: string) => {
    if (isLoadingStatuses) {
      return (
        <div className="absolute top-4 right-4 bg-gray-400 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          Cargando...
        </div>
      )
    }

    const status = activityStatuses[activityId]
    
    if (!status || !status.hasData) {
      return (
        <div className="absolute top-4 right-4 bg-gray-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
          <AlertCircle size={14} />
          Sin datos
        </div>
      )
    }

    return (
      <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
        <CheckCircle size={14} />
        Con datos
      </div>
    )
  }

  const getActivityProgress = (activityId: string) => {
    if (isLoadingStatuses) return null

    const status = activityStatuses[activityId]
    if (!status || !status.hasData) return null

    return (
      <div className="mt-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
        <div className="flex items-center gap-2 text-green-700">
          <BarChart3 size={16} />
          <span className="font-medium text-sm">
            {status.lastActivity}
          </span>
        </div>
        {status.count > 0 && (
          <div className="text-green-600 text-xs mt-1">
            {status.count} elemento{status.count > 1 ? 's' : ''} guardado{status.count > 1 ? 's' : ''}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400">
      {/* Welcome Modal - Se mantiene hasta que el usuario haga clic */}
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        onClose={handleCloseWelcome} 
      />

      {/* Header */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sparkles size={32} className="text-white" />
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              Mind Goal
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Botón Leaderboard */}
            <button
              onClick={() => navigate('/leaderboard')}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-full font-bold transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              <Trophy size={20} />
              <span style={{ fontFamily: 'Fredoka' }}>Leaderboard</span>
            </button>
            
            {/* Botón Dashboard */}
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-2 rounded-full font-bold transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg"
            >
              <BarChart3 size={20} />
              <span style={{ fontFamily: 'Fredoka' }}>Dashboard</span>
            </button>
            
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
            ¡Hola, {user?.email?.split('@')[0]}! 👋
          </h2>
          <p className="text-xl text-white text-opacity-90 max-w-2xl mx-auto" style={{ fontFamily: 'Comic Neue' }}>
            Bienvenido a tu plataforma de aprendizaje. Elige una actividad para comenzar tu aventura educativa.
          </p>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {activities.map((activity) => {
            const IconComponent = activity.icon
            return (
              <div
                key={activity.id}
                onClick={() => handleActivityClick(activity)}
                className={`
                  relative bg-white rounded-3xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-105 
                  ${activity.available 
                    ? 'cursor-pointer hover:shadow-3xl' 
                    : 'opacity-60 cursor-not-allowed'
                  }
                `}
              >
                {/* Experimental Badge */}
                {activity.isExperimental && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Palette size={12} />
                    Experimental
                  </div>
                )}

                {/* Status Badge */}
                {getActivityStatusBadge(activity.id)}

                {/* Icon */}
                <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${activity.color} flex items-center justify-center mb-6 mx-auto`}>
                  <IconComponent size={40} className="text-white" />
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-800 mb-3" style={{ fontFamily: 'Fredoka' }}>
                    {activity.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed" style={{ fontFamily: 'Comic Neue' }}>
                    {activity.description}
                  </p>
                </div>

                {/* Progress Info */}
                {getActivityProgress(activity.id)}

                {/* Action Button */}
                {activity.available && (
                  <div className="mt-6 text-center">
                    <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${activity.color} text-white px-6 py-3 rounded-full font-bold transition-all hover:shadow-lg`}>
                      {activityStatuses[activity.id]?.hasData ? '¡Continuar!' : '¡Empezar!'}
                      <Sparkles size={16} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary Stats */}
        {!isLoadingStatuses && (
          <div className="mt-12 text-center">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
                📊 Tu Progreso General
              </h3>
              <div className="grid grid-cols-2 gap-4 text-white">
                <div>
                  <div className="text-2xl font-bold text-green-300">
                    {Object.values(activityStatuses).filter(s => s.hasData).length}
                  </div>
                  <div className="text-sm opacity-80">Actividades con datos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-300">
                    {Object.values(activityStatuses).reduce((total, s) => total + s.count, 0)}
                  </div>
                  <div className="text-sm opacity-80">Total de elementos</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Message */}
        <div className="text-center mt-12">
          <p className="text-white text-opacity-80" style={{ fontFamily: 'Comic Neue' }}>
            ¡Explora cada actividad y descubre nuevas formas de conocerte mejor! 🌟
          </p>
        </div>
      </div>
    </div>
  )
}

export default HomePage