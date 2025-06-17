import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import VimeoPlayer from '../components/VimeoPlayer'
import { meditationService, MeditationSession } from '../lib/meditationService'
import { 
  ArrowLeft, 
  Brain, 
  Play,
  Pause,
  CheckCircle,
  Clock,
  Heart,
  Sparkles,
  Save,
  Eye,
  BarChart3,
  MessageCircle,
  RotateCcw,
  FastForward,
  AlertTriangle
} from 'lucide-react'

const MeditacionAutoconocimiento = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const playerRef = useRef<any>(null)
  
  // Video configuration
  const VIDEO_ID = '1094217297'
  const VIDEO_TITLE = 'Meditación del Autoconocimiento'
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [maxWatchedTime, setMaxWatchedTime] = useState(0)
  
  // Session state
  const [currentSession, setCurrentSession] = useState<MeditationSession | null>(null)
  const [allSessions, setAllSessions] = useState<MeditationSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Reflection state
  const [showReflection, setShowReflection] = useState(false)
  const [reflectionText, setReflectionText] = useState('')
  const [isSaving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Skip tracking
  const [skipCount, setSkipCount] = useState(0)
  const [showSkipWarning, setShowSkipWarning] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserSession()
    }
  }, [user])

  useEffect(() => {
    // Actualizar el tiempo máximo visto
    if (currentTime > maxWatchedTime) {
      setMaxWatchedTime(currentTime)
    }
  }, [currentTime, maxWatchedTime])

  const loadUserSession = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Obtener o crear la sesión única para este video
      const session = await meditationService.getOrCreateSession(user.id, VIDEO_ID, VIDEO_TITLE)
      if (session) {
        setCurrentSession(session)
        setMaxWatchedTime(session.watch_duration)
        setReflectionText(session.reflection_text || '')
        setSkipCount(session.skip_count || 0)
        
        if (session.completed_at) {
          setHasCompleted(true)
        }
        
        if (session.started_at) {
          setHasStarted(true)
        }
      }

      // Obtener todas las sesiones para estadísticas
      const sessions = await meditationService.getAllSessions(user.id)
      setAllSessions(sessions)
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayerReady = (videoDuration: number) => {
    setDuration(videoDuration)
    
    // Actualizar la duración total en la sesión
    if (currentSession && user) {
      meditationService.updateSession(user.id, VIDEO_ID, {
        total_duration: videoDuration
      })
    }
  }

  const handlePlay = async () => {
    setIsPlaying(true)
    
    if (!hasStarted && user && currentSession) {
      setHasStarted(true)
      
      // Actualizar la sesión con el inicio
      await meditationService.updateSession(user.id, VIDEO_ID, {
        started_at: new Date().toISOString()
      })
    }
  }

  const handlePause = () => {
    setIsPlaying(false)
    updateSessionProgress()
  }

  const handleTimeUpdate = (time: number, videoDuration: number) => {
    setCurrentTime(time)
    if (videoDuration > 0) {
      setDuration(videoDuration)
    }
  }

  const handleSeek = async (fromTime: number, toTime: number) => {
    // Detectar skip forward (salto hacia adelante)
    if (toTime > fromTime + 2) {
      setSkipCount(prev => prev + 1)
      setShowSkipWarning(true)
      setTimeout(() => setShowSkipWarning(false), 3000)
      
      // Registrar el skip en la base de datos
      if (user) {
        await meditationService.recordSkip(user.id, VIDEO_ID)
      }
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setHasCompleted(true)
    updateSessionProgress(true)
    setShowReflection(true)
  }

  const updateSessionProgress = async (completed = false) => {
    if (!user) return

    try {
      const completionPercentage = duration > 0 ? Math.round((maxWatchedTime / duration) * 100) : 0
      
      const updates: Partial<MeditationSession> = {
        watch_duration: maxWatchedTime,
        completion_percentage: completionPercentage,
        total_duration: duration,
        last_position: currentTime
      }

      if (completed) {
        updates.completed_at = new Date().toISOString()
      }

      const updatedSession = await meditationService.updateSession(user.id, VIDEO_ID, updates)
      if (updatedSession) {
        setCurrentSession(updatedSession)
      }
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  const handleRestartVideo = async () => {
    if (!user) return

    try {
      // Reiniciar la sesión en la base de datos
      const success = await meditationService.restartSession(user.id, VIDEO_ID)
      
      if (success) {
        // Reiniciar el estado local
        setCurrentTime(0)
        setMaxWatchedTime(0)
        setHasStarted(false)
        setHasCompleted(false)
        setIsPlaying(false)
        setShowReflection(false)
        
        // Recargar la sesión actualizada
        await loadUserSession()
        
        setSaveMessage('¡Video reiniciado! Puedes verlo nuevamente.')
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error restarting video:', error)
      setSaveMessage('Error al reiniciar el video')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const handleSaveReflection = async () => {
    if (!user) return

    setSaving(true)
    try {
      const updatedSession = await meditationService.updateSession(user.id, VIDEO_ID, {
        reflection_text: reflectionText.trim()
      })
      
      if (updatedSession) {
        setCurrentSession(updatedSession)
        setSaveMessage('¡Reflexión guardada correctamente!')
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error saving reflection:', error)
      setSaveMessage('Error al guardar la reflexión')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setSaving(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getCompletionPercentage = () => {
    return duration > 0 ? Math.round((maxWatchedTime / duration) * 100) : 0
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-xl font-bold text-indigo-800" style={{ fontFamily: 'Fredoka' }}>
            Preparando tu sesión de meditación...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      {/* Header */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-indigo-800 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <Brain size={32} className="text-indigo-800" />
            <h1 className="text-2xl font-bold text-indigo-800" style={{ fontFamily: 'Fredoka' }}>
              Meditación del Autoconocimiento
            </h1>
          </div>
          <UserMenu />
        </div>
      </div>

      {/* Mensajes de estado */}
      {saveMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-white rounded-lg shadow-lg p-4 border-l-4 border-green-500">
          <CheckCircle size={20} className="text-green-500" />
          <span className="font-medium text-gray-800">{saveMessage}</span>
        </div>
      )}

      {/* Warning de Skip */}
      {showSkipWarning && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-orange-500 text-white rounded-lg shadow-lg p-4">
          <FastForward size={20} />
          <span className="font-medium">¡Detectamos que adelantaste el video!</span>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {!showReflection ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Fredoka' }}>
                    🧘‍♀️ Sesión de Meditación
                  </h2>
                  
                  {(hasCompleted || hasStarted) && (
                    <button
                      onClick={handleRestartVideo}
                      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <RotateCcw size={16} />
                      Reiniciar
                    </button>
                  )}
                </div>
                
                <VimeoPlayer
                  ref={playerRef}
                  videoId={VIDEO_ID}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onEnded={handleEnded}
                  onTimeUpdate={handleTimeUpdate}
                  onReady={handlePlayerReady}
                  onSeek={handleSeek}
                  className="mb-4"
                />

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progreso: {formatTime(currentTime)}</span>
                    <span>Duración: {formatTime(duration)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Player Status */}
                <div className="flex items-center justify-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    {isPlaying ? (
                      <Pause size={16} className="text-green-500" />
                    ) : (
                      <Play size={16} className="text-blue-500" />
                    )}
                    <span>{isPlaying ? 'Reproduciendo' : 'Pausado'}</span>
                  </div>
                  
                  {hasCompleted && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle size={16} />
                      <span>¡Completado!</span>
                    </div>
                  )}

                  {skipCount > 0 && (
                    <div className="flex items-center gap-2 text-orange-600">
                      <FastForward size={16} />
                      <span>Skips: {skipCount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Session Info */}
            <div className="space-y-6">
              {/* Current Session Stats */}
              <div className="bg-white rounded-3xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                  <BarChart3 size={24} className="text-indigo-600" />
                  Tu Progreso
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completado:</span>
                    <span className="font-bold text-indigo-600">{getCompletionPercentage()}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tiempo visto:</span>
                    <span className="font-bold">{formatTime(maxWatchedTime)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Veces visto:</span>
                    <span className="font-bold text-purple-600">{currentSession?.view_count || 0}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Adelantos:</span>
                    <span className={`font-bold ${skipCount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {skipCount}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Estado:</span>
                    <span className={`font-bold ${hasCompleted ? 'text-green-600' : hasStarted ? 'text-blue-600' : 'text-gray-500'}`}>
                      {hasCompleted ? 'Completado' : hasStarted ? 'En progreso' : 'No iniciado'}
                    </span>
                  </div>
                </div>

                {hasCompleted && (
                  <button
                    onClick={() => setShowReflection(true)}
                    className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={20} />
                    {currentSession?.reflection_text ? 'Ver/Editar Reflexión' : 'Escribir Reflexión'}
                  </button>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-white bg-opacity-50 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                  <Sparkles size={20} className="text-purple-600" />
                  Instrucciones
                </h3>
                <div className="text-gray-700 space-y-2 text-sm" style={{ fontFamily: 'Comic Neue' }}>
                  <p>• Encuentra un lugar cómodo y silencioso</p>
                  <p>• Usa auriculares para una mejor experiencia</p>
                  <p>• Sigue las instrucciones del video</p>
                  <p>• Evita adelantar el video para mejor experiencia</p>
                  <p>• Al finalizar, reflexiona sobre tu experiencia</p>
                </div>
              </div>

              {/* Skip Warning */}
              {skipCount > 3 && (
                <div className="bg-orange-100 border-l-4 border-orange-500 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={20} className="text-orange-600" />
                    <h4 className="font-bold text-orange-800">Recomendación</h4>
                  </div>
                  <p className="text-orange-700 text-sm">
                    Has adelantado el video {skipCount} veces. Para una mejor experiencia de meditación, 
                    te recomendamos ver el video completo sin adelantar.
                  </p>
                </div>
              )}

              {/* Previous Sessions Summary */}
              {allSessions.length > 1 && (
                <div className="bg-white bg-opacity-50 backdrop-blur-sm rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                    <Clock size={20} className="text-blue-600" />
                    Historial
                  </h3>
                  <div className="text-sm text-gray-600">
                    <p>Total de sesiones: <span className="font-bold">{allSessions.length}</span></p>
                    <p>Sesiones completadas: <span className="font-bold text-green-600">
                      {allSessions.filter(s => s.completed_at).length}
                    </span></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Reflection Section
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <div className="flex justify-center items-center gap-3 mb-4">
                  <Heart size={32} className="text-red-500" />
                  <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Fredoka' }}>
                    Reflexión Personal
                  </h2>
                  <Heart size={32} className="text-red-500" />
                </div>
                <p className="text-lg text-gray-600" style={{ fontFamily: 'Comic Neue' }}>
                  Tómate un momento para reflexionar sobre tu experiencia de meditación
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-gray-800 font-bold mb-3 text-lg" style={{ fontFamily: 'Fredoka' }}>
                  ¿Cómo te sentiste durante la meditación?
                </label>
                <textarea
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="Describe tus sensaciones, pensamientos, emociones o cualquier insight que hayas tenido durante la práctica..."
                  className="w-full h-40 px-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none text-base resize-none"
                  style={{ fontFamily: 'Comic Neue' }}
                />
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowReflection(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Volver al Video
                </button>
                <button
                  onClick={handleSaveReflection}
                  disabled={isSaving || !reflectionText.trim()}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} />
                  {isSaving ? 'Guardando...' : 'Guardar Reflexión'}
                </button>
              </div>

              {currentSession?.reflection_text && (
                <div className="mt-8 p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-bold text-purple-800 mb-2">Tu reflexión guardada:</h4>
                  <p className="text-purple-700 italic">{currentSession.reflection_text}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MeditacionAutoconocimiento