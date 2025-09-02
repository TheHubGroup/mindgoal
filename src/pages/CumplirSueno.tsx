import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import UserMenu from '../components/UserMenu'
import { cumplirSuenoService, CumplirSuenoSession } from '../lib/cumplirSuenoService'
import { dreamTutorService } from '../lib/dreamTutorService'
import { 
  ArrowLeft, 
  Star, 
  Plus,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  Sparkles,
  Save,
  Brain,
  Target,
  Lightbulb,
  Rocket,
  Heart,
  Zap,
  Award,
  Image,
  Loader,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const CumplirSueno = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile()
  const [allSessions, setAllSessions] = useState<CumplirSuenoSession[]>([])
  const [activeSession, setActiveSession] = useState<CumplirSuenoSession | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'create' | 'roadmap'>('cards')
  const [isLoading, setIsLoading] = useState(true)
  
  // Create dream state
  const [dreamTitle, setDreamTitle] = useState('')
  const [dreamDescription, setDreamDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    if (user) {
      loadAllSessions()
    }
  }, [user])

  const loadAllSessions = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const sessions = await cumplirSuenoService.getAllSessions(user.id)
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

  const startNewDream = () => {
    setDreamTitle('')
    setDreamDescription('')
    setViewMode('create')
  }

  const viewExistingSession = (session: CumplirSuenoSession) => {
    setActiveSession(session)
    setViewMode('roadmap')
  }

  const deleteSession = async (sessionId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este sueño?')) return
    
    try {
      const success = await cumplirSuenoService.deleteSession(sessionId)
      if (success) {
        await loadAllSessions()
        // Si estamos viendo la sesión que se eliminó, volver a tarjetas
        if (activeSession?.id === sessionId) {
          setActiveSession(null)
          setViewMode('cards')
        }
        setSaveMessage('¡Sueño eliminado correctamente!')
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  const handleCreateDream = async () => {
    if (!user || !dreamTitle.trim() || !dreamDescription.trim()) {
      setSaveMessage('Por favor, completa el título y descripción de tu sueño')
      setTimeout(() => setSaveMessage(''), 3000)
      return
    }

    setIsCreating(true)
    try {
      // Crear nueva sesión
      const newSession = await cumplirSuenoService.createSession(
        user.id, 
        dreamTitle.trim(), 
        dreamDescription.trim()
      )
      
      if (newSession) {
        setActiveSession(newSession)
        setViewMode('roadmap')
        
        // Generar roadmap con IA
        await generateRoadmapForSession(newSession)
      }
    } catch (error) {
      console.error('Error creating dream session:', error)
      setSaveMessage('Error al crear el sueño')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsCreating(false)
    }
  }

  const generateRoadmapForSession = async (session: CumplirSuenoSession) => {
    if (!profile) return

    setIsGeneratingRoadmap(true)
    try {
      // Generar roadmap con IA
      const roadmapData = await dreamTutorService.generateDreamRoadmap(
        session.dream_title,
        session.dream_description,
        profile.edad || 15,
        profile.grado || '5°'
      )

      if (roadmapData) {
        // Guardar roadmap en la sesión
        await cumplirSuenoService.updateSessionWithAI(session.id!, roadmapData.roadmap)
        
        // Guardar pasos del roadmap
        await cumplirSuenoService.saveSteps(session.id!, roadmapData.steps)
        
        // Generar imagen inspiracional
        setIsGeneratingImage(true)
        const imageData = await dreamTutorService.generateDreamImage(
          session.dream_title,
          session.dream_description,
          profile.edad || 15,
          profile.sexo
        )

        if (imageData) {
          await cumplirSuenoService.updateSessionWithAI(session.id!, roadmapData.roadmap, imageData.url)
        }
        
        // Recargar la sesión con los nuevos datos
        const updatedSession = await cumplirSuenoService.getSessionWithSteps(session.id!)
        if (updatedSession) {
          setActiveSession(updatedSession)
        }
        
        setSaveMessage('¡Roadmap generado exitosamente!')
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error generating roadmap:', error)
      setSaveMessage('Error al generar el roadmap')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsGeneratingRoadmap(false)
      setIsGeneratingImage(false)
    }
  }

  const toggleStepCompletion = async (stepId: string, isCompleted: boolean) => {
    try {
      await cumplirSuenoService.toggleStepCompletion(stepId, isCompleted)
      
      // Recargar la sesión
      if (activeSession?.id) {
        const updatedSession = await cumplirSuenoService.getSessionWithSteps(activeSession.id)
        if (updatedSession) {
          setActiveSession(updatedSession)
        }
      }
    } catch (error) {
      console.error('Error toggling step completion:', error)
    }
  }

  const backToCards = () => {
    setActiveSession(null)
    setViewMode('cards')
    setDreamTitle('')
    setDreamDescription('')
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400 flex items-center justify-center">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
            Cargando Cumplir mi Sueño...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400">
      {/* Status messages */}
      {saveMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-white rounded-lg shadow-lg p-4 border-l-4 border-green-500">
          <CheckCircle size={20} className="text-green-500" />
          <span className="font-medium text-gray-800">{saveMessage}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Vista de Tarjetas */}
        {viewMode === 'cards' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
                ⭐ Mis Sueños y Metas
              </h2>
              <p className="text-xl text-white text-opacity-90 max-w-3xl mx-auto" style={{ fontFamily: 'Comic Neue' }}>
                Crea roadmaps personalizados con MindGoal para cumplir tus sueños más importantes
              </p>
            </div>

            {allSessions.length === 0 ? (
              <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 text-center mb-8">
                <div className="text-white font-bold text-opacity-100 text-base space-y-2 mb-6" style={{ fontFamily: 'Comic Neue' }}>
                  <p>• Describe tu sueño o meta más importante</p>
                  <p>• MindGoal creará un roadmap personalizado para ti</p>
                  <p>• Recibe pasos específicos y recursos útiles</p>
                  <p>• Marca tu progreso conforme avanzas</p>
                  <p>• Obtén una imagen inspiracional generada por MindGoal</p>
                </div>
                
                <button
                  onClick={startNewDream}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3 mx-auto"
                  style={{ fontFamily: 'Fredoka' }}
                >
                  <Star size={24} />
                  Crear Mi Primer Sueño
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Tarjeta Nuevo Sueño */}
                <div
                  onClick={startNewDream}
                  className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105 border-4 border-white border-opacity-30"
                >
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus size={32} />
                    </div>
                    <h4 className="text-xl font-bold mb-2" style={{ fontFamily: 'Fredoka' }}>
                      Nuevo Sueño
                    </h4>
                    <p className="text-sm opacity-90" style={{ fontFamily: 'Comic Neue' }}>
                      Crea un roadmap con MindGoal
                    </p>
                  </div>
                </div>
                
                {/* Tarjetas de Sueños Existentes */}
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
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                          <Star size={24} className="text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold" style={{ fontFamily: 'Fredoka' }}>
                            {session.dream_title}
                          </h4>
                          <p className="text-sm opacity-80" style={{ fontFamily: 'Comic Neue' }}>
                            {formatDate(session.created_at!)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-white text-opacity-90 mb-2" style={{ fontFamily: 'Comic Neue' }}>
                          {session.dream_description.substring(0, 100)}...
                        </p>
                        
                        {session.completed_at ? (
                          <div className="flex items-center gap-2 text-green-300">
                            <CheckCircle size={16} />
                            <span className="text-sm font-medium">Completado</span>
                          </div>
                        ) : session.ai_roadmap ? (
                          <div className="flex items-center gap-2 text-blue-300">
                            <Brain size={16} />
                            <span className="text-sm font-medium">Roadmap Generado</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-yellow-300">
                            <Clock size={16} />
                            <span className="text-sm font-medium">Pendiente</span>
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => viewExistingSession(session)}
                        className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                        style={{ fontFamily: 'Fredoka' }}
                      >
                        <Eye size={16} />
                        {session.ai_roadmap ? 'Ver Roadmap' : 'Generar Roadmap'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Vista de Creación */}
        {viewMode === 'create' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star size={40} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Fredoka' }}>
                  Cuéntame tu Sueño
                </h2>
                <p className="text-lg text-gray-600" style={{ fontFamily: 'Comic Neue' }}>
                  Describe tu sueño o meta más importante y MindGoal creará un roadmap personalizado para ti
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-gray-800 font-bold mb-3 text-lg" style={{ fontFamily: 'Fredoka' }}>
                    ¿Cuál es tu sueño? 🌟
                  </label>
                  <input
                    type="text"
                    value={dreamTitle}
                    onChange={(e) => setDreamTitle(e.target.value)}
                    placeholder="Ej: Ser astronauta, Crear videojuegos, Ser veterinario..."
                    className="w-full px-4 py-3 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none text-lg"
                    style={{ fontFamily: 'Comic Neue' }}
                  />
                </div>

                <div>
                  <label className="block text-gray-800 font-bold mb-3 text-lg" style={{ fontFamily: 'Fredoka' }}>
                    Cuéntame más sobre tu sueño 💭
                  </label>
                  <textarea
                    value={dreamDescription}
                    onChange={(e) => setDreamDescription(e.target.value)}
                    placeholder="Describe por qué es importante para ti, qué te emociona de este sueño, qué sabes sobre él..."
                    className="w-full h-32 px-4 py-3 border-2 border-yellow-300 rounded-lg focus:border-yellow-500 focus:outline-none text-base resize-none"
                    style={{ fontFamily: 'Comic Neue' }}
                  />
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={backToCards}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateDream}
                    disabled={isCreating || !dreamTitle.trim() || !dreamDescription.trim()}
                    className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Fredoka' }}
                  >
                    {isCreating ? (
                      <Loader size={20} className="animate-spin" />
                    ) : (
                      <Rocket size={20} />
                    )}
                    {isCreating ? 'Creando...' : 'Crear Roadmap con IA'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vista de Roadmap */}
        {viewMode === 'roadmap' && activeSession && (
          <div className="max-w-6xl mx-auto">
            {/* Header del Roadmap */}
            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                      <Star size={32} className="text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Fredoka' }}>
                        {activeSession.dream_title}
                      </h2>
                      <p className="text-gray-600" style={{ fontFamily: 'Comic Neue' }}>
                        Roadmap personalizado para cumplir tu sueño
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-2xl p-4 border-l-4 border-yellow-400">
                    <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Comic Neue' }}>
                      {activeSession.dream_description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={backToCards}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Volver
                </button>
              </div>

              {/* Imagen Generada por IA */}
              {activeSession.ai_generated_image_url && activeSession.ai_generated_image_url.startsWith('http') && (
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl p-4 border-2 border-yellow-300">
                    <div className="flex items-center gap-2 mb-3">
                      <Image size={20} className="text-yellow-600" />
                      <h3 className="font-bold text-yellow-800" style={{ fontFamily: 'Fredoka' }}>
                        Imagen Inspiracional Generada por MindGoal
                      </h3>
                    </div>
                    <div className="w-full max-w-md mx-auto rounded-xl overflow-hidden shadow-lg">
                      <img
                        src={activeSession.ai_generated_image_url}
                        alt={`Imagen inspiracional para: ${activeSession.dream_title}`}
                        className="w-full h-auto object-cover"
                        onError={(e) => {
                          console.error('Error loading AI generated image:', activeSession.ai_generated_image_url)
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-48 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-xl flex items-center justify-center">
                                <div class="text-center text-yellow-800">
                                  <div style="font-size: 48px; margin-bottom: 8px;">🎨</div>
                                  <p class="font-bold">Imagen no disponible</p>
                                  <p class="text-sm opacity-80">Error cargando la imagen inspiracional</p>
                                </div>
                              </div>
                            `
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Roadmap de IA */}
              {isGeneratingRoadmap ? (
                <div className="text-center py-12">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Brain size={32} className="text-yellow-600 animate-pulse" />
                    <Loader size={32} className="text-orange-600 animate-spin" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Fredoka' }}>
                    Generando tu Roadmap Personalizado...
                  </h3>
                  <p className="text-gray-600" style={{ fontFamily: 'Comic Neue' }}>
                    MindGoal está analizando tu sueño y creando un plan específico para ti
                  </p>
                  {isGeneratingImage && (
                    <p className="text-yellow-600 font-medium mt-2">
                      También estoy creando una imagen inspiracional...
                    </p>
                  )}
                </div>
              ) : activeSession.ai_roadmap ? (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border-l-4 border-blue-500">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain size={24} className="text-blue-600" />
                    <h3 className="text-xl font-bold text-blue-800" style={{ fontFamily: 'Fredoka' }}>
                      Tu Roadmap Personalizado
                    </h3>
                  </div>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'Comic Neue' }}>
                    {activeSession.ai_roadmap}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <button
                    onClick={() => generateRoadmapForSession(activeSession)}
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
                  >
                    <Brain size={20} />
                    Generar Roadmap con MindGoal
                  </button>
                </div>
              )}
            </div>

            {/* Pasos del Roadmap */}
            {activeSession.steps && activeSession.steps.length > 0 && (
              <div className="space-y-8">
                <h3 className="text-3xl font-bold text-white text-center mb-8 flex items-center justify-center gap-3" style={{ fontFamily: 'Fredoka' }}>
                  <Target size={32} className="text-yellow-300" />
                  📋 Pasos para Cumplir tu Sueño
                  <Rocket size={32} className="text-blue-300" />
                </h3>
                
                {/* Carrusel de pasos deslizante */}
                <div className="relative">
                  {/* Flechas de navegación */}
                  <button
                    onClick={() => {
                      const container = document.querySelector('.steps-scroll-container')
                      if (container) {
                        container.scrollBy({ left: -250, behavior: 'smooth' })
                      }
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 shadow-xl transition-all hover:scale-80 border-2 border-yellow-400"
                  >
                    <ChevronLeft size={24} className="text-gray-700" />
                  </button>
                  
                  <button
                    onClick={() => {
                      const container = document.querySelector('.steps-scroll-container')
                      if (container) {
                        container.scrollBy({ left: 250, behavior: 'smooth' })
                      }
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 shadow-xl transition-all hover:scale-80 border-2 border-yellow-400"
                  >
                    <ChevronRight size={24} className="text-gray-700" />
                  </button>

                  <div className="steps-scroll-container overflow-x-auto pb-6 px-16" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <div className="flex gap-4 min-w-max">
                      {activeSession.steps.map((step, index) => {
                        // Función para obtener ícono basado en el contenido del paso
                        const getStepIcon = (title: string, description: string) => {
                          const text = (title + ' ' + description).toLowerCase()
                          
                          if (text.includes('bachillerato') || text.includes('estudiar') || text.includes('notas')) {
                            return { icon: '🎓', color: 'from-blue-500 to-indigo-600' }
                          } else if (text.includes('universidad') || text.includes('carrera') || text.includes('profesional')) {
                            return { icon: '🏛️', color: 'from-purple-500 to-indigo-600' }
                          } else if (text.includes('práctica') || text.includes('experiencia') || text.includes('trabajo')) {
                            return { icon: '💼', color: 'from-green-500 to-teal-600' }
                          } else if (text.includes('investigar') || text.includes('información') || text.includes('conocer')) {
                            return { icon: '🔍', color: 'from-orange-500 to-red-500' }
                          } else if (text.includes('habilidades') || text.includes('desarrollar') || text.includes('aprender')) {
                            return { icon: '🚀', color: 'from-pink-500 to-rose-600' }
                          } else if (text.includes('red') || text.includes('contactos') || text.includes('mentores')) {
                            return { icon: '🤝', color: 'from-cyan-500 to-blue-600' }
                          } else if (text.includes('certificación') || text.includes('título') || text.includes('diploma')) {
                            return { icon: '📜', color: 'from-amber-500 to-orange-600' }
                          } else if (text.includes('especialización') || text.includes('maestría') || text.includes('posgrado')) {
                            return { icon: '🎯', color: 'from-violet-500 to-purple-600' }
                          } else {
                            return { icon: '⭐', color: 'from-yellow-500 to-orange-500' }
                          }
                        }
                        
                        const stepIcon = getStepIcon(step.step_title, step.step_description)
                        
                        return (
                          <div
                            key={step.id}
                            className={`
                              relative bg-white rounded-3xl shadow-2xl p-6 border-4 transition-all duration-300 transform hover:scale-105 hover:shadow-3xl
                              ${step.is_completed 
                                ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50' 
                                : 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 hover:border-orange-400'
                              }
                              min-w-[240px] max-w-[240px] cursor-pointer group flex-shrink-0
                            `}
                            onClick={() => step.id && toggleStepCompletion(step.id, !step.is_completed)}
                          >
                            {/* Número del paso y estado */}
                            <div className="absolute -top-4 -left-4 z-10">
                              <div className={`
                                w-12 h-12 rounded-full border-4 border-white flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-110
                                ${step.is_completed 
                                  ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                                  : 'bg-gradient-to-br from-yellow-500 to-orange-500'
                                }
                              `}>
                                {step.is_completed ? (
                                  <CheckCircle size={24} className="text-white" />
                                ) : (
                                  <span className="text-white font-black text-lg" style={{ fontFamily: 'Fredoka' }}>
                                    {step.step_number}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* Ícono principal del paso */}
                            <div className="text-center mb-6">
                              <div className={`
                                w-20 h-20 rounded-full bg-gradient-to-br ${stepIcon.color} 
                                flex items-center justify-center mx-auto mb-4 shadow-lg
                                transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6
                              `}>
                                <span className="text-4xl">{stepIcon.icon}</span>
                              </div>
                            </div>
                            
                            {/* Contenido del paso */}
                            <div className="text-center">
                              <h4 className="text-xl font-black text-gray-800 mb-3 leading-tight" style={{ fontFamily: 'Fredoka' }}>
                                {step.step_title}
                              </h4>
                              <p className="text-gray-700 text-sm mb-4 leading-relaxed" style={{ fontFamily: 'Comic Neue' }}>
                                {step.step_description}
                              </p>
                            </div>
                            
                            {/* Indicador de completado */}
                            {step.is_completed && (
                              <div className="absolute top-4 right-4">
                                <div className="bg-green-500 text-white rounded-full p-2 shadow-lg animate-pulse">
                                  <CheckCircle size={20} />
                                </div>
                              </div>
                            )}
                            
                            {/* Efecto de brillo en hover */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-3xl" />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  
                  {/* Indicador de scroll */}
                  <div className="text-center mt-4">
                    <div className="inline-flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-4 py-2 text-white">
                      <span className="text-sm font-medium" style={{ fontFamily: 'Comic Neue' }}>
                        👈 Desliza para ver todos los pasos 👉
                      </span>
                    </div>
                  </div>
                  
                  {/* CSS para ocultar scrollbar */}
                  <style jsx>{`
                    .steps-scroll-container::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                </div>
              </div>
            )}
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
            <Star size={32} className="text-white" />
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              Cumplir mi Sueño
            </h1>
          </div>
          <UserMenu />
        </div>
      </div>
    </div>
  )
}

export default CumplirSueno