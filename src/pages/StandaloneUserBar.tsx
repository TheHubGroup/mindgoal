import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { User, LogOut, Trophy, Settings } from 'lucide-react'
import { userResponsesService } from '../lib/userResponsesService'
import { timelineService } from '../lib/timelineService'
import { letterService } from '../lib/letterService'
import { meditationService } from '../lib/meditationService'
import { angerMenuService } from '../lib/angerMenuService'

const StandaloneUserBar = () => {
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const [score, setScore] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(0)

  useEffect(() => {
    // Optimizar para iframe
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'hidden'
    document.body.style.backgroundColor = 'transparent'
    
    if (user) {
      calculateUserScore()
      startAutoUpdate()
    }

    // Escuchar mensajes del padre
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'USER_LOGGED_IN') {
        // El usuario se logueó desde otra barra, actualizar score
        if (user) {
          calculateUserScore()
        }
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      document.body.style.overflow = 'auto'
      document.body.style.backgroundColor = ''
      window.removeEventListener('message', handleMessage)
      stopAutoUpdate()
    }
  }, [user])

  // Efecto para redirigir cuando no hay usuario
  useEffect(() => {
    if (!user && !isLoading) {
      // Si no hay usuario autenticado, redirigir a login
      setTimeout(() => {
        window.location.href = '/standalone-login-bar'
      }, 100)
    }
  }, [user, isLoading])

  const startAutoUpdate = () => {
    // Actualizar cada 5 segundos
    intervalRef.current = setInterval(() => {
      if (user) {
        calculateUserScore(true) // true = actualización silenciosa
      }
    }, 5000)
  }

  const stopAutoUpdate = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const calculateUserScore = async (silent = false) => {
    if (!user) return

    if (!silent) {
      setIsLoading(true)
    }

    try {
      let totalCharacters = 0
      let hasNewData = false

      // Obtener respuestas de "Cuéntame quien eres"
      const responses = await userResponsesService.getResponses(user.id, 'cuentame_quien_eres')
      responses.forEach(response => {
        totalCharacters += response.response.length
      })

      // Obtener notas de línea de tiempo
      const timelineNotes = await timelineService.getNotes(user.id)
      timelineNotes.forEach(note => {
        totalCharacters += note.text.length
      })

      // Obtener cartas de "Carta a mí mismo"
      const letters = await letterService.getLetters(user.id)
      letters.forEach(letter => {
        totalCharacters += letter.title.length + letter.content.length
      })

      // Obtener sesiones de meditación y reflexiones
      const meditationSessions = await meditationService.getAllSessions(user.id)
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
      const angerMenuSessions = await angerMenuService.getAllSessions(user.id)
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

      // Verificar si hay cambios en el score
      if (totalCharacters !== score) {
        hasNewData = true
        setScore(totalCharacters)
        
        // Notificar al padre sobre la actualización del score
        window.parent.postMessage({ 
          type: 'SCORE_UPDATED', 
          score: totalCharacters,
          timestamp: Date.now()
        }, '*')
      }

      // Actualizar timestamp de última actualización
      lastUpdateRef.current = Date.now()

      // Si es una actualización silenciosa y hay nuevos datos, mostrar indicador visual
      if (silent && hasNewData) {
        // Agregar efecto visual sutil para indicar actualización
        const scoreElement = document.querySelector('.score-container')
        if (scoreElement) {
          scoreElement.classList.add('score-updated')
          setTimeout(() => {
            scoreElement.classList.remove('score-updated')
          }, 1000)
        }
      }

    } catch (error) {
      console.error('Error calculating score:', error)
      setScore(0)
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      setShowDropdown(false)
      stopAutoUpdate()
      
      await signOut()
      
      // Notificar al padre que el usuario se deslogueó
      window.parent.postMessage({ type: 'USER_LOGGED_OUT' }, '*')
      
      // Redirigir a la barra de login
      setTimeout(() => {
        window.location.href = '/standalone-login-bar'
      }, 100)
    } catch (error) {
      console.error('Error signing out:', error)
      setIsSigningOut(false)
    }
  }

  const getDisplayName = () => {
    if (profile?.nombre && profile?.apellido) {
      return `${profile.nombre} ${profile.apellido}`
    }
    if (profile?.nombre) {
      return profile.nombre
    }
    return user?.email?.split('@')[0] || 'Usuario'
  }

  const getScoreColor = () => {
    if (score >= 2000) return 'text-purple-600'
    if (score >= 1000) return 'text-blue-600'
    if (score >= 500) return 'text-green-600'
    return 'text-gray-600'
  }

  const getScoreLevel = () => {
    if (score >= 2000) return 'Maestro'
    if (score >= 1000) return 'Experto'
    if (score >= 500) return 'Avanzado'
    if (score >= 200) return 'Intermedio'
    return 'Principiante'
  }

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center px-4">
        <div className="flex items-center gap-3 text-white">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span style={{ fontFamily: 'Fredoka' }}>Cargando...</span>
        </div>
      </div>
    )
  }

  // Si no hay usuario, mostrar mensaje mientras redirige
  if (!user) {
    return (
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center px-4">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-6 py-2 flex items-center gap-3">
          <User size={20} className="text-white" />
          <span className="text-white font-medium" style={{ fontFamily: 'Fredoka' }}>
            Redirigiendo...
          </span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-between px-4 relative">
        {/* User Info Section */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white bg-opacity-20 flex items-center justify-center flex-shrink-0 border-2 border-white border-opacity-30">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={24} className="text-white" />
            )}
          </div>

          {/* Name */}
          <div className="text-white">
            <div className="font-bold text-lg leading-tight" style={{ fontFamily: 'Fredoka' }}>
              {getDisplayName()}
            </div>
            <div className="text-xs opacity-80" style={{ fontFamily: 'Comic Neue' }}>
              {user.email}
            </div>
          </div>
        </div>

        {/* Score and Actions Section */}
        <div className="flex items-center gap-4">
          {/* Score Display con etiqueta "Tu Score" y auto-actualización */}
          <div className="score-container bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 backdrop-blur-sm rounded-2xl px-6 py-1 flex items-center gap-3 shadow-xl border-2 border-yellow-300 relative overflow-hidden min-w-[180px] transition-all duration-300">
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
            
            {/* Icono de trofeo con efecto */}
            <div className="relative">
              <Trophy size={18} className="text-yellow-900 drop-shadow-lg" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-200 rounded-full animate-ping"></div>
            </div>
            
            <div className="text-center flex-1">
              <div className="text-xs text-yellow-900 leading-none font-bold tracking-wide" style={{ fontFamily: 'Fredoka' }}>
                🎮 TU SCORE
              </div>
              <div className="font-black text-base leading-none text-yellow-900 drop-shadow-md transition-all duration-300" style={{ fontFamily: 'Fredoka' }}>
                {isLoading ? '...' : score.toLocaleString()}
              </div>
              <div className="text-xs text-yellow-800 leading-none font-semibold" style={{ fontFamily: 'Comic Neue' }}>
                {isLoading ? 'Calculando...' : getScoreLevel()}
              </div>
            </div>
            
            {/* Partículas decorativas */}
            <div className="absolute top-0 right-2 text-yellow-200 text-xs animate-bounce">✨</div>
            <div className="absolute bottom-0 left-2 text-yellow-200 text-xs animate-bounce" style={{ animationDelay: '0.5s' }}>⭐</div>
            
            {/* Indicador de actualización automática */}
            <div className="absolute top-1 left-1 w-2 h-2 bg-green-400 rounded-full animate-pulse opacity-60" title="Actualización automática activa"></div>
          </div>

          {/* Botón Cerrar Sesión */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="bg-white bg-opacity-20 hover:bg-red-500 hover:bg-opacity-80 p-2 rounded-full transition-all transform hover:scale-105 group disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cerrar Sesión"
            >
              {isSigningOut ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogOut size={18} className="text-white group-hover:text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* CSS para efectos de actualización */}
      <style jsx>{`
        .score-updated {
          animation: scoreUpdate 1s ease-in-out;
        }

        @keyframes scoreUpdate {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(255, 215, 0, 0.6); }
          100% { transform: scale(1); }
        }

        .score-container {
          position: relative;
        }

        .score-container::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #ffd700, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7);
          background-size: 400% 400%;
          border-radius: inherit;
          z-index: -1;
          animation: gradientShift 3s ease infinite;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .score-updated::before {
          opacity: 0.7;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </>
  )
}

export default StandaloneUserBar