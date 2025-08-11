import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import { semaforoLimitesService, SemaforoSession } from '../lib/semaforoLimitesService'
import { 
  ArrowLeft, 
  Shield, 
  Plus,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronRight,
  RotateCcw,
  Award,
  X
} from 'lucide-react'

interface Situation {
  id: string
  title: string
  imageUrl: string
  description: string
}

// Situaciones de ejemplo (reemplazar con las imágenes reales)
const situations: Situation[] = [
  {
    id: 'situacion_1',
    title: 'Alguien te quita algo sin tu permiso',
    imageUrl: 'https://viact.org/imagenes/limite_01.png?
    auto=compress&cs=tinysrgb&w=400',
    description: 'Alguien de tu salón toma algo que es tuyo, no te avisó que lo necesitaba. ¿Qué te parece ese comportamiento? Exprésalo en el Semáforo.'
  },
  {
    id: 'situacion_2', 
    title: 'Te piden hacer algo que no quieres',
    imageUrl: 'https://images.pexels.com/photos/8613089/pexels-photo-8613089.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Alguien insiste en que hagas algo que te hace sentir incómodo/a.'
  },
  {
    id: 'situacion_3',
    title: 'Tocan tus cosas sin permiso',
    imageUrl: 'https://images.pexels.com/photos/8613092/pexels-photo-8613092.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Alguien toma tus pertenencias sin preguntarte primero.'
  },
  {
    id: 'situacion_4',
    title: 'Te critican constantemente',
    imageUrl: 'https://images.pexels.com/photos/5212317/pexels-photo-5212317.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Una persona siempre encuentra algo negativo que decir sobre ti.'
  },
  {
    id: 'situacion_5',
    title: 'No respetan tu espacio personal',
    imageUrl: 'https://images.pexels.com/photos/8613088/pexels-photo-8613088.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Alguien se acerca demasiado o te toca sin tu consentimiento.'
  },
  {
    id: 'situacion_6',
    title: 'Te presionan para mentir',
    imageUrl: 'https://images.pexels.com/photos/5212320/pexels-photo-5212320.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Te piden que mientas para cubrir a alguien o para evitar consecuencias.'
  },
  {
    id: 'situacion_7',
    title: 'Ignoran tus opiniones',
    imageUrl: 'https://images.pexels.com/photos/8613087/pexels-photo-8613087.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'En un grupo, siempre ignoran lo que tienes que decir.'
  },
  {
    id: 'situacion_8',
    title: 'Te obligan a guardar secretos',
    imageUrl: 'https://images.pexels.com/photos/5474027/pexels-photo-5474027.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Alguien te dice algo inapropiado y te pide que no se lo digas a nadie.'
  }
]

const SemaforoLimites = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [allSessions, setAllSessions] = useState<SemaforoSession[]>([])
  const [activeSession, setActiveSession] = useState<SemaforoSession | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'activity' | 'results'>('cards')
  const [currentSituationIndex, setCurrentSituationIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedChoice, setSelectedChoice] = useState<'rojo' | 'amarillo' | 'verde' | null>(null)
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
      const sessions = await semaforoLimitesService.getAllSessions(user.id)
      setAllSessions(sessions)
      
      // Si no hay sesiones, mostrar vista de tarjetas por defecto
      if (sessions.length === 0) {
        setViewMode('cards')
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startNewSession = async () => {
    if (!user) return
    
    try {
      const newSession = await semaforoLimitesService.createNewSession(user.id)
      if (newSession) {
        setActiveSession(newSession)
        setCurrentSituationIndex(0)
        setSelectedChoice(null)
        setViewMode('activity')
      }
    } catch (error) {
      console.error('Error starting new session:', error)
    }
  }

  const viewExistingSession = (session: SemaforoSession) => {
    setActiveSession(session)
    setViewMode('results')
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta sesión?')) return
    
    try {
      const success = await semaforoLimitesService.deleteSession(sessionId)
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

  const handleChoiceSelect = (choice: 'rojo' | 'amarillo' | 'verde') => {
    setSelectedChoice(choice)
  }

  const handleNextSituation = async () => {
    if (!user || !activeSession || !selectedChoice) return

    setIsSubmitting(true)
    try {
      const currentSituation = situations[currentSituationIndex]
      
      // Guardar respuesta
      await semaforoLimitesService.saveResponse(
        user.id,
        activeSession.id!,
        currentSituation.id,
        currentSituation.title,
        selectedChoice
      )

      const nextIndex = currentSituationIndex + 1
      const isLastSituation = nextIndex >= situations.length

      // Actualizar progreso de la sesión
      await semaforoLimitesService.updateSessionProgress(
        activeSession.id!,
        nextIndex,
        isLastSituation
      )

      if (isLastSituation) {
        // Completar sesión y mostrar resultados
        await loadAllSessions()
        setViewMode('results')
      } else {
        // Ir a la siguiente situación
        setCurrentSituationIndex(nextIndex)
        setSelectedChoice(null)
      }
    } catch (error) {
      console.error('Error handling next situation:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const backToCards = () => {
    setActiveSession(null)
    setViewMode('cards')
    setCurrentSituationIndex(0)
    setSelectedChoice(null)
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

  const getChoiceColor = (choice: 'rojo' | 'amarillo' | 'verde') => {
    switch (choice) {
      case 'rojo': return 'bg-red-500'
      case 'amarillo': return 'bg-yellow-500'
      case 'verde': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getChoiceText = (choice: 'rojo' | 'amarillo' | 'verde') => {
    switch (choice) {
      case 'rojo': return 'No lo Permito'
      case 'amarillo': return 'Más o Menos'
      case 'verde': return 'Permitido'
      default: return ''
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-400 via-yellow-400 to-green-400 flex items-center justify-center">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
            Cargando Semáforo de los Límites...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-400 via-yellow-400 to-green-400">
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
            <Shield size={32} className="text-white" />
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              Semáforo de los Límites
            </h1>
          </div>
          <UserMenu />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Vista de Tarjetas */}
        {viewMode === 'cards' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
                🚦 Mis Sesiones del Semáforo
              </h2>
              <p className="text-xl text-white text-opacity-90 max-w-3xl mx-auto" style={{ fontFamily: 'Comic Neue' }}>
                Aprende a establecer límites saludables evaluando diferentes situaciones
              </p>
            </div>

            {allSessions.length === 0 ? (
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 text-center mb-8">
                <div className="text-white font-bold text-opacity-100 text-base space-y-2 mb-6" style={{ fontFamily: 'Comic Neue' }}>
                  <p>• Observa cada situación cuidadosamente</p>
                  <p>• Decide si la permitirías, la tolerarías o no la aceptarías</p>
                  <p>• Usa el semáforo: 🔴 No lo Permito, 🟡 Más o Menos, 🟢 Permitido</p>
                  <p>• Reflexiona sobre tus límites personales</p>
                  <p>• Al final verás un resumen de tus respuestas</p>
                </div>
                
                <button
                  onClick={startNewSession}
                  className="bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3 mx-auto"
                  style={{ fontFamily: 'Fredoka' }}
                >
                  <Shield size={24} />
                  Comenzar Nueva Sesión
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Tarjeta Nueva Sesión */}
                <div
                  onClick={startNewSession}
                  className="bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105 border-4 border-white border-opacity-30"
                >
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus size={32} />
                    </div>
                    <h4 className="text-xl font-bold mb-2" style={{ fontFamily: 'Fredoka' }}>
                      Nueva Sesión
                    </h4>
                    <p className="text-sm opacity-90" style={{ fontFamily: 'Comic Neue' }}>
                      Evalúa 8 situaciones nuevas
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
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 rounded-full flex items-center justify-center">
                          <Shield size={24} className="text-white" />
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
                          <Shield size={16} />
                          <span className="text-sm font-medium">
                            {session.completed_situations}/{session.total_situations} situaciones
                          </span>
                        </div>
                        
                        {session.completed_at ? (
                          <div className="flex items-center gap-2 text-green-300">
                            <CheckCircle size={16} />
                            <span className="text-sm font-medium">Completada</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-yellow-300">
                            <Clock size={16} />
                            <span className="text-sm font-medium">En progreso</span>
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
                  Progreso: {currentSituationIndex + 1} de {situations.length}
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
                  className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${((currentSituationIndex + 1) / situations.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Situación Actual */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Fredoka' }}>
                  {situations[currentSituationIndex].title}
                </h2>
                
                {/* Imagen de la situación */}
                <div className="w-full max-w-md mx-auto h-64 rounded-2xl overflow-hidden mb-6 shadow-lg">
                  <img
                    src={situations[currentSituationIndex].imageUrl}
                    alt={situations[currentSituationIndex].title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                            <div class="text-center">
                              <Shield size="48" />
                              <p class="mt-2">Imagen no disponible</p>
                            </div>
                          </div>
                        `
                      }
                    }}
                  />
                </div>

                <p className="text-xl text-gray-700 leading-relaxed mb-8" style={{ fontFamily: 'Comic Neue' }}>
                  {situations[currentSituationIndex].description}
                </p>
              </div>

              {/* Semáforo de Opciones */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800 text-center mb-6" style={{ fontFamily: 'Fredoka' }}>
                  🚦 ¿Cómo reaccionarías?
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Opción Roja */}
                  <div
                    onClick={() => handleChoiceSelect('rojo')}
                    className={`p-6 rounded-2xl cursor-pointer transition-all transform hover:scale-105 border-4 ${
                      selectedChoice === 'rojo' 
                        ? 'border-red-600 bg-red-100 shadow-lg scale-105' 
                        : 'border-red-300 bg-red-50 hover:bg-red-100'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <div className="w-12 h-12 bg-red-600 rounded-full"></div>
                      </div>
                      <h4 className="text-xl font-bold text-red-800 mb-2" style={{ fontFamily: 'Fredoka' }}>
                        🔴 No lo Permito
                      </h4>
                      <p className="text-red-700 text-sm" style={{ fontFamily: 'Comic Neue' }}>
                        Esta situación cruza mis límites
                      </p>
                    </div>
                  </div>

                  {/* Opción Amarilla */}
                  <div
                    onClick={() => handleChoiceSelect('amarillo')}
                    className={`p-6 rounded-2xl cursor-pointer transition-all transform hover:scale-105 border-4 ${
                      selectedChoice === 'amarillo' 
                        ? 'border-yellow-600 bg-yellow-100 shadow-lg scale-105' 
                        : 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <div className="w-12 h-12 bg-yellow-600 rounded-full"></div>
                      </div>
                      <h4 className="text-xl font-bold text-yellow-800 mb-2" style={{ fontFamily: 'Fredoka' }}>
                        🟡 Más o Menos
                      </h4>
                      <p className="text-yellow-700 text-sm" style={{ fontFamily: 'Comic Neue' }}>
                        Depende de la situación
                      </p>
                    </div>
                  </div>

                  {/* Opción Verde */}
                  <div
                    onClick={() => handleChoiceSelect('verde')}
                    className={`p-6 rounded-2xl cursor-pointer transition-all transform hover:scale-105 border-4 ${
                      selectedChoice === 'verde' 
                        ? 'border-green-600 bg-green-100 shadow-lg scale-105' 
                        : 'border-green-300 bg-green-50 hover:bg-green-100'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <div className="w-12 h-12 bg-green-600 rounded-full"></div>
                      </div>
                      <h4 className="text-xl font-bold text-green-800 mb-2" style={{ fontFamily: 'Fredoka' }}>
                        🟢 Permitido
                      </h4>
                      <p className="text-green-700 text-sm" style={{ fontFamily: 'Comic Neue' }}>
                        Esto está bien para mí
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón Siguiente */}
              <div className="text-center">
                <button
                  onClick={handleNextSituation}
                  disabled={!selectedChoice || isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
                  style={{ fontFamily: 'Fredoka' }}
                >
                  {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ChevronRight size={24} />
                  )}
                  {isSubmitting ? 'Guardando...' : 
                   currentSituationIndex === situations.length - 1 ? 'Finalizar' : 'Siguiente Situación'}
                </button>
              </div>
            </div>
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
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Fredoka' }}>
                ¡Sesión Completada!
              </h2>
              <p className="text-lg text-gray-600" style={{ fontFamily: 'Comic Neue' }}>
                Has evaluado todas las situaciones del semáforo de límites
              </p>
            </div>

            {/* Resumen de Respuestas */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center" style={{ fontFamily: 'Fredoka' }}>
                📊 Tus Respuestas
              </h3>
              
              <div className="space-y-4">
                {activeSession.responses.map((response, index) => (
                  <div key={response.id} className="bg-gray-50 rounded-2xl p-4 border-l-4 border-gray-300">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800 mb-1" style={{ fontFamily: 'Fredoka' }}>
                          {index + 1}. {response.situation_title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 ${getChoiceColor(response.user_choice)} rounded-full`}></div>
                          <span className="font-medium text-gray-700">
                            {getChoiceText(response.user_choice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center" style={{ fontFamily: 'Fredoka' }}>
                📈 Análisis de tus Límites
              </h3>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-red-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {activeSession.responses.filter(r => r.user_choice === 'rojo').length}
                  </div>
                  <div className="text-sm text-red-700">No Permito</div>
                </div>
                <div className="bg-yellow-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {activeSession.responses.filter(r => r.user_choice === 'amarillo').length}
                  </div>
                  <div className="text-sm text-yellow-700">Más o Menos</div>
                </div>
                <div className="bg-green-100 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {activeSession.responses.filter(r => r.user_choice === 'verde').length}
                  </div>
                  <div className="text-sm text-green-700">Permitido</div>
                </div>
              </div>
            </div>

            {/* Mensaje de cierre */}
            <div className="text-center">
              <div className="bg-blue-50 rounded-2xl p-6 border-l-4 border-blue-500">
                <p className="text-lg text-gray-700 font-medium" style={{ fontFamily: 'Comic Neue' }}>
                  💡 Para cerrar esta actividad, haz clic en la <span className="font-bold text-gray-800">X</span> de la esquina superior derecha
                </p>
              </div>
            </div>

            {/* Fun Elements */}
            <div className="mt-8 text-center">
              <div className="flex justify-center gap-4 text-4xl">
                <span className="animate-pulse">🚦</span>
                <span className="animate-pulse" style={{ animationDelay: '0.1s' }}>🛡️</span>
                <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>✨</span>
                <span className="animate-pulse" style={{ animationDelay: '0.3s' }}>🎯</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SemaforoLimites