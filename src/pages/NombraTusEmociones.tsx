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
  ThumbsUp
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

  useEffect(() => {
    // Mezclar las emociones al cargar
    shuffleGame()
    loadUserStats()
  }, [user])

  const shuffleGame = () => {
    const shuffledEmotionsList = [...emotions].sort(() => Math.random() - 0.5)
    const shuffledNamesList = [...emotions.map(e => e.name)].sort(() => Math.random() - 0.5)
    
    setShuffledEmotions(shuffledEmotionsList)
    setShuffledNames(shuffledNamesList)
    setMatchedEmotions(new Set())
  }

  const loadUserStats = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const stats = await emotionMatchService.getUserStats(user.id)
      setGameStats(stats)
    } catch (error) {
      console.error('Error loading user stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragStart = (emotionName: string) => {
    setCurrentDraggedEmotion(emotionName)
  }

  const handleImageClick = (emotion: Emotion) => {
    setShowImageModal(emotion)
  }

  const handleDrop = async (droppedEmotion: string, targetEmotion: string) => {
    const isCorrect = droppedEmotion === targetEmotion
    
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
        
        // Guardar que se mostró la explicación
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
  }

  const resetGame = () => {
    shuffleGame()
  }

  const isGameComplete = matchedEmotions.size === emotions.length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 flex items-center justify-center">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
            Cargando emociones...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400">
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
            <Heart size={32} className="text-white" />
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              Nombra tus Emociones
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={resetGame}
              className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-full font-bold transition-all transform hover:scale-105"
            >
              <RotateCcw size={20} />
              Reiniciar
            </button>
            <UserMenu />
          </div>
        </div>
      </div>

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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Instrucciones */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
            ¡Conecta cada imagen con su emoción! 🎯
          </h2>
          <p className="text-xl text-white text-opacity-90 max-w-3xl mx-auto" style={{ fontFamily: 'Comic Neue' }}>
            Arrastra las imágenes de los niños hacia el nombre de la emoción que están mostrando. 
            <span className="font-bold"> Haz click en las imágenes para verlas más grandes.</span>
          </p>
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
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-lg w-full border-4 border-purple-500 relative">
            <button
              onClick={() => setShowImageModal(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-gray-100 rounded-full p-2 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-purple-600 mb-4" style={{ fontFamily: 'Fredoka' }}>
                Observa la Emoción
              </h3>
              
              {/* Imagen grande */}
              <div className="w-full h-64 rounded-2xl overflow-hidden mb-4 bg-gray-100">
                <img
                  src={showImageModal.imageUrl}
                  alt={`Niño/a mostrando ${showImageModal.name}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-8xl">${showImageModal.emoji}</div>`
                    }
                  }}
                />
              </div>
              
              <div className="text-6xl mb-4">{showImageModal.emoji}</div>
              
              <p className="text-gray-700 text-lg leading-relaxed" style={{ fontFamily: 'Comic Neue' }}>
                ¿Qué emoción crees que está mostrando este niño/a? 
                <br />
                <span className="font-bold text-purple-600">¡Arrastra la imagen hacia el nombre correcto!</span>
              </p>
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
              
              <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Comic Neue' }}>
                {showExplanation.emotion.explanation}
              </p>
              
              <div className="mt-6 flex justify-center gap-4 text-3xl">
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
}

export default NombraTusEmociones