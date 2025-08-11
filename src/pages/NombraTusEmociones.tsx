import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import EmotionImageCard from '../components/EmotionImageCard'
import EmotionNameCard from '../components/EmotionNameCard'
import { emotionMatchService } from '../lib/emotionMatchService'
import { 
  ArrowLeft, 
  Heart, 
  Star,
  Trophy,
  RotateCcw,
  CheckCircle,
  Target,
  Sparkles,
  X,
  ThumbsUp,
  ZoomIn,
  Play,
  RefreshCw,
  Save
} from 'lucide-react'

interface Emotion {
  name: string
  emoji: string
  imageUrl: string
  explanation: string
}

const NombraTusEmociones = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Definición de las 10 emociones con imágenes de niños
  const emotions: Emotion[] = [
    {
      name: 'Alegría',
      emoji: '😊',
      imageUrl: 'https://images.pexels.com/photos/1001914/pexels-photo-1001914.jpeg?auto=compress&cs=tinysrgb&w=400',
      explanation: 'Cuando algo les gusta mucho o se divierten.'
    },
    {
      name: 'Tristeza',
      emoji: '😢',
      imageUrl: 'https://images.pexels.com/photos/256658/pexels-photo-256658.jpeg?auto=compress&cs=tinysrgb&w=400',
      explanation: 'Al perder algo, extrañar a alguien o cuando algo no sale como esperaban.'
    },
    {
      name: 'Enojo',
      emoji: '😡',
      imageUrl: 'https://images.pexels.com/photos/4546116/pexels-photo-4546116.jpeg?auto=compress&cs=tinysrgb&w=400',
      explanation: 'Cuando se sienten frustrados o creen que algo es injusto.'
    },
    {
      name: 'Miedo',
      emoji: '😨',
      imageUrl: 'https://images.pexels.com/photos/3933069/pexels-photo-3933069.jpeg?auto=compress&cs=tinysrgb&w=400',
      explanation: 'Por cosas desconocidas, oscuridad, cambios o situaciones nuevas.'
    },
    {
      name: 'Emoción',
      emoji: '🤩',
      imageUrl: 'https://images.pexels.com/photos/5200815/pexels-photo-5200815.jpeg?auto=compress&cs=tinysrgb&w=400',
      explanation: 'Al esperar algo que les gusta mucho, como un paseo o una fiesta.'
    },
    {
      name: 'Calma',
      emoji: '😌',
      imageUrl: 'https://images.pexels.com/photos/5624239/pexels-photo-5624239.jpeg?auto=compress&cs=tinysrgb&w=400',
      explanation: 'Cuando se sienten tranquilos y en paz, como después de leer o escuchar música.'
    },
    {
      name: 'Vergüenza',
      emoji: '😳',
      imageUrl: 'https://images.pexels.com/photos/8489335/pexels-photo-8489335.jpeg?auto=compress&cs=tinysrgb&w=400',
      explanation: 'Cuando cometen un error o son el centro de atención y no les gusta.'
    },
    {
      name: 'Confusión',
      emoji: '😕',
      imageUrl: 'https://images.pexels.com/photos/3536480/pexels-photo-3536480.jpeg?auto=compress&cs=tinysrgb&w=400',
      explanation: 'Cuando no entienden algo que sucede a su alrededor o una tarea difícil.'
    },
    {
      name: 'Cariño',
      emoji: '🥰',
      imageUrl: 'https://images.pexels.com/photos/7648150/pexels-photo-7648150.jpeg?auto=compress&cs=tinysrgb&w=400',
      explanation: 'Por su familia, amigos o mascotas, cuando se sienten queridos y seguros.'
    },
    {
      name: 'Desilusión',
      emoji: '😞',
      imageUrl: 'https://images.pexels.com/photos/8419214/pexels-photo-8419214.jpeg?auto=compress&cs=tinysrgb&w=400',
      explanation: 'Cuando algo que esperaban no sucede como querían.'
    }
  ]

  const [matchedEmotions, setMatchedEmotions] = useState<Set<string>>(new Set())
  const [currentDraggedEmotion, setCurrentDraggedEmotion] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState<{emotion: Emotion, show: boolean} | null>(null)
  const [showImageModal, setShowImageModal] = useState<Emotion | null>(null)
  const [showEncouragement, setShowEncouragement] = useState<{show: boolean, droppedEmotion: string, targetEmotion: string} | null>(null)
  const [shuffledEmotions, setShuffledEmotions] = useState<Emotion[]>([])
  const [shuffledNames, setShuffledNames] = useState<string[]>([])
  const [gameStats, setGameStats] = useState({
    totalAttempts: 0,
    correctMatches: 0,
    accuracy: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showWelcomeBack, setShowWelcomeBack] = useState(false)
  const [hasProgress, setHasProgress] = useState(false)
  const [isSavingProgress, setIsSavingProgress] = useState(false)

  useEffect(() => {
    if (user) {
      loadUserProgress()
    }
  }, [user])

  // Función para cargar el progreso del usuario
  const loadUserProgress = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const progress = await emotionMatchService.getUserProgress(user.id)
      const completedEmotions = progress.completedEmotions
      
      // Configurar el estado del juego basado en el progreso guardado
      setMatchedEmotions(new Set(completedEmotions))
      setGameStats({
        totalAttempts: progress.totalAttempts,
        correctMatches: progress.correctMatches,
        accuracy: progress.accuracy
      })

      // Si tiene progreso previo, mostrar mensaje de bienvenida
      if (completedEmotions.length > 0) {
        setHasProgress(true)
        setShowWelcomeBack(true)
      }

      // Mezclar las emociones (manteniendo las completadas marcadas)
      shuffleGame(completedEmotions)
      
    } catch (error) {
      console.error('Error loading user progress:', error)
      // Si hay error, empezar juego nuevo
      shuffleGame()
    } finally {
      setIsLoading(false)
    }
  }

  const shuffleGame = (completedEmotions: string[] = []) => {
    const shuffledEmotionsList = [...emotions].sort(() => Math.random() - 0.5)
    const shuffledNamesList = [...emotions.map(e => e.name)].sort(() => Math.random() - 0.5)
    
    setShuffledEmotions(shuffledEmotionsList)
    setShuffledNames(shuffledNamesList)
    
    // Solo resetear si no hay emociones completadas
    if (completedEmotions.length === 0) {
      setMatchedEmotions(new Set())
    }
  }

  const handleDragStart = (emotionName: string) => {
    setCurrentDraggedEmotion(emotionName)
  }

  const handleImageClick = (emotion: Emotion) => {
    console.log('handleImageClick called with:', emotion.name)
    setShowImageModal(emotion)
  }

  const handleDrop = async (droppedEmotion: string, targetEmotion: string) => {
    const isCorrect = droppedEmotion === targetEmotion
    
    // Mostrar indicador de guardado
    setIsSavingProgress(true)
    
    // Guardar el resultado en la base de datos
    if (user) {
      await emotionMatchService.saveMatchResult(droppedEmotion, isCorrect, false)
    }

    if (isCorrect) {
      // Match correcto
      setMatchedEmotions(prev => new Set([...prev, droppedEmotion]))
      
      // Mostrar explicación
      const emotion = emotions.find(e => e.name === droppedEmotion)
      if (emotion) {
        setShowExplanation({ emotion, show: true })
        
        // Guardar que se mostró la explicación (esto marca la emoción como completada)
        if (user) {
          await emotionMatchService.saveMatchResult(droppedEmotion, true, true)
        }
        
        // Ocultar explicación después de 4 segundos
        setTimeout(() => {
          setShowExplanation(null)
        }, 4000)
      }
    } else {
      // Match incorrecto - mostrar mensaje de aliento
      setShowEncouragement({
        show: true,
        droppedEmotion,
        targetEmotion
      })
      
      // Ocultar mensaje de aliento después de 3 segundos
      setTimeout(() => {
        setShowEncouragement(null)
      }, 3000)
    }

    // Actualizar estadísticas
    await loadUserStats()
    setCurrentDraggedEmotion(null)
    setIsSavingProgress(false)
  }

  const loadUserStats = async () => {
    if (!user) return
    
    try {
      const stats = await emotionMatchService.getUserStats(user.id)
      setGameStats(stats)
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  const resetGame = async () => {
    if (!user) return
    
    const confirmReset = window.confirm('¿Estás seguro de que quieres reiniciar tu progreso? Se perderán todas las emociones completadas.')
    
    if (confirmReset) {
      setIsLoading(true)
      try {
        await emotionMatchService.resetUserProgress(user.id)
        setMatchedEmotions(new Set())
        setGameStats({
          totalAttempts: 0,
          correctMatches: 0,
          accuracy: 0
        })
        setHasProgress(false)
        shuffleGame()
      } catch (error) {
        console.error('Error resetting game:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const startNewGame = () => {
    shuffleGame()
    setShowWelcomeBack(false)
  }

  const continueGame = () => {
    setShowWelcomeBack(false)
  }

  const isGameComplete = matchedEmotions.size === emotions.length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 flex items-center justify-center">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
            Cargando tu progreso...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400">
      {/* Modal de Bienvenida de Regreso */}
      {showWelcomeBack && hasProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border-4 border-purple-500 relative">
            <div className="text-center">
              <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy size={40} className="text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-purple-600 mb-4" style={{ fontFamily: 'Fredoka' }}>
                ¡Bienvenido de Vuelta!
              </h3>
              
              <p className="text-gray-700 leading-relaxed mb-4" style={{ fontFamily: 'Comic Neue' }}>
                Ya tienes <span className="font-bold text-purple-600">{matchedEmotions.size} de 10</span> emociones completadas.
              </p>
              
              <div className="bg-purple-50 rounded-2xl p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-bold text-purple-600">{gameStats.correctMatches}</div>
                    <div className="text-gray-600">Aciertos</div>
                  </div>
                  <div>
                    <div className="font-bold text-green-600">{gameStats.accuracy}%</div>
                    <div className="text-gray-600">Precisión</div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={continueGame}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-3 rounded-full font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Fredoka' }}
                >
                  <Play size={20} />
                  Continuar
                </button>
                <button
                  onClick={startNewGame}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-full font-bold transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  style={{ fontFamily: 'Fredoka' }}
                >
                  <RefreshCw size={20} />
                  Mezclar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-white text-center">
            <div>
              <div className="text-2xl font-bold">{gameStats.totalAttempts}</div>
              <div className="text-sm opacity-80">Intentos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-300">{gameStats.correctMatches}</div>
              <div className="text-sm opacity-80">Correctos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-300">{gameStats.accuracy}%</div>
              <div className="text-sm opacity-80">Precisión</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-300">{matchedEmotions.size}/10</div>
              <div className="text-sm opacity-80">Completadas</div>
            </div>
          </div>
          
          {/* Barra de progreso */}
          <div className="mt-4">
            <div className="flex justify-between text-white text-sm mb-2">
              <span>Progreso General</span>
              <span>{Math.round((matchedEmotions.size / emotions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(matchedEmotions.size / emotions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Instrucciones */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
            ¡Conecta cada imagen con su emoción! 🎯
          </h2>
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-4 max-w-4xl mx-auto">
            <p className="text-lg text-white text-opacity-95 mb-2" style={{ fontFamily: 'Comic Neue' }}>
              Arrastra las imágenes de los niños hacia el nombre de la emoción que están mostrando.
            </p>
            <div className="flex items-center justify-center gap-2 text-yellow-300 font-bold">
              <ZoomIn size={20} />
              <span style={{ fontFamily: 'Fredoka' }}>¡Haz click en las imágenes para verlas más grandes!</span>
            </div>
            {hasProgress && (
              <div className="mt-2 text-green-300 font-bold text-sm">
                💾 Tu progreso se guarda automáticamente
              </div>
            )}
          </div>
        </div>

        {/* Área de juego */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Columna de imágenes */}
          <div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-6">
              <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                <Star size={24} />
                Imágenes de Emociones
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {shuffledEmotions.map((emotion) => (
                  <EmotionImageCard
                    key={emotion.name}
                    emotion={emotion}
                    onDragStart={handleDragStart}
                    onImageClick={handleImageClick}
                    isMatched={matchedEmotions.has(emotion.name)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Columna de nombres */}
          <div>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-6">
              <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                <Target size={24} />
                Nombres de Emociones
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {shuffledNames.map((emotionName) => (
                  <EmotionNameCard
                    key={emotionName}
                    emotionName={emotionName}
                    onDrop={handleDrop}
                    isMatched={matchedEmotions.has(emotionName)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de completado */}
        {isGameComplete && (
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl p-8 max-w-2xl mx-auto border-4 border-white shadow-2xl">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Trophy size={48} className="text-yellow-300" />
                <h3 className="text-3xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                  ¡Felicitaciones!
                </h3>
                <Trophy size={48} className="text-yellow-300" />
              </div>
              <p className="text-xl text-white mb-4" style={{ fontFamily: 'Comic Neue' }}>
                Has completado todas las emociones correctamente. ¡Eres un experto en reconocer emociones!
              </p>
              <div className="bg-white bg-opacity-20 rounded-2xl p-4 mb-6">
                <div className="grid grid-cols-3 gap-4 text-white">
                  <div>
                    <div className="text-2xl font-bold">{gameStats.totalAttempts}</div>
                    <div className="text-sm">Intentos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{gameStats.correctMatches}</div>
                    <div className="text-sm">Aciertos</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{gameStats.accuracy}%</div>
                    <div className="text-sm">Precisión</div>
                  </div>
                </div>
              </div>
              <button
                onClick={resetGame}
                className="bg-white text-green-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105"
              >
                Jugar de Nuevo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de imagen ampliada */}
      {showImageModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowImageModal(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full border-4 border-purple-500 relative transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImageModal(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full p-3 transition-all transform hover:scale-110 z-10"
            >
              <X size={24} />
            </button>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-6">
                <ZoomIn size={32} className="text-purple-600" />
                <h3 className="text-3xl font-bold text-purple-600" style={{ fontFamily: 'Fredoka' }}>
                  Observa la Emoción
                </h3>
              </div>
              
              <div className="w-full max-w-md mx-auto h-80 rounded-2xl overflow-hidden mb-6 bg-gray-100 shadow-lg border-4 border-purple-200">
                <img
                  src={showImageModal.imageUrl}
                  alt={`Niño/a mostrando ${showImageModal.name}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center text-9xl bg-gradient-to-br from-purple-100 to-pink-100">
                          ${showImageModal.emoji}
                        </div>
                      `
                    }
                  }}
                />
              </div>
              
              <div className="text-8xl mb-6 animate-bounce">{showImageModal.emoji}</div>
              
              <div className="bg-purple-50 rounded-2xl p-6 border-2 border-purple-200">
                <p className="text-gray-700 text-xl leading-relaxed mb-4" style={{ fontFamily: 'Comic Neue' }}>
                  ¿Qué emoción crees que está mostrando este niño/a?
                </p>
                <div className="flex items-center justify-center gap-2 text-purple-600 font-bold text-lg">
                  <Target size={24} />
                  <span style={{ fontFamily: 'Fredoka' }}>¡Arrastra la imagen hacia el nombre correcto!</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowImageModal(null)}
                className="mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3 rounded-full font-bold text-lg transition-all transform hover:scale-105"
                style={{ fontFamily: 'Fredoka' }}
              >
                ¡Entendido!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de explicación */}
      {showExplanation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border-4 border-green-500 relative">
            <button
              onClick={() => setShowExplanation(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} className="text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-green-600 mb-2" style={{ fontFamily: 'Fredoka' }}>
                ¡Correcto!
              </h3>
              
              <div className="text-4xl mb-4">{showExplanation.emotion.emoji}</div>
              
              <h4 className="text-xl font-bold text-gray-800 mb-3" style={{ fontFamily: 'Fredoka' }}>
                {showExplanation.emotion.name}
              </h4>
              
              <p className="text-gray-700 leading-relaxed mb-4" style={{ fontFamily: 'Comic Neue' }}>
                {showExplanation.emotion.explanation}
              </p>
              
              <div className="bg-green-50 rounded-lg p-3 mb-4">
                <p className="text-green-700 text-sm font-medium">
                  💾 Progreso guardado automáticamente
                </p>
              </div>
              
              <div className="flex justify-center gap-4 text-3xl">
                <span className="animate-bounce">🎉</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>⭐</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🎊</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de aliento para respuestas incorrectas */}
      {showEncouragement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border-4 border-orange-400 relative">
            <button
              onClick={() => setShowEncouragement(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <ThumbsUp size={40} className="text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-orange-600 mb-4" style={{ fontFamily: 'Fredoka' }}>
                ¡Estuviste Cerca!
              </h3>
              
              <p className="text-gray-700 leading-relaxed mb-4" style={{ fontFamily: 'Comic Neue' }}>
                No era <span className="font-bold text-orange-600">{showEncouragement.targetEmotion}</span>, 
                pero <span className="font-bold text-purple-600">{showEncouragement.droppedEmotion}</span> también es una emoción importante.
              </p>
              
              <p className="text-lg font-bold text-gray-800 mb-4" style={{ fontFamily: 'Fredoka' }}>
                ¡Inténtalo de nuevo! 💪
              </p>
              
              <div className="flex justify-center gap-4 text-3xl">
                <span className="animate-pulse">🌟</span>
                <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>💪</span>
                <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>🎯</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
      {/* Header moved to bottom */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <Heart size={32} className="text-white" />
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              Nombra tus Emociones
            </h1>
            {/* Indicador de guardado */}
            {isSavingProgress && (
              <div className="flex items-center gap-2 bg-white bg-opacity-20 rounded-full px-3 py-1">
                <Save size={16} className="text-white animate-pulse" />
                <span className="text-white text-sm font-medium">Guardando...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={resetGame}
              className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-full font-bold transition-all transform hover:scale-105"
            >
              <RotateCcw size={20} />
              Reiniciar Todo
            </button>
            <UserMenu />
          </div>
        </div>
      </div>
}

export default NombraTusEmociones