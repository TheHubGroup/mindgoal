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
  Sparkles,
  ChevronLeft,
  ChevronRight,
  User
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lastLogDate, setLastLogDate] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Drag and swipe state
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState(0)
  const [swipeThreshold] = useState(50) // Minimum distance to trigger swipe

  useEffect(() => {
    // Optimize for iframe
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'auto'
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

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isCompleted || isAnimating) return
    
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setDragOffset(0)
    e.preventDefault()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isCompleted || isAnimating) return
    
    const deltaX = e.clientX - dragStart.x
    setDragOffset(deltaX)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || isCompleted || isAnimating) return
    
    const deltaX = e.clientX - dragStart.x
    
    // Determine swipe direction and trigger navigation
    if (Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0) {
        // Swiped right - go to previous emotion
        prevSlide()
      } else {
        // Swiped left - go to next emotion
        nextSlide()
      }
    }
    
    // Reset drag state
    setIsDragging(false)
    setDragStart({ x: 0, y: 0 })
    setDragOffset(0)
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
      setDragStart({ x: 0, y: 0 })
      setDragOffset(0)
    }
  }

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isCompleted || isAnimating) return
    
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX, y: touch.clientY })
    setDragOffset(0)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isCompleted || isAnimating) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - dragStart.x
    setDragOffset(deltaX)
    e.preventDefault()
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging || isCompleted || isAnimating) return
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - dragStart.x
    
    // Determine swipe direction and trigger navigation
    if (Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0) {
        // Swiped right - go to previous emotion
        prevSlide()
      } else {
        // Swiped left - go to next emotion
        nextSlide()
      }
    }
    
    // Reset drag state
    setIsDragging(false)
    setDragStart({ x: 0, y: 0 })
    setDragOffset(0)
  }

  const getVisibleEmotions = () => {
    const emotions = []
    for (let i = -1; i <= 1; i++) {
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
          notes: null
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
      }, 4000)
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
  const visibleEmotions = getVisibleEmotions()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Status messages */}
      {saveMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white rounded-lg shadow-lg p-3 border-l-4 border-green-500">
          <CheckCircle size={16} className="text-green-500" />
          <span className="font-medium text-gray-800 text-sm">{saveMessage}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="h-full flex flex-col p-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Calculator size={20} className="text-yellow-400" />
            <h1 className="text-xl font-black text-white tracking-tight" style={{ fontFamily: 'Fredoka' }}>
              CALCULADORA DE EMOCIONES
            </h1>
            <Sparkles size={20} className="text-yellow-400" />
          </div>
          
          <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-xl p-3 mb-4">
            <h2 className="text-base font-bold text-white mb-2" style={{ fontFamily: 'Fredoka' }}>
              ¿Qué emociones has sentido desde tu última visita a MindGoal?
            </h2>
            
            {lastLogDate && daysSinceLastLog !== null && (
              <div className="text-white text-opacity-90 text-xs" style={{ fontFamily: 'Comic Neue' }}>
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
              <div className="text-white text-opacity-90 text-xs" style={{ fontFamily: 'Comic Neue' }}>
                Este es tu primer registro de emociones
              </div>
            )}
          </div>
        </div>

        {/* Emotion Carousel */}
        <div className="flex-1 relative max-w-2xl mx-auto px-20">
          {/* Navigation Arrows - Más grandes y visibles */}
          <button 
            onClick={prevSlide}
            disabled={isCompleted}
            className="absolute -left-20 top-1/2 transform -translate-y-1/2 z-30 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-125 disabled:opacity-50 disabled:cursor-not-allowed border-4 border-white border-opacity-30"
          >
            <ChevronLeft size={32} />
          </button>
          
          <button 
            onClick={nextSlide}
            disabled={isCompleted}
            className="absolute -right-20 top-1/2 transform -translate-y-1/2 z-30 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-125 disabled:opacity-50 disabled:cursor-not-allowed border-4 border-white border-opacity-30"
          >
            <ChevronRight size={32} />
          </button>

          {/* Navigation Buttons with Text */}
          <button 
            onClick={prevSlide}
            disabled={isCompleted}
            className="absolute -left-8 top-1/2 transform -translate-y-1/2 z-20 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-3 rounded-xl shadow-xl transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white border-opacity-30 flex items-center gap-2"
            style={{ fontFamily: 'Fredoka' }}
          >
            <ChevronLeft size={20} />
            <span className="font-bold text-sm">Atrás</span>
          </button>
          
 

          {/* Navigation Buttons */}



          {/* Carousel */}
          <div 
            className={`relative h-80 overflow-visible ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Navigation Arrows - Left */}
            <button 
              onClick={prevSlide}
              disabled={isCompleted}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 z-30 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white p-3 rounded-full shadow-xl transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white border-opacity-30"
            >
              <ChevronLeft size={24} />
            </button>
            
            {/* Navigation Arrows - Right */}
            <button 
              onClick={nextSlide}
              disabled={isCompleted}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 z-30 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-3 rounded-full shadow-xl transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white border-opacity-30"
            >
              <ChevronRight size={24} />
            </button>

            {/* Navigation Buttons */}
            <button 
              onClick={prevSlide}
              disabled={isCompleted}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-3 py-2 rounded-lg shadow-xl transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white border-opacity-30 flex items-center gap-2"
              style={{ fontFamily: 'Fredoka' }}
            >
              <ChevronLeft size={18} />
              <span className="font-bold text-sm">Atrás</span>
            </button>
            
            <button 
              onClick={nextSlide}
              disabled={isCompleted}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-3 py-2 rounded-lg shadow-xl transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white border-opacity-30 flex items-center gap-2"
              style={{ fontFamily: 'Fredoka' }}
            >
              <span className="font-bold text-sm">Adelante</span>
              <ChevronRight size={18} />
            </button>

            {/* Navigation Arrows */}
            <button 
              onClick={prevSlide}
              disabled={isCompleted}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-20 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-3 rounded-xl shadow-xl transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white border-opacity-30 flex items-center gap-2"
              style={{ fontFamily: 'Fredoka' }}
            >
              <ChevronLeft size={20} />
              <span className="font-bold text-sm">Atrás</span>
            </button>
            
            <button 
              onClick={nextSlide}
              disabled={isCompleted}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-20 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-3 rounded-xl shadow-xl transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white border-opacity-30 flex items-center gap-2"
              style={{ fontFamily: 'Fredoka' }}
            >
              <span className="font-bold text-sm">Adelante</span>
              <ChevronRight size={20} />
            </button>

            {visibleEmotions.map((emotion) => {
              // Calculate transformations based on position
              let scale = 1
              let opacity = 1
              let zIndex = 10
              let translateX = 0
              
              if (emotion.position === 0) {
                scale = 1
                opacity = 1
                zIndex = 30
              } else if (Math.abs(emotion.position) === 1) {
                scale = 0.7
                opacity = 0.6
                zIndex = 20
                translateX = emotion.position > 0 ? 80 : -80
              }
              
              // Apply drag offset to center emotion
              if (emotion.position === 0 && isDragging) {
                translateX += dragOffset * 0.3 // Reduced sensitivity for better control
              }
              
              const isSelected = selectedEmotions.has(emotion.name)
              
              return (
                <div 
                  key={emotion.index}
                  className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all ease-in-out ${isDragging ? 'duration-75' : 'duration-300'}`}
                  style={{ 
                    transform: `translate(calc(-50% + ${translateX}px), -50%) scale(${scale})`,
                    opacity,
                    zIndex
                  }}
                >
                  <div 
                    className={`
                      w-72 h-80 rounded-3xl shadow-2xl overflow-hidden cursor-pointer
                      transition-all duration-300 transform select-none
                      ${isSelected ? 'ring-4 ring-yellow-400 scale-105' : ''}
                      ${isCompleted ? 'opacity-50 cursor-not-allowed' : ''}
                      ${isDragging && emotion.position === 0 ? 'cursor-grabbing' : 'cursor-grab'}
                    `}
                  >
                    <div 
                      className={`w-full h-full bg-gradient-to-br ${emotion.color} p-6 flex flex-col items-center justify-between`}
                      onClick={() => emotion.position === 0 && handleEmotionSelect(emotion.name)}
                    >
                      {/* Emoji */}
                      <div className="text-8xl mb-4">{emotion.emoji}</div>
                      
                      {/* Content */}
                      <div className="text-center">
                        <h3 className="text-3xl font-black text-white mb-3 tracking-tight" style={{ fontFamily: 'Fredoka' }}>
                          {emotion.name.toUpperCase()}
                        </h3>
                        <p className="text-white text-opacity-90 text-base mb-6" style={{ fontFamily: 'Comic Neue' }}>
                          {emotion.description}
                        </p>
                        
                        {/* Selection Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (emotion.position === 0) handleEmotionSelect(emotion.name)
                          }}
                          disabled={emotion.position !== 0 || isCompleted}
                          className={`
                            px-6 py-3 rounded-full font-bold text-base shadow-lg transition-all transform
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
                      
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg">
                          <CheckCircle size={20} className="text-green-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Slide Indicators */}
          <div className="flex justify-center gap-1 mt-4">
            {allEmotions.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                disabled={isCompleted}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentIndex === index 
                    ? 'bg-white w-8' 
                    : 'bg-white bg-opacity-40 hover:bg-opacity-70'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Selected Emotions Summary */}
        {selectedEmotions.size > 0 && (
          <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-xl p-3 mb-4">
            <h3 className="text-white font-bold mb-2 text-center text-sm" style={{ fontFamily: 'Fredoka' }}>
              Emociones Seleccionadas ({selectedEmotions.size})
            </h3>
            <div className="flex flex-wrap gap-1 justify-center">
              {Array.from(selectedEmotions).map((emotionName) => {
                const emotion = allEmotions.find(e => e.name === emotionName)
                if (!emotion) return null
                
                return (
                  <div 
                    key={emotionName}
                    className="bg-white bg-opacity-20 rounded-full px-2 py-1 flex items-center gap-1"
                  >
                    <span className="text-sm">{emotion.emoji}</span>
                    <span className="text-white font-medium text-xs" style={{ fontFamily: 'Fredoka' }}>
                      {emotionName}
                    </span>
                    <button
                      onClick={() => handleEmotionSelect(emotionName)}
                      disabled={isCompleted}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-0.5 disabled:opacity-50"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={resetWidget}
            disabled={selectedEmotions.size === 0 || isSaving || isCompleted}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 text-sm"
            style={{ fontFamily: 'Fredoka' }}
          >
            <X size={14} />
            LIMPIAR
          </button>
          
          <button
            onClick={handleSubmitEmotions}
            disabled={selectedEmotions.size === 0 || isSaving || isCompleted}
            className="flex-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-bold py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg flex items-center justify-center gap-1 text-sm"
            style={{ fontFamily: 'Fredoka', flex: '2' }}
          >
            <Save size={14} />
            {isSaving ? 'REGISTRANDO...' : 'REGISTRAR EMOCIONES'}
          </button>
        </div>

        {/* Completion Message */}
        {isCompleted && (
          <div className="mt-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3 text-center border-2 border-white border-opacity-20 shadow-xl">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle size={16} className="text-white" />
              <h3 className="text-white font-bold text-sm" style={{ fontFamily: 'Fredoka' }}>
                ¡Emociones Registradas!
              </h3>
            </div>
            <p className="text-white text-opacity-90 text-xs" style={{ fontFamily: 'Comic Neue' }}>
              Tus emociones han sido guardadas en MindGoal
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-2 text-center">
          <p className="text-white text-opacity-80 text-xs" style={{ fontFamily: 'Comic Neue' }}>
            💡 Usa las flechas, arrastra las tarjetas o haz clic para navegar
          </p>
        </div>
      </div>
    </div>
  )
}

export default StandaloneEmotionCalculator