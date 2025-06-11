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

  useEffect(() => {
    // Optimizar para iframe
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'hidden'
    document.body.style.backgroundColor = 'transparent'
    
    if (user) {
      calculateUserScore()
    }

    return () => {
      document.body.style.overflow = 'auto'
      document.body.style.backgroundColor = ''
    }
  }, [user])

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
      await signOut()
      setShowDropdown(false)
      // Notificar al padre que el usuario se deslogueó
      window.parent.postMessage({ type: 'USER_LOGGED_OUT' }, '*')
    } catch (error) {
      console.error('Error signing out:', error)
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

  const getScoreBgColor = () => {
    if (score >= 1000) return 'bg-purple-100 bg-opacity-80'
    if (score >= 500) return 'bg-blue-100 bg-opacity-80'
    if (score >= 200) return 'bg-green-100 bg-opacity-80'
    return 'bg-gray-100 bg-opacity-80'
  }

  if (!user) {
    return (
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center px-4">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-6 py-2 flex items-center gap-3">
          <User size={20} className="text-white" />
          <span className="text-white font-medium" style={{ fontFamily: 'Fredoka' }}>
            No autenticado
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-between px-4 relative rounded-2xl">
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
        <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 backdrop-blur-sm rounded-2xl px-8 py-1 flex items-center gap-4 shadow-xl border-2 border-yellow-300 relative overflow-hidden min-w-[220px]">
          {/* Efecto de brillo animado */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
          
          {/* Icono de trofeo con efecto */}
          <div className="relative">
            <Trophy size={20} className="text-yellow-900 drop-shadow-lg" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-200 rounded-full animate-ping"></div>
          </div>
          
          <div className="text-center flex-1">
            <div className="text-xs text-yellow-900 leading-none font-bold tracking-wide" style={{ fontFamily: 'Fredoka' }}>
              🎮 TU SCORE
            </div>
            <div className="font-black text-lg leading-none text-yellow-900 drop-shadow-md" style={{ fontFamily: 'Fredoka' }}>
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

        {/* Settings Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 p-3 rounded-full transition-all transform hover:scale-105"
          >
            <Settings size={20} className="text-white" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              {/* Overlay para cerrar el dropdown */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              
              <div className="absolute right-0 top-full mt-2 w-64 bg-white bg-opacity-95 backdrop-blur-sm rounded-xl shadow-2xl border border-white border-opacity-30 py-2 z-20">
                {/* Score Details */}
                <div className="px-4 py-3 border-b border-white border-opacity-30">
                  <div className="text-sm font-bold text-gray-800 mb-2" style={{ fontFamily: 'Fredoka' }}>
                    📊 Tu Progreso Detallado
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <Trophy size={18} className={getScoreColor()} />
                    <div>
                      <div className={`font-bold text-lg ${getScoreColor()}`}>
                        {score.toLocaleString()} caracteres
                      </div>
                      <div className="text-xs text-gray-500">
                        Nivel: {getScoreLevel()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 bg-opacity-50 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        score >= 1000 ? 'bg-purple-500' :
                        score >= 500 ? 'bg-blue-500' :
                        score >= 200 ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      style={{ 
                        width: `${Math.min((score / 1000) * 100, 100)}%` 
                      }}
                    />
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {score < 1000 ? `${1000 - score} caracteres para el siguiente nivel` : '¡Nivel máximo alcanzado!'}
                  </div>
                </div>

                {/* Menu Items */}
                <button
                  onClick={handleEditProfile}
                  className="w-full px-4 py-3 text-left text-gray-700 hover:bg-white hover:bg-opacity-50 flex items-center gap-3 transition-colors"
                >
                  <Edit size={16} />
                  <div>
                    <div className="font-medium">Editar Perfil</div>
                    <div className="text-xs text-gray-500">Actualizar información personal</div>
                  </div>
                  <ExternalLink size={14} className="ml-auto text-gray-400" />
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 hover:bg-opacity-50 flex items-center gap-3 transition-colors"
                >
                  <LogOut size={16} />
                  <div>
                    <div className="font-medium">Cerrar Sesión</div>
                    <div className="text-xs text-red-400">Salir de la cuenta</div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default StandaloneUserBar