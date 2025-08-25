import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import { problemaResueltoService, ProblemaResueltoSession } from '../lib/problemaResueltoService'
import { 
  ArrowLeft, 
  Brain, 
  Plus,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  Award,
  X,
  Shield,
  Users,
  Heart,
  Target,
  Zap
} from 'lucide-react'

interface Problem {
  id: string
  title: string
  imageUrl: string
  description: string
  type: 'conflicto_otros' | 'conflicto_personal'
  resilientResponse: {
    text: string
    feedback: string
  }
  impulsiveResponse: {
    text: string
    feedback: string
  }
}

// Problemas predefinidos (reemplazar con las imágenes y textos reales)
const problems: Problem[] = [
  {
    id: 'conflicto_otros_1', 
    title: 'Conflicto con Compañero de Clase',
    imageUrl: '/Gemini_Generated_Image_bwdal1bwdal1bwda.png',
    description: 'Estás en clase y necesitas un marcador para tu trabajo en grupo. Le pides a tu compañero, pero él te dice: "¡No! Yo lo necesito".',
    type: 'conflicto_otros',
    resilientResponse: {
      text: 'Respiras y le dices con calma: "Entiendo que lo necesites, ¿podemos turnarnos para usarlo?"',
      feedback: '¡Excelente! Usaste la comunicación para buscar una solución. Eso demuestra empatía y colaboración.'
    },
    impulsiveResponse: {
      text: 'Te enojas y le gritas: "¡Qué egoísta eres!"',
      feedback: 'Reaccionar con enojo puede empeorar la situación y romper la amistad. ¿Cómo crees que se sintió tu compañero?'
    }
  },
  {
    id: 'conflicto_otros_2',
    title: 'Acusación Falsa en el Juego',
    imageUrl: '/Gemini_Generated_Image_nt24l0nt24l0nt24.png',
    description: 'En el recreo, un amigo te acusa de hacer trampa en un juego, aunque no fue cierto.',
    type: 'conflicto_otros',
    resilientResponse: {
      text: 'Le dices: "Entiendo que estés molesto, pero yo no hice trampa. ¿Quieres que juguemos de nuevo para que sea justo?"',
      feedback: '¡Muy bien! Mostraste calma y ofreciste una solución justa. Eso es resiliencia en acción.'
    },
    impulsiveResponse: {
      text: 'Te pones a gritar defendiendo que no fue tu culpa.',
      feedback: 'Cuando gritamos, el otro puede molestarse más y no escucharnos. ¿Realmente te sentirías mejor así?'
    }
  },
  {
    id: 'conflicto_personal_1',
    title: 'Frustración con Ejercicio de Matemáticas',
    imageUrl: '/Gemini_Generated_Image_akdhw9akdhw9akdh.png',
    description: 'Estás resolviendo un ejercicio de matemáticas, pero te equivocas varias veces. Empiezas a sentir frustración.',
    type: 'conflicto_personal',
    impulsiveResponse: {
      text: 'Tomas un descanso corto, pides ayuda o revisas el ejemplo de nuevo.',
      feedback: '¡Excelente! Buscar estrategias y ayuda demuestra resiliencia. Cada error te acerca más a la solución.'
    },
    resilientResponse: {
      text: 'Cierras el cuaderno y piensas: "Soy malo para esto, no lo intentaré más."',
      feedback: 'Rendirse rápido no te deja crecer. Los errores son parte del aprendizaje.'
    }
  },
  {
    id: 'conflicto_personal_2',
    title: 'Decepción por no ser Elegido',
    imageUrl: '/public/Gemini_Generated_Image_9xozmj9xozmj9xoz.png',
    description: 'Querías participar en un concurso de dibujo, pero no fuiste elegido entre los finalistas.',
    type: 'conflicto_personal',
    impulsiveResponse: {
      text: 'Piensas: "Nunca más voy a dibujar, no sirvo para esto."',
      feedback: 'Ese pensamiento te quita fuerzas y no te deja disfrutar lo que te gusta.'
    },
    resilientResponse: {
      text: 'Te dices: "Hoy no gané, pero puedo seguir practicando. Tal vez la próxima vez lo logre."',
      feedback: '¡Muy bien! Ver la experiencia como aprendizaje es resiliencia. No siempre se gana, pero siempre se puede mejorar.'
    }
  }
]

const ProblemaResuelto = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [allSessions, setAllSessions] = useState<ProblemaResueltoSession[]>([])
  const [activeSession, setActiveSession] = useState<ProblemaResueltoSession | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'activity' | 'results'>('cards')
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChoice, setSelectedChoice] = useState<'resiliente' | 'impulsiva' | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [currentFeedback, setCurrentFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      loadAllSessions()
    }
  }, [user])

  const loadAllSessions = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const sessions = await problemaResueltoService.getAllSessions(user.id)
      setAllSessions(sessions)
      
      // Si no hay sesiones, mostrar vista de tarjetas por defecto
      if (sessions.length === 0) {
        setViewMode('cards')
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
      // Set empty sessions array to prevent crashes
      setAllSessions([])
      setViewMode('cards')
    } finally {
      setIsLoading(false)
    }
  }

  const startNewSession = async () => {
    if (!user) return
    
    try {
      const newSession = await problemaResueltoService.createNewSession(user.id)
      if (newSession) {
        setActiveSession(newSession)
        setCurrentProblemIndex(0)
        setSelectedChoice(null)
        setShowFeedback(false)
        setViewMode('activity')
      } else {
        // Show user-friendly error message
        alert('Error: Las tablas de la base de datos aún no están creadas. Por favor, ejecuta la migración "20250825230500_fix_problema_resuelto_policies.sql" en Supabase Dashboard > SQL Editor.')
      }
    } catch (error) {
      console.error('Error starting new session:', error)
      alert('Error al crear nueva sesión. Por favor, ejecuta la migración "20250825230500_fix_problema_resuelto_policies.sql" en Supabase Dashboard.')
    }
  }

  const viewExistingSession = (session: ProblemaResueltoSession) => {
    setActiveSession(session)
    
    if (session.completed_at) {
      // Si está completada, mostrar resultados
      setViewMode('results')
    } else {
      // Si no está completada, continuar desde donde se quedó
      setCurrentProblemIndex(session.completed_problems)
      setSelectedChoice(null)
      setShowFeedback(false)
      setViewMode('activity')
    }
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta sesión?')) return
    
    try {
      const success = await problemaResueltoService.deleteSession(sessionId)
      if (success) {
        await loadAllSessions()
        // Si estamos viendo la sesión que se eliminó, volver a tarjetas
        if (activeSession?.id === sessionId) {
          setActiveSession(null)
          setViewMode('cards')
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  const handleChoiceSelect = (choice: 'resiliente' | 'impulsiva') => {
    setSelectedChoice(choice)
    
    const currentProblem = problems[currentProblemIndex]
    const isResilient = choice === 'resiliente'
    const feedback = isResilient 
      ? currentProblem.resilientResponse.feedback 
      : currentProblem.impulsiveResponse.feedback
    
    setCurrentFeedback(feedback)
    setShowFeedback(true)
  }

  const handleNextProblem = async () => {
    if (!user || !activeSession || !selectedChoice) return

    setIsSubmitting(true)
    try {
      const currentProblem = problems[currentProblemIndex]
      const isResilient = selectedChoice === 'resiliente'
      
      // Guardar respuesta
      await problemaResueltoService.saveResponse(
        user.id,
        activeSession.id!,
        currentProblem.id,
        currentProblem.title,
        currentProblem.type,
        selectedChoice,
        isResilient
      )

      const nextIndex = currentProblemIndex + 1
      const isLastProblem = nextIndex >= problems.length

      // Calcular estadísticas actualizadas
      const newResilientCount = activeSession.resilient_responses + (isResilient ? 1 : 0)
      const newImpulsiveCount = activeSession.impulsive_responses + (isResilient ? 0 : 1)

      // Actualizar progreso de la sesión
      await problemaResueltoService.updateSessionProgress(
        activeSession.id!,
        nextIndex,
        newResilientCount,
        newImpulsiveCount,
        isLastProblem
      )

      if (isLastProblem) {
        // Completar sesión y mostrar resultados
        await loadAllSessions()
        setViewMode('results')
      } else {
        // Ir al siguiente problema
        setCurrentProblemIndex(nextIndex)
        setSelectedChoice(null)
        setShowFeedback(false)
        
        // Actualizar sesión local
        setActiveSession({
          ...activeSession,
          completed_problems: nextIndex,
          resilient_responses: newResilientCount,
          impulsive_responses: newImpulsiveCount
        })
      }
    } catch (error) {
      console.error('Error handling next problem:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const backToCards = () => {
    setActiveSession(null)
    setViewMode('cards')
    setCurrentProblemIndex(0)
    setSelectedChoice(null)
    setShowFeedback(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getResilienceLevel = (score: number) => {
    if (score >= 90) return { level: 'Experto en Resiliencia', color: 'text-green-600', emoji: '🌟' }
    if (score >= 75) return { level: 'Alta Resiliencia', color: 'text-blue-600', emoji: '💪' }
    if (score >= 50) return { level: 'Resiliencia Moderada', color: 'text-yellow-600', emoji: '⚡' }
    if (score >= 25) return { level: 'Desarrollando Resiliencia', color: 'text-orange-600', emoji: '🌱' }
    return { level: 'Resiliencia en Construcción', color: 'text-red-600', emoji: '🔨' }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-green-400 flex items-center justify-center">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
            Cargando Problema Resuelto...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-green-400">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Vista de Tarjetas */}
        {viewMode === 'cards' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
                🧠 Mis Sesiones de Problema Resuelto
              </h2>
              <p className="text-xl text-white text-opacity-90 max-w-3xl mx-auto" style={{ fontFamily: 'Comic Neue' }}>
                Desarrolla tu resiliencia aprendiendo a enfrentar conflictos de manera inteligente
              </p>
            </div>

            {allSessions.length === 0 ? (
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 text-center mb-8">
                <div className="text-white font-bold text-opacity-100 text-base space-y-2 mb-6" style={{ fontFamily: 'Comic Neue' }}>
                  <p>• Lee cuidadosamente cada situación problemática</p>
                  <p>• Elige entre la respuesta resiliente o impulsiva</p>
                  <p>• Recibe feedback inmediato sobre tu elección</p>
                  <p>• Aprende estrategias para manejar conflictos</p>
                  <p>• Al final obtendrás tu nivel de resiliencia</p>
                </div>
                
                <button
                  onClick={startNewSession}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3 mx-auto"
                  style={{ fontFamily: 'Fredoka' }}
                >
                  <Brain size={24} />
                  Comenzar Nueva Sesión
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Tarjeta Nueva Sesión */}
                <div
                  onClick={startNewSession}
                  className="bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105 border-4 border-white border-opacity-30"
                >
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus size={32} />
                    </div>
                    <h4 className="text-xl font-bold mb-2" style={{ fontFamily: 'Fredoka' }}>
                      Nueva Sesión
                    </h4>
                    <p className="text-sm opacity-90" style={{ fontFamily: 'Comic Neue' }}>
                      Resuelve 4 problemas nuevos
                    </p>
                  </div>
                </div>
                
                {/* Tarjetas de Sesiones Existentes */}
                {allSessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 border-2 border-white border-opacity-20 hover:bg-opacity-20 transition-all relative group"
                  >
                    {/* Botón eliminar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteSession(session.id!)
                      }}
                      className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="text-white">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                          <Brain size={24} className="text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold" style={{ fontFamily: 'Fredoka' }}>
                            Sesión #{index + 1}
                          </h4>
                          <p className="text-sm opacity-80" style={{ fontFamily: 'Comic Neue' }}>
                            {formatDate(session.created_at!)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Target size={16} />
                          <span className="text-sm font-medium">
                            {session.completed_problems}/{session.total_problems} problemas
                          </span>
                        </div>
                        
                        {session.completed_at ? (
                          <div className="flex items-center gap-2 text-green-300 mb-2">
                            <CheckCircle size={16} />
                            <span className="text-sm font-medium">Completada</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-yellow-300 mb-2">
                            <Clock size={16} />
                            <span className="text-sm font-medium">En progreso</span>
                          </div>
                        )}

                        {session.completed_at && (
                          <div className="bg-white bg-opacity-20 rounded-lg p-3">
                            <div className="text-center">
                              <div className="text-2xl font-bold mb-1">
                                {Math.round(session.resilience_score)}%
                              </div>
                              <div className="text-sm">
                                {getResilienceLevel(session.resilience_score).emoji} {getResilienceLevel(session.resilience_score).level}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => viewExistingSession(session)}
                        className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                        style={{ fontFamily: 'Fredoka' }}
                      >
                        <Eye size={16} />
                        {session.completed_at ? 'Ver Resultados' : 'Continuar Sesión'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vista de Actividad */}
        {viewMode === 'activity' && activeSession && (
          <div>
            {/* Progress Bar */}
            <div className="mb-8 bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                  Problema {currentProblemIndex + 1} de {problems.length}
                </h3>
                <button
                  onClick={backToCards}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  ← Volver a Mis Sesiones
                </button>
              </div>
              <div className="w-full bg-white bg-opacity-30 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${((currentProblemIndex + 1) / problems.length) * 100}%` }}
                />
              </div>
            </div>

            {!showFeedback ? (
              // Mostrar Problema
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    {problems[currentProblemIndex].type === 'conflicto_otros' ? (
                      <Users size={32} className="text-blue-600" />
                    ) : (
                      <Heart size={32} className="text-purple-600" />
                    )}
                    <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Fredoka' }}>
                      {problems[currentProblemIndex].title}
                    </h2>
                  </div>
                  
                  {/* Imagen del problema */}
                  <div className="w-full max-w-md mx-auto h-64 rounded-2xl overflow-hidden mb-6 shadow-lg">
                    <img
                      src={problems[currentProblemIndex].imageUrl}
                      alt={problems[currentProblemIndex].title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                              <div class="text-center">
                                <Brain size="48" />
                                <p class="mt-2">Imagen no disponible</p>
                              </div>
                            </div>
                          `
                        }
                      }}
                    />
                  </div>

                  <p className="text-xl text-gray-700 leading-relaxed mb-8" style={{ fontFamily: 'Comic Neue' }}>
                    {problems[currentProblemIndex].description}
                  </p>
                </div>

                {/* Opciones de Respuesta */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-800 text-center mb-6" style={{ fontFamily: 'Fredoka' }}>
                    🤔 ¿Cómo reaccionarías?
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Respuesta A */}
                    <div
                      onClick={() => handleChoiceSelect('impulsiva')}
                      className={`p-6 rounded-2xl cursor-pointer transition-all transform hover:scale-105 border-4 ${
                        selectedChoice === 'impulsiva' 
                          ? 'border-purple-600 bg-purple-100 shadow-lg scale-105' 
                          : 'border-purple-300 bg-purple-50 hover:bg-purple-100'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <Zap size={32} className="text-white" />
                        </div>
                        <h4 className="text-base font-bold text-purple-800 mb-4" style={{ fontFamily: 'Fredoka' }}>
                          Respuesta A
                        </h4>
                        <p className="text-purple-700 leading-relaxed text-xl font-black" style={{ fontFamily: 'Comic Neue' }}>
                          {problems[currentProblemIndex].impulsiveResponse.text}
                        </p>
                      </div>
                    </div>

                    {/* Respuesta B */}
                    <div
                      onClick={() => handleChoiceSelect('resiliente')}
                      className={`p-6 rounded-2xl cursor-pointer transition-all transform hover:scale-105 border-4 ${
                        selectedChoice === 'resiliente' 
                          ? 'border-purple-600 bg-purple-100 shadow-lg scale-105' 
                          : 'border-purple-300 bg-purple-50 hover:bg-purple-100'
                      }`}
                    >
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <Shield size={32} className="text-white" />
                        </div>
                        <h4 className="text-base font-bold text-purple-800 mb-4" style={{ fontFamily: 'Fredoka' }}>
                          Respuesta B
                        </h4>
                        <p className="text-purple-700 leading-relaxed text-xl font-black" style={{ fontFamily: 'Comic Neue' }}>
                          {problems[currentProblemIndex].resilientResponse.text}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Mostrar Feedback
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    selectedChoice === 'resiliente' ? 'bg-green-500' : 'bg-orange-500'
                  }`}>
                    {selectedChoice === 'resiliente' ? (
                      <CheckCircle size={40} className="text-white" />
                    ) : (
                      <AlertTriangle size={40} className="text-white" />
                    )}
                  </div>
                  
                  <h3 className={`text-3xl font-bold mb-4 ${
                    selectedChoice === 'resiliente' ? 'text-green-600' : 'text-orange-600'
                  }`} style={{ fontFamily: 'Fredoka' }}>
                    {selectedChoice === 'resiliente' ? '¡Respuesta Resiliente!' : 'Respuesta Impulsiva'}
                  </h3>
                  
                  <div className={`rounded-2xl p-6 mb-6 ${
                    selectedChoice === 'resiliente' ? 'bg-green-50 border-l-4 border-green-500' : 'bg-orange-50 border-l-4 border-orange-500'
                  }`}>
                    <p className="text-gray-700 text-lg leading-relaxed" style={{ fontFamily: 'Comic Neue' }}>
                      {currentFeedback}
                    </p>
                  </div>
                </div>

                {/* Botón Continuar */}
                <div className="text-center">
                  <button
                    onClick={handleNextProblem}
                    disabled={isSubmitting}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mx-auto"
                    style={{ fontFamily: 'Fredoka' }}
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ChevronRight size={24} />
                    )}
                    {isSubmitting ? 'Guardando...' : 
                     currentProblemIndex === problems.length - 1 ? 'Ver Resultados' : 'Siguiente Problema'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Vista de Resultados */}
        {viewMode === 'results' && activeSession && (
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto">
            {/* Botón volver */}
            <div className="mb-6">
              <button
                onClick={backToCards}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Volver a Mis Sesiones
              </button>
            </div>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Fredoka' }}>
                ¡Sesión Completada!
              </h2>
              <p className="text-lg text-gray-600" style={{ fontFamily: 'Comic Neue' }}>
                Has completado todos los problemas de resiliencia
              </p>
            </div>

            {/* Resultados de Resiliencia */}
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-6 mb-8 border-l-4 border-blue-500">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Fredoka' }}>
                  📊 Tu Nivel de Resiliencia
                </h3>
                
                <div className="text-6xl font-black mb-4">
                  {Math.round(activeSession.resilience_score)}%
                </div>
                
                <div className={`text-xl font-bold mb-4 ${getResilienceLevel(activeSession.resilience_score).color}`}>
                  {getResilienceLevel(activeSession.resilience_score).emoji} {getResilienceLevel(activeSession.resilience_score).level}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-green-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {activeSession.resilient_responses}
                  </div>
                  <div className="text-sm text-green-700">Respuestas Resilientes</div>
                </div>
                <div className="bg-red-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {activeSession.impulsive_responses}
                  </div>
                  <div className="text-sm text-red-700">Respuestas Impulsivas</div>
                </div>
              </div>
            </div>

            {/* Resumen de Respuestas */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center" style={{ fontFamily: 'Fredoka' }}>
                📋 Resumen de tus Respuestas
              </h3>
              
              <div className="space-y-4">
                {activeSession.responses.map((response, index) => (
                  <div key={response.id} className="bg-gray-50 rounded-2xl p-4 border-l-4 border-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 mb-1" style={{ fontFamily: 'Fredoka' }}>
                          {index + 1}. {response.problem_title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            response.is_resilient ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {response.is_resilient ? (
                              <Shield size={14} className="text-white" />
                            ) : (
                              <Zap size={14} className="text-white" />
                            )}
                          </div>
                          <span className={`font-medium ${
                            response.is_resilient ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {response.is_resilient ? 'Resiliente' : 'Impulsiva'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mensaje de cierre */}
            <div className="text-center">
              <div className="bg-blue-50 rounded-2xl p-6 border-l-4 border-blue-500">
                <div className="mb-4">
                  <p className="text-xl text-gray-800 font-bold leading-relaxed mb-4" style={{ fontFamily: 'Fredoka' }}>
                    🌟 Reflexión Final
                  </p>
                  <p className="text-lg text-gray-700 font-medium leading-relaxed" style={{ fontFamily: 'Comic Neue' }}>
                    "Cada problema es una oportunidad para practicar tu resiliencia. Cuando eliges la calma, la empatía y la perseverancia, te conviertes en alguien más fuerte y sabio. ¡Recuerda, tú puedes con los problemas!"
                  </p>
                </div>
                <p className="text-base text-gray-600 font-medium" style={{ fontFamily: 'Comic Neue' }}>
                  💡 Para cerrar esta actividad, haz clic en la <span className="font-bold text-gray-800">X</span> de la esquina superior derecha
                </p>
              </div>
            </div>

            {/* Fun Elements */}
            <div className="mt-8 text-center">
              <div className="flex justify-center gap-4 text-4xl">
                <span className="animate-pulse">🧠</span>
                <span className="animate-pulse" style={{ animationDelay: '0.1s' }}>💪</span>
                <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>🎯</span>
                <span className="animate-pulse" style={{ animationDelay: '0.3s' }}>✨</span>
              </div>
            </div>
          </div>
        )}
      </div>

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
            <Brain size={32} className="text-white" />
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              Problema Resuelto
            </h1>
          </div>
          <UserMenu />
        </div>
      </div>
    </div>
  )
}

export default ProblemaResuelto