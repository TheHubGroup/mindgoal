import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { User, LogOut, Edit, Trophy, Settings, ExternalLink } from 'lucide-react'
import { userResponsesService } from '../lib/userResponsesService'
import { timelineService } from '../lib/timelineService'

const StandaloneUserBar = () => {
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const [score, setScore] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    // Optimizar para iframe
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'hidden'
    document.body.style.backgroundColor = 'transparent'
    
    if (user) {
      calculateUserScore()
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

  const calculateUserScore = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      let totalCharacters = 0

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

      setScore(totalCharacters)
    } catch (error) {
      console.error('Error calculating score:', error)
      setScore(0)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      setShowDropdown(false)
      
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

  const handleEditProfile = () => {
    // Abrir perfil en ventana padre
    window.parent.postMessage({ type: 'NAVIGATE_TO_PROFILE' }, '*')
    setShowDropdown(false)
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
    if (score >= 1000) return 'text-purple-600'
    if (score >= 500) return 'text-blue-600'
    if (score >= 200) return 'text-green-600'
    return 'text-gray-600'
  }

  const getScoreLevel = () => {
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
        {/* Score Display con etiqueta "Tu Score" */}
        <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 backdrop-blur-sm rounded-2xl px-6 py-1 flex items-center gap-3 shadow-xl border-2 border-yellow-300 relative overflow-hidden min-w-[180px]">
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
            <div className="font-black text-base leading-none text-yellow-900 drop-shadow-md" style={{ fontFamily: 'Fredoka' }}>
              {isLoading ? '...' : score.toLocaleString()}
            </div>
            <div className="text-xs text-yellow-800 leading-none font-semibold" style={{ fontFamily: 'Comic Neue' }}>
              {isLoading ? 'Calculando...' : getScoreLevel()}
            </div>
          </div>
          
          {/* Partículas decorativas */}
          <div className="absolute top-0 right-2 text-yellow-200 text-xs animate-bounce">✨</div>
          <div className="absolute bottom-0 left-2 text-yellow-200 text-xs animate-bounce" style={{ animationDelay: '0.5s' }}>⭐</div>
        </div>

        {/* Botones de acción directos */}
        <div className="flex items-center gap-2">
          {/* Botón Editar Perfil */}
          <button
            onClick={handleEditProfile}
            disabled={isSigningOut}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all transform hover:scale-105 group disabled:opacity-50 disabled:cursor-not-allowed"
            title="Editar Perfil"
          >
            <Edit size={18} className="text-white group-hover:text-yellow-200" />
          </button>

          {/* Botón Cerrar Sesión */}
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
  )
}

export default StandaloneUserBar