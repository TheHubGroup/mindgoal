import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { emotionLogService, UserEmotionLog } from '../lib/emotionLogService'
import { 
  Calculator, 
  CheckCircle, 
  Save,
  Heart,
  Zap,
  X,
  Sparkles
} from 'lucide-react'

interface Emotion {
  name: string
  emoji: string
  color: string
  description: string
}

const allEmotions: Emotion[] = [
  { name: 'Alegría', emoji: '😊', color: 'from-yellow-400 to-orange-400', description: 'Cuando algo te hace muy feliz' },
  { name: 'Tristeza', emoji: '😢', color: 'from-blue-400 to-indigo-500', description: 'Cuando te sientes triste o melancólico' },
  { name: 'Enojo', emoji: '😡', color: 'from-red-500 to-pink-500', description: 'Cuando algo te molesta o frustra' },
  { name: 'Miedo', emoji: '😨', color: 'from-purple-500 to-indigo-600', description: 'Cuando algo te asusta o preocupa' },
  { name: 'Emoción', emoji: '🤩', color: 'from-pink-400 to-rose-500', description: 'Cuando estás muy emocionado por algo' },
  { name: 'Calma', emoji: '😌', color: 'from-green-400 to-teal-500', description: 'Cuando te sientes tranquilo y en paz' },
  { name: 'Vergüenza', emoji: '😳', color: 'from-orange-400 to-red-400', description: 'Cuando te sientes avergonzado' },
  { name: 'Confusión', emoji: '😕', color: 'from-gray-400 to-gray-600', description: 'Cuando no entiendes algo' },
  { name: 'Cariño', emoji: '🥰', color: 'from-pink-300 to-red-400', description: 'Cuando sientes amor y afecto' },
  { name: 'Desilusión', emoji: '😞', color: 'from-slate-400 to-gray-500', description: 'Cuando algo no sale como esperabas' }
]

const StandaloneEmotionCalculator = () => {
  const { user } = useAuth()
  const [selectedEmotions, setSelectedEmotions] = useState<Set<string>>(new Set())
  const [lastLogDate, setLastLogDate] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    // Optimize for iframe
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'hidden'
    document.body.style.backgroundColor = 'transparent'
    
    if (user) {
      loadLastLogDate()
    }

    return () => {
      document.body.style.overflow = 'auto'
      document.body.style.backgroundColor = ''
    }
  }, [user])

  const loadLastLogDate = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const lastDate = await emotionLogService.getLastEmotionLogDate(user.id)
      setLastLogDate(lastDate)
    } catch (error) {
      console.error('Error loading last log date:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmotionSelect = (emotionName: string) => {
    if (isCompleted) return
    
    setSelectedEmotions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(emotionName)) {
        newSet.delete(emotionName)
      } else {
        newSet.add(emotionName)
      }
      return newSet
    })
  }

  const handleSubmitEmotions = async () => {
    if (!user || selectedEmotions.size === 0) {
      setSaveMessage('Por favor, selecciona al menos una emoción.')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }

    setIsSaving(true)
    try {
      const logEntries: Omit<UserEmotionLog, 'id' | 'created_at' | 'updated_at'>[] = 
        Array.from(selectedEmotions).map(emotionName => ({
          user_id: user.id,
          emotion_name: emotionName,
          felt_at: new Date().toISOString(),
          intensity: 3,
          notes: `Registrado desde widget - ${new Date().toLocaleDateString()}`
        }))

      for (const entry of logEntries) {
        await emotionLogService.logEmotion(entry)
      }

      setSaveMessage('¡Emociones registradas correctamente!')
      setIsCompleted(true)
      
      // Notify parent window about the update
      window.parent.postMessage({ 
        type: 'EMOTIONS_LOGGED', 
        emotions: Array.from(selectedEmotions),
        timestamp: Date.now()
      }, '*')
      
      setTimeout(() => {
        setSaveMessage('')
        setSelectedEmotions(new Set())
        setIsCompleted(false)
        loadLastLogDate()
      }, 3000)
    } catch (error) {
      console.error('Error saving emotions:', error)
      setSaveMessage('Error al registrar las emociones.')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const getDaysSinceLastLog = () => {
    if (!lastLogDate) return null
    const lastDate = new Date(lastLogDate)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - lastDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const resetWidget = () => {
    setSelectedEmotions(new Set())
    setIsCompleted(false)
    setSaveMessage('')
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-400 via-green-400 to-yellow-400 flex items-center justify-center">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
            Cargando...
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-400 via-green-400 to-yellow-400 flex items-center justify-center p-4">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 text-center">
          <Calculator size={48} className="mx-auto mb-4 text-white" />
          <p className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Fredoka' }}>
            Calculadora de Emociones
          </p>
          <p className="text-white text-opacity-90 text-sm" style={{ fontFamily: 'Comic Neue' }}>
            Inicia sesión para registrar tus emociones
          </p>
        </div>
      </div>
    )
  }

  const daysSinceLastLog = getDaysSinceLastLog()

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
      {/* Status messages */}
      {saveMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white rounded-lg shadow-lg p-3 border-l-4 border-green-500">
          <CheckCircle size={16} className="text-green-500" />
          <span className="font-medium text-gray-800 text-sm">{saveMessage}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="h-full flex flex-col p-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Calculator size={24} className="text-yellow-400" />
            <h1 className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: 'Fredoka' }}>
              CALCULADORA DE EMOCIONES
            </h1>
            <Sparkles size={24} className="text-yellow-400" />
          </div>
          
          <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-xl p-4 mb-4">
            <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Fredoka' }}>
              ¿Qué emociones has sentido desde tu última visita a MindGoal?
            </h2>
            
            {lastLogDate && daysSinceLastLog !== null && (
              <div className="text-white text-opacity-90 text-sm" style={{ fontFamily: 'Comic Neue' }}>
                {daysSinceLastLog === 0 ? (
                  <span>Tu último registro fue hoy</span>
                ) : daysSinceLastLog === 1 ? (
                  <span>Tu último registro fue ayer</span>
                ) : (
                  <span>Han pasado {daysSinceLastLog} días desde tu último registro</span>
                )}
              </div>
            )}
            
            {!lastLogDate && (
              <div className="text-white text-opacity-90 text-sm" style={{ fontFamily: 'Comic Neue' }}>
                Este es tu primer registro de emociones
              </div>
            )}
          </div>
        </div>

        {/* Emotions Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {allEmotions.map((emotion) => {
              const isSelected = selectedEmotions.has(emotion.name)
              
              return (
                <div
                  key={emotion.name}
                  onClick={() => handleEmotionSelect(emotion.name)}
                  className={`
                    cursor-pointer transition-all duration-300 transform hover:scale-105 rounded-2xl p-4 text-center
                    ${isSelected 
                      ? 'ring-4 ring-yellow-400 scale-105 shadow-lg' 
                      : 'hover:shadow-lg'
                    }
                    ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className={`bg-gradient-to-br ${emotion.color} rounded-2xl p-4 h-full flex flex-col items-center justify-center shadow-lg border-2 border-white border-opacity-20`}>
                    <div className="text-4xl mb-2">{emotion.emoji}</div>
                    <h3 className="text-white font-bold text-sm leading-tight" style={{ fontFamily: 'Fredoka' }}>
                      {emotion.name}
                    </h3>
                    
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1 shadow-lg">
                        <CheckCircle size={16} className="text-yellow-900" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Emotions Summary */}
        {selectedEmotions.size > 0 && (
          <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-xl p-4 mb-4">
            <h3 className="text-white font-bold mb-2 text-center" style={{ fontFamily: 'Fredoka' }}>
              Emociones Seleccionadas ({selectedEmotions.size})
            </h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {Array.from(selectedEmotions).map((emotionName) => {
                const emotion = allEmotions.find(e => e.name === emotionName)
                if (!emotion) return null
                
                return (
                  <div 
                    key={emotionName}
                    className="bg-white bg-opacity-20 rounded-full px-3 py-1 flex items-center gap-2"
                  >
                    <span className="text-lg">{emotion.emoji}</span>
                    <span className="text-white font-medium text-sm" style={{ fontFamily: 'Fredoka' }}>
                      {emotionName}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEmotionSelect(emotionName)
                      }}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-1"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={resetWidget}
            disabled={selectedEmotions.size === 0 || isSaving || isCompleted}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ fontFamily: 'Fredoka' }}
          >
            <X size={16} />
            LIMPIAR
          </button>
          
          <button
            onClick={handleSubmitEmotions}
            disabled={selectedEmotions.size === 0 || isSaving || isCompleted}
            className="flex-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            style={{ fontFamily: 'Fredoka', flex: '2' }}
          >
            <Save size={16} />
            {isSaving ? 'REGISTRANDO...' : 'REGISTRAR EMOCIONES'}
          </button>
        </div>

        {/* Completion Message */}
        {isCompleted && (
          <div className="mt-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-center border-2 border-white border-opacity-20 shadow-xl">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle size={20} className="text-white" />
              <h3 className="text-white font-bold" style={{ fontFamily: 'Fredoka' }}>
                ¡Emociones Registradas!
              </h3>
            </div>
            <p className="text-white text-opacity-90 text-sm" style={{ fontFamily: 'Comic Neue' }}>
              Tus emociones han sido guardadas en MindGoal
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 text-center">
          <p className="text-white text-opacity-80 text-xs" style={{ fontFamily: 'Comic Neue' }}>
            💡 Selecciona las emociones que has sentido y haz clic en "Registrar"
          </p>
        </div>
      </div>
    </div>
  )
}

export default StandaloneEmotionCalculator