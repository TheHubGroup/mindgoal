import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import VimeoPlayer, { VimeoPlayerRef } from '../components/VimeoPlayer'
import { angerManagementService, AngerManagementSession } from '../lib/angerManagementService'
import { 
  ArrowLeft, 
  Flame, 
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
  AlertTriangle,
  Zap,
  Shield,
  Wind,
  Timer,
  MessageSquare,
  X
} from 'lucide-react'

// Técnicas de manejo de la ira
const angerManagementTechniques = [
  { id: 'respirar', name: 'Respirar', icon: Wind, description: 'Respirar profundamente para calmarse' },
  { id: 'esperar', name: 'Esperar', icon: Timer, description: 'Esperar antes de reaccionar' },
  { id: 'retirarse', name: 'Retirarse', icon: ArrowLeft, description: 'Alejarse temporalmente de la situación' },
  { id: 'hablar', name: 'Hablar', icon: MessageSquare, description: 'Comunicar tus sentimientos de forma asertiva' },
  { id: 'limites', name: 'Poner límites', icon: Shield, description: 'Establecer límites claros con los demás' }
]

const MenuDeLaIra = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const playerRef = useRef<VimeoPlayerRef>(null)
  
  // Video configuration
  const VIDEO_ID = '1096763056' // Video ID de Vimeo proporcionado
  const VIDEO_TITLE = 'Menú de la Ira'
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [maxWatchedTime, setMaxWatchedTime] = useState(0)
  const [playerKey, setPlayerKey] = useState(0) // To force re-render of player
  
  // Session state
  const [currentSession, setCurrentSession] = useState<AngerManagementSession | null>(null)
  const [allSessions, setAllSessions] = useState<AngerManagementSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Reflection state
  const [showReflection, setShowReflection] = useState(false)
  const [reflectionText, setReflectionText] = useState('')
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([])
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
    // Update maximum watched time
    if (currentTime > maxWatchedTime) {
      setMaxWatchedTime(currentTime)
    }
  }, [currentTime, maxWatchedTime])

  const loadUserSession = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Get or create the unique session for this video
      const session = await angerManagementService.getOrCreateSession(user.id, VIDEO_ID, VIDEO_TITLE)
      if (session) {
        setCurrentSession(session)
        setMaxWatchedTime(session.watch_duration)
        setReflectionText(session.reflection_text || '')
        setSkipCount(session.skip_count || 0)
        setSelectedTechniques(session.techniques_applied || [])
        
        if (session.completed_at) {
          setHasCompleted(true)
        }
        
        if (session.started_at) {
          setHasStarted(true)
        }
      }

      // Get all sessions for statistics
      const sessions = await angerManagementService.getAllSessions(user.id)
      setAllSessions(sessions)
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayerReady = (videoDuration: number) => {
    console.log('🎬 Player ready with duration:', videoDuration)
    setDuration(videoDuration)
    
    // Update total duration in session
    if (currentSession && user) {
      angerManagementService.updateSession(user.id, VIDEO_ID, VIDEO_TITLE, {
        total_duration: videoDuration
      })
    }
  }

  const handlePlay = async () => {
    console.log('▶️ Play event triggered')
    setIsPlaying(true)
    
    if (!hasStarted && user && currentSession) {
      setHasStarted(true)
      
      // Update session with start time
      await angerManagementService.updateSession(user.id, VIDEO_ID, VIDEO_TITLE, {
        started_at: new Date().toISOString()
      })
    }
  }

  const handlePause = () => {
    console.log('⏸️ Pause event triggered')
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
    console.log('🎯 Seek detected:', fromTime, '->', toTime)
    // Detect skip forward (jump ahead)
    if (toTime > fromTime + 2) {
      setSkipCount(prev => prev + 1)
      setShowSkipWarning(true)
      setTimeout(() => setShowSkipWarning(false), 3000)
      
      // Record the skip in the database
      if (user) {
        await angerManagementService.recordSkip(user.id, VIDEO_ID)
      }
    }
  }

  const handleEnded = () => {
    console.log('🏁 Video ended')
    setIsPlaying(false)
    setHasCompleted(true)
    updateSessionProgress(true)
    setShowReflection(true)
  }

  const updateSessionProgress = async (completed = false) => {
    if (!user) return

    try {
      const completionPercentage = duration > 0 ? Math.round((maxWatchedTime / duration) * 100) : 0
      
      const updates: Partial<AngerManagementSession> = {
        watch_duration: maxWatchedTime,
        completion_percentage: completionPercentage,
        total_duration: duration,
        last_position: currentTime
      }

      if (completed) {
        updates.completed_at = new Date().toISOString()
      }

      const updatedSession = await angerManagementService.updateSession(user.id, VIDEO_ID, VIDEO_TITLE, updates)
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
      console.log('🔄 Starting video restart process...')
      
      // First restart the session in the database
      const success = await angerManagementService.restartSession(user.id, VIDEO_ID)
      
      if (success) {
        console.log('✅ Database session restarted')
        
        // Reset local state
        setCurrentTime(0)
        setMaxWatchedTime(0)
        setHasStarted(false)
        setHasCompleted(false)
        setIsPlaying(false)
        setShowReflection(false)
        
        // Force re-render of player to ensure it appears
        setPlayerKey(prev => prev + 1)
        
        // Wait a bit before restarting the player
        setTimeout(async () => {
          if (playerRef.current) {
            console.log('🎬 Restarting video player...')
            await playerRef.current.restart()
          }
        }, 500)
        
        // Reload the updated session
        await loadUserSession()
        
        setSaveMessage('¡Video reiniciado! Puedes verlo nuevamente.')
        setTimeout(() => setSaveMessage(''), 3000)
        
        console.log('✅ Video restart completed successfully')
      } else {
        throw new Error('Failed to restart session in database')
      }
    } catch (error) {
      console.error('❌ Error restarting video:', error)
      setSaveMessage('Error al reiniciar el video')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  const handleTechniqueToggle = (techniqueId: string) => {
    setSelectedTechniques(prev => {
      if (prev.includes(techniqueId)) {
        return prev.filter(id => id !== techniqueId)
      } else {
        return [...prev, techniqueId]
      }
    })
  }

  const handleSaveReflection = async () => {
    if (!user) return

    setSaving(true)
    try {
      // First save the reflection text
      const updatedSession = await angerManagementService.updateSession(user.id, VIDEO_ID, VIDEO_TITLE, {
        reflection_text: reflectionText.trim()
      })
      
      // Then save the selected techniques
      if (selectedTechniques.length > 0) {
        await angerManagementService.saveTechniques(user.id, VIDEO_ID, selectedTechniques)
      }
      
      if (updatedSession) {
        setCurrentSession(updatedSession)
        setSaveMessage('¡Reflexión y técnicas guardadas correctamente!')
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
      <div className="min-h-screen bg-gradient-to-br from-red-800 via-orange-700 to-amber-600 flex items-center justify-center">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
            Preparando tu menú de la ira...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-800 via-orange-700 to-amber-600">
      {/* Header */}
      <div className="bg-black bg-opacity-30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <Flame size={32} className="text-orange-400" />
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              Menú de la Ira
            </h1>
          </div>
          <UserMenu />
        </div>
      </div>

      {/* Status messages */}
      {saveMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-white rounded-lg shadow-lg p-4 border-l-4 border-green-500">
          <CheckCircle size={20} className="text-green-500" />
          <span className="font-medium text-gray-800">{saveMessage}</span>
        </div>
      )}

      {/* Skip Warning */}
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
              <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-orange-500 border-opacity-30">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                    <Flame size={24} className="text-orange-400" />
                    Menú de la Ira: Técnicas para Manejarla
                  </h2>
                  
                  {(hasCompleted || hasStarted) && (
                    <button
                      onClick={handleRestartVideo}
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      <RotateCcw size={16} />
                      Reiniciar
                    </button>
                  )}
                </div>
                
                {/* Player Container with key to force re-render */}
                <div key={`player-${playerKey}`} className="rounded-xl overflow-hidden shadow-2xl border-4 border-orange-900 border-opacity-30">
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
                </div>

                {/* Progress Bar */}
                <div className="mt-4 mb-4">
                  <div className="flex justify-between text-sm text-white mb-2">
                    <span>Progreso: {formatTime(currentTime)}</span>
                    <span>Duración: {formatTime(duration)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                {/* Player Status */}
                <div className="flex items-center justify-center gap-4 text-sm text-white">
                  <div className="flex items-center gap-2">
                    {isPlaying ? (
                      <Pause size={16} className="text-green-400" />
                    ) : (
                      <Play size={16} className="text-orange-400" />
                    )}
                    <span>{isPlaying ? 'Reproduciendo' : 'Pausado'}</span>
                  </div>
                  
                  {hasCompleted && (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle size={16} />
                      <span>¡Completado!</span>
                    </div>
                  )}

                  {skipCount > 0 && (
                    <div className="flex items-center gap-2 text-orange-400">
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
              <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-orange-500 border-opacity-30">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                  <BarChart3 size={24} className="text-orange-400" />
                  Tu Progreso
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white">Completado:</span>
                    <span className="font-bold text-orange-400">{getCompletionPercentage()}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-white">Tiempo visto:</span>
                    <span className="font-bold text-white">{formatTime(maxWatchedTime)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-white">Veces visto:</span>
                    <span className="font-bold text-orange-400">{currentSession?.view_count || 0}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-white">Adelantos:</span>
                    <span className={`font-bold ${skipCount > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                      {skipCount}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-white">Estado:</span>
                    <span className={`font-bold ${hasCompleted ? 'text-green-400' : hasStarted ? 'text-orange-400' : 'text-gray-400'}`}>
                      {hasCompleted ? 'Completado' : hasStarted ? 'En progreso' : 'No iniciado'}
                    </span>
                  </div>
                </div>

                {hasCompleted && (
                  <button
                    onClick={() => setShowReflection(true)}
                    className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={20} />
                    {currentSession?.reflection_text ? 'Ver/Editar Reflexión' : 'Escribir Reflexión'}
                  </button>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-orange-500 border-opacity-20">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                  <Sparkles size={20} className="text-orange-400" />
                  Instrucciones
                </h3>
                <div className="text-white space-y-2 text-sm" style={{ fontFamily: 'Comic Neue' }}>
                  <p>• Encuentra un lugar cómodo y silencioso</p>
                  <p>• Usa auriculares para una mejor experiencia</p>
                  <p>• Sigue las instrucciones del video</p>
                  <p>• Evita adelantar el video para mejor experiencia</p>
                  <p>• Al finalizar, reflexiona sobre las técnicas que aplicarías</p>
                </div>
              </div>

              {/* Skip Warning */}
              {skipCount > 3 && (
                <div className="bg-orange-900 bg-opacity-50 border-l-4 border-orange-500 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={20} className="text-orange-400" />
                    <h4 className="font-bold text-orange-300">Recomendación</h4>
                  </div>
                  <p className="text-orange-200 text-sm">
                    Has adelantado el video {skipCount} veces. Para una mejor experiencia de aprendizaje, 
                    te recomendamos ver el video completo sin adelantar.
                  </p>
                </div>
              )}

              {/* Previous Sessions Summary */}
              {allSessions.length > 1 && (
                <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-orange-500 border-opacity-20">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                    <Clock size={20} className="text-orange-400" />
                    Historial
                  </h3>
                  <div className="text-sm text-white">
                    <p>Total de sesiones: <span className="font-bold">{allSessions.length}</span></p>
                    <p>Sesiones completadas: <span className="font-bold text-green-400">
                      {allSessions.filter(s => s.completed_at).length}
                    </span></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Reflection Section with Techniques Survey
          <div className="max-w-4xl mx-auto">
            <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-orange-500 border-opacity-30">
              <div className="text-center mb-8">
                <div className="flex justify-center items-center gap-3 mb-4">
                  <Flame size={32} className="text-orange-400" />
                  <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                    Reflexión sobre el Manejo de la Ira
                  </h2>
                  <Flame size={32} className="text-orange-400" />
                </div>
                <p className="text-lg text-white text-opacity-90" style={{ fontFamily: 'Comic Neue' }}>
                  Reflexiona sobre lo que has aprendido y selecciona las técnicas que aplicarías
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-white font-bold mb-3 text-lg" style={{ fontFamily: 'Fredoka' }}>
                  ¿Qué aprendiste sobre el manejo de la ira?
                </label>
                <textarea
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="Describe tus reflexiones sobre el video y cómo podrías aplicar lo aprendido..."
                  className="w-full h-40 px-4 py-3 border-2 border-orange-400 bg-black bg-opacity-30 rounded-lg focus:border-orange-500 focus:outline-none text-base resize-none text-white"
                  style={{ fontFamily: 'Comic Neue' }}
                />
              </div>

              {/* Techniques Survey */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                  <Zap size={24} className="text-yellow-400" />
                  ¿Qué técnicas aplicarías para manejar tu ira?
                  <span className="text-sm font-normal text-orange-300 ml-2">(Puedes seleccionar varias)</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {angerManagementTechniques.map(technique => {
                    const isSelected = selectedTechniques.includes(technique.id)
                    const IconComponent = technique.icon
                    
                    return (
                      <div 
                        key={technique.id}
                        onClick={() => handleTechniqueToggle(technique.id)}
                        className={`
                          p-4 rounded-xl cursor-pointer transition-all transform hover:scale-105
                          ${isSelected 
                            ? 'bg-gradient-to-br from-orange-500 to-red-500 border-2 border-yellow-300 shadow-lg' 
                            : 'bg-black bg-opacity-30 border border-orange-500 border-opacity-30 hover:bg-opacity-40'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center
                            ${isSelected ? 'bg-yellow-400' : 'bg-orange-900 bg-opacity-50'}
                          `}>
                            <IconComponent size={20} className={isSelected ? 'text-orange-900' : 'text-orange-400'} />
                          </div>
                          <div>
                            <h4 className="font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                              {technique.name}
                            </h4>
                            <p className="text-xs text-white text-opacity-80" style={{ fontFamily: 'Comic Neue' }}>
                              {technique.description}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle size={20} className="text-yellow-300 ml-auto" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setShowReflection(false)}
                  className="bg-gray-700 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Volver al Video
                </button>
                <button
                  onClick={handleSaveReflection}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} />
                  {isSaving ? 'Guardando...' : 'Guardar Reflexión'}
                </button>
              </div>

              {currentSession?.reflection_text && (
                <div className="mt-8 p-4 bg-black bg-opacity-30 rounded-lg border border-orange-500 border-opacity-30">
                  <h4 className="font-bold text-orange-300 mb-2">Tu reflexión guardada:</h4>
                  <p className="text-white italic">{currentSession.reflection_text}</p>
                </div>
              )}

              {currentSession?.techniques_applied && currentSession.techniques_applied.length > 0 && (
                <div className="mt-4 p-4 bg-black bg-opacity-30 rounded-lg border border-orange-500 border-opacity-30">
                  <h4 className="font-bold text-orange-300 mb-2">Técnicas que seleccionaste:</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentSession.techniques_applied.map(techniqueId => {
                      const technique = angerManagementTechniques.find(t => t.id === techniqueId)
                      if (!technique) return null
                      
                      return (
                        <div key={techniqueId} className="bg-orange-900 bg-opacity-50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          <technique.icon size={14} />
                          <span>{technique.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MenuDeLaIra