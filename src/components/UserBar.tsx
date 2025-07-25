import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, Edit, Trophy, Settings } from 'lucide-react'
import { leaderboardService } from '../lib/leaderboardService'

interface UserBarProps {
  className?: string
}

const UserBar: React.FC<UserBarProps> = ({ className = '' }) => {
  const { user, signOut } = useAuth()
  const { profile } = useProfile()
  const navigate = useNavigate()
  const [score, setScore] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (user) {
      calculateUserScore()
      
      // Set up auto-refresh interval for score
      const interval = setInterval(() => {
        calculateUserScore(true) // silent update
      }, 60000) // Refresh every minute
      
      return () => clearInterval(interval)
    }
  }, [user])

  const calculateUserScore = async (silent = false) => {
    if (!user) return

    if (!silent) {
      setIsLoading(true)
    }
    
    try {
      // Primero intentar obtener el puntaje de la tabla pública
      const publicScore = await leaderboardService.getUserPublicScore(user.id)
      
      if (publicScore) {
        // Si ya existe un puntaje público, usarlo
        setScore(publicScore.score)
      } else {
        // Si no existe, calcularlo y guardarlo
        const userScore = await leaderboardService.calculateUserScore(user.id)
        setScore(userScore)
        
        // Actualizar el puntaje en la tabla pública
        await leaderboardService.updatePublicScore(user.id, userScore)
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
      await signOut()
      setShowDropdown(false)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleEditProfile = () => {
    navigate('/profile')
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
    if (score >= 2000) return 'text-purple-600'
    if (score >= 1000) return 'text-blue-600'
    if (score >= 500) return 'text-green-600'
    return 'text-gray-600'
  }

  const getScoreLevel = () => {
    return leaderboardService.getScoreLevel(score)
  }

  if (!user) {
    return (
      <div className={`bg-white bg-opacity-20 backdrop-blur-sm shadow-lg rounded-full px-6 py-3 flex items-center gap-4 ${className}`}>
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-white hover:text-opacity-80 font-medium transition-colors"
        >
          <User size={20} />
          Iniciar Sesión
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-white bg-opacity-20 backdrop-blur-sm shadow-lg rounded-full px-6 py-3 flex items-center gap-4 relative ${className}`}>
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <User size={20} className="text-white" />
        )}
      </div>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white truncate" style={{ fontFamily: 'Fredoka' }}>
            {getDisplayName()}
          </span>
          
          {/* Score con etiqueta "Tu Score" */}
          <div className="flex items-center gap-1 bg-white bg-opacity-30 rounded-full px-3 py-1">
            <Trophy size={16} className={getScoreColor()} />
            <div className="text-center">
              <div className="text-xs text-white font-medium leading-tight">Tu Score</div>
              <div className={`font-bold text-sm ${getScoreColor()} leading-tight`}>
                {isLoading ? '...' : score.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Score Level */}
        <div className="text-xs text-white text-opacity-80 mt-1">
          {isLoading ? 'Calculando...' : `Nivel: ${getScoreLevel()}`}
        </div>
      </div>

      {/* Actions */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
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
            
            <div className="absolute right-0 top-full mt-2 w-56 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg shadow-xl border border-white border-opacity-30 py-2 z-20">
              {/* Score Details */}
              <div className="px-4 py-3 border-b border-white border-opacity-30">
                <div className="text-sm font-medium text-gray-800">Tu Progreso</div>
                <div className="flex items-center gap-2 mt-1">
                  <Trophy size={16} className={getScoreColor()} />
                  <span className={`font-bold ${getScoreColor()}`}>
                    {score.toLocaleString()} puntos
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {getScoreLevel()}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Incluye: Línea del tiempo, Cuéntame quien eres, Cartas personales, Meditación y Menú de la Ira
                </div>
              </div>

              {/* Menu Items */}
              <button
                onClick={handleEditProfile}
                className="w-full px-4 py-2 text-left text-gray-800 hover:bg-white hover:bg-opacity-50 flex items-center gap-3 transition-colors"
              >
                <Edit size={16} />
                Editar Perfil
              </button>
              
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 hover:bg-opacity-50 flex items-center gap-3 transition-colors"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default UserBar