import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import { emotionLogService, UserEmotionLog } from '../lib/emotionLogService'
import { 
  ArrowLeft, 
  Calculator, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Save,
  Sparkles,
  BarChart3,
  Heart,
  TrendingUp,
  Clock
} from 'lucide-react'

interface Emotion {
  name: string
  emoji: string
}

const allEmotions: Emotion[] = [
  { name: 'Alegría', emoji: '😊' },
  { name: 'Tristeza', emoji: '😢' },
  { name: 'Enojo', emoji: '😡' },
  { name: 'Miedo', emoji: '😨' },
  { name: 'Emoción', emoji: '🤩' },
  { name: 'Calma', emoji: '😌' },
  { name: 'Vergüenza', emoji: '😳' },
  { name: 'Confusión', emoji: '😕' },
  { name: 'Cariño', emoji: '🥰' },
  { name: 'Desilusión', emoji: '😞' }
]

const EmotionCalculatorPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedEmotions, setSelectedEmotions] = useState<Set<string>>(new Set())
  const [lastLogDate, setLastLogDate] = useState<string | null>(null)
  const [emotionStats, setEmotionStats] = useState({
    totalLogs: 0,
    uniqueEmotions: 0,
    mostFrequentEmotion: null as string | null,
    lastLogDate: null as string | null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const [lastDate, stats] = await Promise.all([
        emotionLogService.getLastEmotionLogDate(user.id),
        emotionLogService.getEmotionStats(user.id)
      ])
      
      setLastLogDate(lastDate)
      setEmotionStats(stats)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmotionSelect = (emotionName: string) => {
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
          intensity: 3, // Default intensity, can be expanded later
          notes: '' // Default notes, can be expanded later
        }))

      // Log each selected emotion
      for (const entry of logEntries) {
        await emotionLogService.logEmotion(entry)
      }

      setSaveMessage('¡Emociones registradas correctamente!')
      setSelectedEmotions(new Set()) // Clear selection after saving
      await loadUserData() // Update stats and last log date
      setTimeout(() => setSaveMessage(''), 3000)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-green-400 to-yellow-400 flex items-center justify-center">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
            Cargando calculadora de emociones...
          </p>
        </div>
      </div>
    )
  }

  const daysSinceLastLog = getDaysSinceLastLog()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-green-400 to-yellow-400">
      {/* Header */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <Calculator size={32} className="text-white" />
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              Calculadora de Emociones
            </h1>
          </div>
          <UserMenu />
        </div>
      </div>

      {/* Mensaje de estado */}
      {saveMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-white rounded-lg shadow-lg p-4 border-l-4 border-green-500">
          <CheckCircle size={20} className="text-green-500" />
          <span className="font-medium text-gray-800">{saveMessage}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Estadísticas del usuario */}
        {emotionStats.totalLogs > 0 && (
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-6 mb-8">
            <h3 className="text-2xl font-bold text-white mb-4 text-center flex items-center justify-center gap-2" style={{ fontFamily: 'Fredoka' }}>
              <BarChart3 size={24} />
              Tu Historial Emocional
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-white text-center">
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <div className="text-3xl font-bold text-blue-300">{emotionStats.totalLogs}</div>
                <div className="text-sm opacity-80">Registros Totales</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <div className="text-3xl font-bold text-green-300">{emotionStats.uniqueEmotions}</div>
                <div className="text-sm opacity-80">Emociones Diferentes</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <div className="text-2xl font-bold text-yellow-300">
                  {emotionStats.mostFrequentEmotion ? 
                    allEmotions.find(e => e.name === emotionStats.mostFrequentEmotion)?.emoji || '😊' 
                    : '😊'
                  }
                </div>
                <div className="text-sm opacity-80">Más Frecuente</div>
                <div className="text-xs opacity-70">{emotionStats.mostFrequentEmotion || 'N/A'}</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-2xl p-4">
                <div className="text-3xl font-bold text-purple-300">
                  {daysSinceLastLog !== null ? daysSinceLastLog : 0}
                </div>
                <div className="text-sm opacity-80">Días desde último registro</div>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
            ¿Cómo te sientes hoy? 🌈
          </h2>
          <p className="text-xl text-white text-opacity-90 max-w-2xl mx-auto" style={{ fontFamily: 'Comic Neue' }}>
            Selecciona las emociones que has sentido {lastLogDate ? 'desde tu última visita' : 'hoy'}.
          </p>
        </div>

        {lastLogDate && (
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-4 mb-8 text-center text-white">
            <div className="flex items-center justify-center gap-2">
              <Calendar size={20} />
              <span className="font-medium" style={{ fontFamily: 'Comic Neue' }}>
                Último registro: {new Date(lastLogDate).toLocaleDateString('es-ES', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </span>
            </div>
            {daysSinceLastLog !== null && daysSinceLastLog > 1 && (
              <div className="mt-2 flex items-center justify-center gap-2 text-yellow-300">
                <Clock size={16} />
                <span className="text-sm font-bold">
                  Han pasado {daysSinceLastLog} días desde tu último registro
                </span>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center flex items-center justify-center gap-2" style={{ fontFamily: 'Fredoka' }}>
            <Heart size={24} className="text-red-500" />
            Selecciona tus emociones:
          </h3>
          <div className="gri grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
            {allEmotions.map((emotion) => (
              <button
                key={emotion.name}
                onClick={() => handleEmotionSelect(emotion.name)}
                className={`
                  flex flex-col items-center justify-center p-4 rounded-xl border-4 transition-all duration-200
                  ${selectedEmotions.has(emotion.name)
                    ? 'border-blue-500 bg-blue-100 shadow-lg scale-105'
                    : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
                  }
                `}
              >
                <span className="text-4xl mb-2">{emotion.emoji}</span>
                <span className="text-sm font-semibold text-gray-700" style={{ fontFamily: 'Fredoka' }}>
                  {emotion.name}
                </span>
                {selectedEmotions.has(emotion.name) && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                    <CheckCircle size={14} className="text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmitEmotions}
            disabled={selectedEmotions.size === 0 || isSaving}
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-bold py-4 rounded-xl text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            style={{ fontFamily: 'Fredoka' }}
          >
            <Save size={24} />
            {isSaving ? 'Registrando...' : 'Registrar Emociones'}
          </button>
        </div>

        {/* Consejos */}
        <div className="mt-8 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
            <Sparkles size={20} className="text-yellow-300" />
            Consejos para el Registro de Emociones
          </h3>
          <div className="space-y-3 text-white" style={{ fontFamily: 'Comic Neue' }}>
            <p className="flex items-start gap-2">
              <span className="text-yellow-300 flex-shrink-0">✦</span>
              <span>Registra tus emociones regularmente para tener un mejor seguimiento.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-yellow-300 flex-shrink-0">✦</span>
              <span>Puedes seleccionar múltiples emociones en cada registro.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-yellow-300 flex-shrink-0">✦</span>
              <span>Reconocer tus emociones es el primer paso para gestionarlas mejor.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-yellow-300 flex-shrink-0">✦</span>
              <span>Con el tiempo, podrás ver patrones en tus emociones y entender mejor cómo te sientes.</span>
            </p>
          </div>
        </div>

        {/* Beneficios */}
        {emotionStats.totalLogs > 5 && (
          <div className="mt-8 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
              <TrendingUp size={20} className="text-green-300" />
              Tu Progreso Emocional
            </h3>
            <p className="text-white mb-4" style={{ fontFamily: 'Comic Neue' }}>
              ¡Felicidades! Has registrado tus emociones {emotionStats.totalLogs} veces. 
              Esto te ayuda a desarrollar mayor inteligencia emocional y autoconocimiento.
            </p>
            <div className="bg-white bg-opacity-10 rounded-xl p-4">
              <p className="text-white text-sm font-medium">
                Continúa registrando tus emociones para descubrir más patrones y tendencias en tu vida emocional.
              </p>
            </div>
          </div>
        )}

        {/* Fun Elements */}
        <div className="mt-8 text-center">
          <div className="flex justify-center gap-4 text-4xl">
            <span className="animate-pulse">😊</span>
            <span className="animate-pulse" style={{ animationDelay: '0.1s' }}>😢</span>
            <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>😡</span>
            <span className="animate-pulse" style={{ animationDelay: '0.3s' }}>🤩</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmotionCalculatorPage