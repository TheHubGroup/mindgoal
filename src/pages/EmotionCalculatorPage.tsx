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
  Clock,
  ChevronLeft,
  ChevronRight,
  Star,
  Zap,
  X
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

const EmotionCalculatorPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [selectedEmotions, setSelectedEmotions] = useState<Set<string>>(new Set())
  const [currentIndex, setCurrentIndex] = useState(0)
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
  const [isAnimating, setIsAnimating] = useState(false)

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

  const nextSlide = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev + 1) % allEmotions.length)
    setTimeout(() => setIsAnimating(false), 300)
  }

  const prevSlide = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev - 1 + allEmotions.length) % allEmotions.length)
    setTimeout(() => setIsAnimating(false), 300)
  }

  const goToSlide = (index: number) => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex(index)
    setTimeout(() => setIsAnimating(false), 300)
  }

  const getVisibleEmotions = () => {
    const emotions = []
    for (let i = -2; i <= 2; i++) {
      const index = (currentIndex + i + allEmotions.length) % allEmotions.length
      emotions.push({
        ...allEmotions[index],
        position: i,
        index
      })
    }
    return emotions
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
          notes: ''
        }))

      for (const entry of logEntries) {
        await emotionLogService.logEmotion(entry)
      }

      setSaveMessage('¡Emociones registradas correctamente!')
      setSelectedEmotions(new Set())
      await loadUserData()
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
  const visibleEmotions = getVisibleEmotions()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Efectos de fondo animados */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Partículas flotantes */}
        {[...Array(30)].map((_, i) => (
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
                <Calculator size={40} className="text-yellow-400" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Sparkles size={12} className="text-yellow-900" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight leading-none" style={{ fontFamily: 'Fredoka' }}>
                  CALCULADORA DE EMOCIONES
                </h1>
                <p className="text-white text-opacity-80" style={{ fontFamily: 'Comic Neue' }}>
                  Registra y explora tus sentimientos
                </p>
              </div>
            </div>
          </div>
          <UserMenu />
        </div>
      </div>

      {/* Mensaje de estado */}
      {saveMessage && (
        <div className="fixed top-24 right-4 z-50 flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl shadow-2xl p-4 border-4 border-white transform animate-bounce">
          <CheckCircle size={24} />
          <span className="font-black text-lg tracking-wide" style={{ fontFamily: 'Fredoka' }}>{saveMessage.toUpperCase()}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Estadísticas del usuario */}
        {emotionStats.totalLogs > 0 && (
          <div className="bg-black bg-opacity-20 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white border-opacity-10">
            <h3 className="text-3xl font-black text-white mb-6 text-center flex items-center justify-center gap-3" style={{ fontFamily: 'Fredoka' }}>
              <BarChart3 size={32} className="text-blue-400" />
              TU HISTORIAL EMOCIONAL
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-center border-4 border-white border-opacity-20 shadow-xl">
                <div className="text-4xl font-black text-white mb-2">{emotionStats.totalLogs}</div>
                <div className="text-white text-opacity-90 font-bold">REGISTROS TOTALES</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-center border-4 border-white border-opacity-20 shadow-xl">
                <div className="text-4xl font-black text-white mb-2">{emotionStats.uniqueEmotions}</div>
                <div className="text-white text-opacity-90 font-bold">EMOCIONES DIFERENTES</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-center border-4 border-white border-opacity-20 shadow-xl">
                <div className="text-4xl font-black text-white mb-2">
                  {emotionStats.mostFrequentEmotion ? 
                    allEmotions.find(e => e.name === emotionStats.mostFrequentEmotion)?.emoji || '😊' 
                    : '😊'
                  }
                </div>
                <div className="text-white text-opacity-90 font-bold">MÁS FRECUENTE</div>
                <div className="text-white text-opacity-70 text-sm font-bold">{emotionStats.mostFrequentEmotion || 'N/A'}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-center border-4 border-white border-opacity-20 shadow-xl">
                <div className="text-4xl font-black text-white mb-2">
                  {daysSinceLastLog !== null ? daysSinceLastLog : 0}
                </div>
                <div className="text-white text-opacity-90 font-bold">DÍAS DESDE ÚLTIMO</div>
              </div>
            </div>
          </div>
        )}

        {/* Título principal */}
        <div className="text-center mb-12">
          <h2 className="text-5xl font-black text-white mb-6 tracking-tight" style={{ fontFamily: 'Fredoka' }}>
            ¿CÓMO TE SIENTES HOY?
          </h2>
          <div className="flex items-center justify-center gap-3 text-2xl text-white text-opacity-90 max-w-3xl mx-auto" style={{ fontFamily: 'Comic Neue' }}>
            <Heart size={32} className="text-red-400" />
            <span>Desliza por las emociones y selecciona las que sientes</span>
            <Zap size={32} className="text-yellow-400" />
          </div>
        </div>

        {/* Carrusel de Emociones */}
        <div className="relative max-w-5xl mx-auto mb-16">
          {/* Botones de Navegación */}
          <button 
            onClick={prevSlide}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-white bg-opacity-20 hover:bg-opacity-40 backdrop-blur-sm text-white p-4 rounded-full shadow-lg transition-all hover:scale-110"
          >
            <ChevronLeft size={32} />
          </button>
          
          <button 
            onClick={nextSlide}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-white bg-opacity-20 hover:bg-opacity-40 backdrop-blur-sm text-white p-4 rounded-full shadow-lg transition-all hover:scale-110"
          >
            <ChevronRight size={32} />
          </button>

          {/* Carrusel */}
          <div className="relative h-[500px] overflow-visible">
            {visibleEmotions.map((emotion) => {
              // Calcular transformaciones basadas en la posición
              let scale = 1
              let opacity = 1
              let zIndex = 10
              let translateY = 0
              
              if (emotion.position === 0) {
                scale = 1
                opacity = 1
                zIndex = 30
              } else if (Math.abs(emotion.position) === 1) {
                scale = 0.85
                opacity = 0.7
                zIndex = 20
                translateY = emotion.position > 0 ? 30 : -30
              } else {
                scale = 0.7
                opacity = 0.4
                zIndex = 10
                translateY = emotion.position > 0 ? 60 : -60
              }
              
              const isSelected = selectedEmotions.has(emotion.name)
              
              return (
                <div 
                  key={emotion.index}
                  className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out`}
                  style={{ 
                    transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
                    opacity,
                    zIndex
                  }}
                >
                  <div 
                    className={`
                      w-[320px] h-[420px] rounded-3xl shadow-2xl overflow-hidden
                      transition-all duration-300 transform
                      ${isSelected ? 'ring-8 ring-yellow-400 scale-105' : ''}
                    `}
                  >
                    <div className={`w-full h-full bg-gradient-to-br ${emotion.color} p-8 flex flex-col items-center justify-between`}>
                      {/* Emoji grande */}
                      <div className="text-9xl mb-4">{emotion.emoji}</div>
                      
                      {/* Nombre de la emoción */}
                      <div className="text-center">
                        <h3 className="text-4xl font-black text-white mb-4 tracking-tight" style={{ fontFamily: 'Fredoka' }}>
                          {emotion.name.toUpperCase()}
                        </h3>
                        <p className="text-white text-opacity-90 text-xl mb-6" style={{ fontFamily: 'Comic Neue' }}>
                          {emotion.description}
                        </p>
                        
                        {/* Botón de selección */}
                        <button
                          onClick={() => emotion.position === 0 && handleEmotionSelect(emotion.name)}
                          disabled={emotion.position !== 0}
                          className={`
                            px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all transform
                            ${emotion.position === 0 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
                            ${isSelected 
                              ? 'bg-white text-purple-600 hover:bg-gray-100' 
                              : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                            }
                          `}
                          style={{ fontFamily: 'Fredoka' }}
                        >
                          {isSelected ? '✓ SELECCIONADA' : 'SELECCIONAR'}
                        </button>
                      </div>
                      
                      {/* Indicador de seleccionado */}
                      {isSelected && (
                        <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg">
                          <CheckCircle size={24} className="text-green-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Indicadores de posición */}
          <div className="flex justify-center gap-2 mt-8">
            {allEmotions.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentIndex === index 
                    ? 'bg-white w-8' 
                    : 'bg-white bg-opacity-30 hover:bg-opacity-50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Emociones seleccionadas */}
        <div className="bg-black bg-opacity-30 backdrop-blur-lg rounded-3xl p-8 mb-8 border border-white border-opacity-10">
          <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2" style={{ fontFamily: 'Fredoka' }}>
            <Heart size={24} className="text-red-400" />
            Emociones Seleccionadas:
          </h3>
          
          {selectedEmotions.size > 0 ? (
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              {Array.from(selectedEmotions).map((emotionName) => {
                const emotion = allEmotions.find(e => e.name === emotionName)
                if (!emotion) return null
                
                return (
                  <div 
                    key={emotionName}
                    className={`bg-gradient-to-br ${emotion.color} rounded-2xl p-4 flex items-center gap-3 shadow-lg border-2 border-white border-opacity-20`}
                  >
                    <span className="text-3xl">{emotion.emoji}</span>
                    <span className="text-white font-bold" style={{ fontFamily: 'Fredoka' }}>{emotionName}</span>
                    <button
                      onClick={() => handleEmotionSelect(emotionName)}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-1"
                    >
                      <X size={16} className="text-white" />
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center text-white text-opacity-70 mb-8" style={{ fontFamily: 'Comic Neue' }}>
              <p className="text-xl mb-4">No has seleccionado ninguna emoción todavía</p>
              <div className="flex justify-center gap-4 text-4xl">
                <span className="animate-bounce">👆</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>👆</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>👆</span>
              </div>
            </div>
          )}
          
          <button
            onClick={handleSubmitEmotions}
            disabled={selectedEmotions.size === 0 || isSaving}
            className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-bold py-4 rounded-xl text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
            style={{ fontFamily: 'Fredoka' }}
          >
            <Save size={24} />
            {isSaving ? 'REGISTRANDO...' : 'REGISTRAR EMOCIONES'}
          </button>
        </div>

        {/* Información sobre último registro */}
        {lastLogDate && (
          <div className="bg-black bg-opacity-20 backdrop-blur-lg rounded-3xl p-6 mb-8 border border-white border-opacity-10 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Calendar size={24} className="text-blue-400" />
              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                TU ÚLTIMO REGISTRO
              </h3>
            </div>
            <p className="text-white text-xl mb-2" style={{ fontFamily: 'Comic Neue' }}>
              {new Date(lastLogDate).toLocaleDateString('es-ES', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
            {daysSinceLastLog !== null && daysSinceLastLog > 1 && (
              <div className="flex items-center justify-center gap-2 text-yellow-400 font-bold">
                <Clock size={20} />
                <span>
                  Han pasado {daysSinceLastLog} días desde tu último registro
                </span>
              </div>
            )}
          </div>
        )}

        {/* Consejos */}
        <div className="bg-black bg-opacity-20 backdrop-blur-lg rounded-3xl p-8 border border-white border-opacity-10">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'Fredoka' }}>
            <Sparkles size={24} className="text-yellow-400" />
            CONSEJOS PARA EL REGISTRO DE EMOCIONES
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white bg-opacity-10 rounded-2xl p-6 border border-white border-opacity-20 transform transition-all hover:scale-105 hover:bg-opacity-15">
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-full p-3 text-white">
                  <Star size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Fredoka' }}>
                    Registro Regular
                  </h4>
                  <p className="text-white text-opacity-90" style={{ fontFamily: 'Comic Neue' }}>
                    Registra tus emociones diariamente para tener un mejor seguimiento de tus patrones emocionales.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-10 rounded-2xl p-6 border border-white border-opacity-20 transform transition-all hover:scale-105 hover:bg-opacity-15">
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-full p-3 text-white">
                  <Zap size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Fredoka' }}>
                    Múltiples Emociones
                  </h4>
                  <p className="text-white text-opacity-90" style={{ fontFamily: 'Comic Neue' }}>
                    Puedes seleccionar varias emociones en cada registro. ¡A veces sentimos más de una a la vez!
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-10 rounded-2xl p-6 border border-white border-opacity-20 transform transition-all hover:scale-105 hover:bg-opacity-15">
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full p-3 text-white">
                  <Heart size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Fredoka' }}>
                    Autoconocimiento
                  </h4>
                  <p className="text-white text-opacity-90" style={{ fontFamily: 'Comic Neue' }}>
                    Reconocer tus emociones es el primer paso para gestionarlas mejor y desarrollar inteligencia emocional.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-10 rounded-2xl p-6 border border-white border-opacity-20 transform transition-all hover:scale-105 hover:bg-opacity-15">
              <div className="flex items-start gap-3">
                <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-full p-3 text-white">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Fredoka' }}>
                    Patrones Emocionales
                  </h4>
                  <p className="text-white text-opacity-90" style={{ fontFamily: 'Comic Neue' }}>
                    Con el tiempo, podrás ver patrones en tus emociones y entender mejor cómo te sientes en diferentes situaciones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Beneficios */}
        {emotionStats.totalLogs > 5 && (
          <div className="mt-8 bg-black bg-opacity-20 backdrop-blur-lg rounded-3xl p-8 border border-white border-opacity-10">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'Fredoka' }}>
              <TrendingUp size={24} className="text-green-400" />
              TU PROGRESO EMOCIONAL
            </h3>
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 border-2 border-white border-opacity-20 shadow-xl">
              <p className="text-white text-xl mb-4" style={{ fontFamily: 'Comic Neue' }}>
                ¡Felicidades! Has registrado tus emociones {emotionStats.totalLogs} veces. 
                Esto te ayuda a desarrollar mayor inteligencia emocional y autoconocimiento.
              </p>
              <div className="bg-white bg-opacity-20 rounded-xl p-4">
                <p className="text-white font-bold">
                  Continúa registrando tus emociones para descubrir más patrones y tendencias en tu vida emocional.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Fun Elements */}
        <div className="mt-12 text-center">
          <div className="flex justify-center gap-6 text-6xl">
            <span className="animate-pulse">😊</span>
            <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>😢</span>
            <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>😡</span>
            <span className="animate-pulse" style={{ animationDelay: '0.6s' }}>🤩</span>
            <span className="animate-pulse" style={{ animationDelay: '0.8s' }}>😌</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmotionCalculatorPage