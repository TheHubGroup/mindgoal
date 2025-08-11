import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import { communicationService, CommunicationSession } from '../lib/communicationService'
import { openaiService } from '../lib/openaiService'
import { 
  ArrowLeft, 
  MessageCircle, 
  Send,
  Phone,
  Wifi,
  Battery,
  Signal,
  Camera,
  Mic,
  Smile,
  MoreVertical,
  CheckCircle,
  Clock,
  Star,
  Heart,
  Sparkles,
  Award,
  ThumbsUp,
  Plus,
  Eye,
  Trash2
} from 'lucide-react'

interface ChatMessage {
  id: string
  text: string
  sender: 'sofia' | 'user'
  timestamp: Date
  isTyping?: boolean
}

const LaComunicacion = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [allSessions, setAllSessions] = useState<CommunicationSession[]>([])
  const [activeSession, setActiveSession] = useState<CommunicationSession | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'chat' | 'evaluation'>('cards')
  const [isLoading, setIsLoading] = useState(true)
  
  // Chat state (solo cuando está en modo chat)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Conversación predefinida de Sofia (la niña ficticia)
  const sofiaMessages = [
    "Hola... 😔 Soy nueva en este colegio y me siento muy sola. No tengo amigos y todos ya tienen sus grupos. ¿Me gustaría saber si tienes algún consejo para ayudarme?",
    "En el recreo me quedo sola porque no sé cómo acercarme a los otros niños. Tengo miedo de que me rechacen. ¿Tú que harías en mi lugar?",
    "Ayer intenté sentarme con unas niñas en el almuerzo pero me dijeron que ese lugar era de otra persona. Me sentí muy mal 😢, ¿Crees que deba intertar de nuevo acercarme a ellas?",
    "Muchas gracias por todos tus consejos... 🥰 Me has ayudado mucho y ahora me siento más confiada. ¡Eres muy amable!"
  ]

  useEffect(() => {
    if (user) {
      loadAllSessions()
    }
  }, [user])

  const loadAllSessions = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const sessions = await communicationService.getAllSessions(user.id)
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

  const startNewConversation = async () => {
    if (!user) return
    
    try {
      // Crear nueva sesión
      const newSession = await communicationService.createNewSession(user.id)
      if (newSession) {
        setActiveSession(newSession)
        setMessages([])
        setCurrentStep(0)
        setCurrentMessage('')
        setIsTyping(false)
        setViewMode('chat')
        
        // Iniciar con el primer mensaje de Sofia
        setTimeout(() => {
          const initialMessage: ChatMessage = {
            id: '1',
            text: sofiaMessages[0],
            sender: 'sofia',
            timestamp: new Date()
          }
          setMessages([initialMessage])
          setCurrentStep(1)
        }, 500)
      }
    } catch (error) {
      console.error('Error starting new conversation:', error)
    }
  }
  
  const viewExistingSession = (session: CommunicationSession) => {
    setActiveSession(session)
    
    if (session.completed_at) {
      // Mostrar evaluación si está completada
      setViewMode('evaluation')
    } else {
      // Continuar conversación si no está completada
      setMessages(session.messages.map((msg: any) => ({
        id: msg.id,
        text: msg.text,
        sender: msg.sender,
        timestamp: new Date(msg.timestamp)
      })))
      setCurrentStep(session.current_step || 0)
      setViewMode('chat')
    }
  }
  
  const deleteSession = async (sessionId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta conversación?')) return
    
    try {
      const success = await communicationService.deleteSession(sessionId)
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
  
  const backToCards = () => {
    setActiveSession(null)
    setViewMode('cards')
    setMessages([])
    setCurrentStep(0)
    setCurrentMessage('')
    setIsTyping(false)
  }
  
  const startConversation = () => {
    const initialMessage: ChatMessage = {
      id: '1',
      text: sofiaMessages[0],
      sender: 'sofia',
      timestamp: new Date()
    }
    setMessages([initialMessage])
    setCurrentStep(1)
  }

  const scrollToBottom = () => {
    // Only scroll if user is near bottom to avoid interrupting typing
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.closest('.overflow-y-auto')
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container
        const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100
        if (isNearBottom) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }

  const simulateTyping = (duration: number = 2000) => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
    }, duration)
  }

  const sendMessage = async () => {
    if (!currentMessage.trim() || !user) return

    const messageText = currentMessage.trim()
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setCurrentMessage('')

    // Guardar mensaje del usuario en la sesión activa
    if (activeSession?.id) {
      await communicationService.saveUserMessage(user.id, messageText, currentStep)
    }

    // Simular que Sofía está escribiendo
    simulateTyping()

    // Después de un delay, enviar respuesta de Sofía si hay más mensajes
    setTimeout(() => {
      if (currentStep < sofiaMessages.length) {
        const sofiaMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: sofiaMessages[currentStep],
          sender: 'sofia',
          timestamp: new Date()
        }

        setMessages(prev => [...prev, sofiaMessage])
        setCurrentStep(prev => prev + 1)
      } else {
        // Mostrar mensaje de que se está generando la evaluación
        const evaluationMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          text: "Estoy generando tu evaluación personalizada... ✨",
          sender: 'sofia',
          timestamp: new Date(),
          isTyping: false
        }
        
        setMessages(prev => [...prev, evaluationMessage])
        
        // Después de mostrar el mensaje, generar evaluación
        setTimeout(() => {
          generateEvaluation(newMessages)
        }, 1500)
      }
    }, 2000)
  }

  const generateEvaluation = async (conversationMessages: ChatMessage[]) => {
    if (!user) return

    try {
      // Preparar contexto de la conversación para la IA
      const conversationContext = conversationMessages
        .filter(msg => msg.sender === 'user')
        .map(msg => msg.text)
        .join('\n')

      const evaluationPrompt = `
        Analiza las respuestas de este usuario y proporciona feedback directo en primera persona:

        SITUACIÓN DE VALERIA:
        - Es nueva en el colegio
        - No tiene amigos
        - Se siente rechazada y sola
        - Tiene miedo de acercarse a otros niños
        - Tuvo una experiencia negativa en el almuerzo

        RESPUESTAS DEL USUARIO:
        ${conversationContext}

        Proporciona un feedback directo al usuario (en segunda persona - "tú") considerando:
        1. Nivel de empatía mostrado
        2. Calidad de los consejos dados
        3. Comprensión de la situación emocional de Valeria
        4. Habilidades de comunicación demostradas

        El feedback debe:
        - Hablar directamente al usuario ("Tú mostraste...", "Tu respuesta fue...")
        - Ser positivo y motivador
        - Destacar fortalezas específicas
        - Ofrecer 1-2 consejos concretos para mejorar
        - Ser conciso (máximo 150 palabras)
        - Usar lenguaje apropiado para la edad del usuario

        Máximo 150 palabras.
      `

      const aiEvaluation = await openaiService.analyzeUserBehavior({
        user_id: user.id,
        email: user.email || '',
        nombre: '',
        apellido: '',
        grado: '',
        nombre_colegio: '',
        ciudad: '',
        pais: '',
        edad: 0,
        sexo: '',
        avatar_url: ''
      }, evaluationPrompt)


      // Guardar sesión completa
      await communicationService.completeSession(user.id, conversationMessages, aiEvaluation)
      
      // Recargar sesiones y mostrar evaluación
      await loadAllSessions()
      setViewMode('evaluation')

    } catch (error) {
      console.error('Error generating evaluation:', error)
      
      // Guardar evaluación por defecto en caso de error
      const defaultEvaluation = '¡Excelente trabajo! Mostraste mucha empatía y comprensión hacia Valeria. Tus consejos fueron muy considerados y demuestran que entiendes cómo se siente. Sigue practicando estas habilidades de comunicación.'
      await communicationService.completeSession(user.id, conversationMessages, defaultEvaluation)
      await loadAllSessions()
      setViewMode('evaluation')
    }
  }

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
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
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-purple-400 flex items-center justify-center">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
            Cargando La Comunicación...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-purple-400">
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
            <MessageCircle size={32} className="text-white" />
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              La Comunicación
            </h1>
          </div>
          <UserMenu />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Vista de Tarjetas */}
        {viewMode === 'cards' && (
          <div className="mb-8 bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 text-center">
            <h3 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'Fredoka' }}>
              💬 Mis Conversaciones con Valeria
            </h3>
            
            {allSessions.length === 0 ? (
              <div>
                <div className="text-white font-bold text-opacity-100 text-base space-y-2 mb-6" style={{ fontFamily: 'Comic Neue' }}>
                  <p>• Lee cuidadosamente lo que Valeria te cuenta</p>
                  <p>• Responde con empatía y comprensión</p>
                  <p>• Ofrece consejos útiles y positivos</p>
                  <p>• Ayúdala a sentirse mejor y más confiada</p>
                  <p>• Al final recibirás una evaluación de tu empatía</p>
                </div>
                
                <button
                  onClick={startNewConversation}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all transform hover:scale-105 flex items-center justify-center gap-3 mx-auto"
                  style={{ fontFamily: 'Fredoka' }}
                >
                  <MessageCircle size={24} />
                  Comenzar Nueva Conversación
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  {/* Tarjeta Nueva Conversación */}
                  <div
                    onClick={startNewConversation}
                    className="bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all transform hover:scale-105 border-4 border-white border-opacity-30"
                  >
                    <div className="text-center text-white">
                      <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Plus size={32} />
                      </div>
                      <h4 className="text-xl font-bold mb-2" style={{ fontFamily: 'Fredoka' }}>
                        Nueva Conversación
                      </h4>
                      <p className="text-sm opacity-90" style={{ fontFamily: 'Comic Neue' }}>
                        Inicia una nueva charla con Valeria
                      </p>
                    </div>
                  </div>
                  
                  {/* Tarjetas de Conversaciones Existentes */}
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
                          <div className="w-12 h-12 bg-pink-300 rounded-full flex items-center justify-center">
                            <span className="text-2xl">👧</span>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold" style={{ fontFamily: 'Fredoka' }}>
                              Conversación #{index + 1}
                            </h4>
                            <p className="text-sm opacity-80" style={{ fontFamily: 'Comic Neue' }}>
                              {formatDate(session.created_at!)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageCircle size={16} />
                            <span className="text-sm font-medium">
                              {session.messages?.length || 0} mensajes
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
                          {session.completed_at ? 'Ver Conversación y Feedback' : 'Continuar Conversación'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Vista de Chat */}
        {viewMode === 'chat' && (
          <div>
            {/* Instructions */}
            <div className="mb-8 bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 text-center">
              <h3 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'Fredoka' }}>
                💡 Instrucciones
              </h3>
              <div className="text-white font-bold text-opacity-100 text-base space-y-2" style={{ fontFamily: 'Comic Neue' }}>
                <p>• Lee cuidadosamente lo que Valeria te cuenta</p>
                <p>• Responde con empatía y comprensión</p>
                <p>• Ofrece consejos útiles y positivos</p>
                <p>• Ayúdala a sentirse mejor y más confiada</p>
                <p>• Al final recibirás una evaluación de tu empatía</p>
              </div>
              
              <div className="mt-6 bg-white bg-opacity-20 rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 text-white">
                  <Heart size={20} className="text-red-300" />
                  <span className="text-base font-bold">
                    Progreso: {Math.min(currentStep, sofiaMessages.length)}/{sofiaMessages.length} conversaciones
                  </span>
                </div>
                <div className="w-full bg-white bg-opacity-30 rounded-full h-3 mt-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${(Math.min(currentStep, sofiaMessages.length) / sofiaMessages.length) * 100}%` }}
                  />
                </div>
              </div>
              
              <button
                onClick={backToCards}
                className="mt-4 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                ← Volver a Mis Conversaciones
              </button>
            </div>
            
            {/* Tablet Frame */}
            <div className="bg-black rounded-[2rem] p-3 shadow-2xl">
              {/* Tablet Screen */}
              <div className="bg-white rounded-[1.5rem] overflow-hidden h-[600px] flex flex-col">
                {/* Status Bar */}
                <div className="bg-gray-900 text-white px-6 py-2 flex justify-between items-center text-sm">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{getCurrentTime()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Signal size={16} />
                    <Wifi size={16} />
                    <Battery size={16} />
                  </div>
                </div>

                {/* WhatsApp Header */}
                <div className="bg-green-500 text-white px-4 py-3 flex items-center gap-3 shadow-lg">
                  <button
                    onClick={backToCards}
                    className="text-white hover:text-gray-200"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="w-12 h-12 bg-pink-300 rounded-full flex items-center justify-center">
                    <span className="text-3xl">👧</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl" style={{ fontFamily: 'Fredoka' }}>
                      Valeria
                    </h3>
                    <p className="text-sm text-green-100">
                      {isTyping ? 'escribiendo...' : 'en línea'}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Phone size={24} />
                    <MoreVertical size={24} />
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 bg-gray-100 p-6 overflow-y-auto space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-4 rounded-2xl shadow-sm ${
                          message.sender === 'user'
                            ? 'bg-green-500 text-white rounded-br-md'
                            : 'bg-white text-gray-800 rounded-bl-md'
                        }`}
                      >
                        <p className="text-lg leading-relaxed" style={{ fontFamily: 'Comic Neue' }}>
                          {message.text}
                        </p>
                        <div className={`text-sm mt-2 flex items-center gap-1 ${
                          message.sender === 'user' ? 'text-green-100 justify-end' : 'text-gray-500'
                        }`}>
                          <span>{message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                          {message.sender === 'user' && (
                            <CheckCircle size={14} className="text-green-200" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md p-4 shadow-sm">
                        <div className="flex items-center gap-1">
                          <div className="flex gap-1">
                            <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-500 ml-3">Valeria está escribiendo...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                {currentStep <= sofiaMessages.length && (
                  <div className="bg-white border-t border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                      <button className="text-gray-500 hover:text-gray-700">
                        <Smile size={28} />
                      </button>
                      <div className="flex-1 bg-gray-100 rounded-full px-5 py-3 flex items-center gap-3">
                        <input
                          type="text"
                          value={currentMessage}
                          onChange={(e) => setCurrentMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Escribe un mensaje..."
                          className="flex-1 bg-transparent outline-none text-gray-800 text-lg"
                          style={{ fontFamily: 'Comic Neue' }}
                          disabled={isTyping}
                          autoComplete="off"
                        />
                        <button className="text-gray-500 hover:text-gray-700">
                          <Camera size={24} />
                        </button>
                      </div>
                      <button
                        onClick={sendMessage}
                        disabled={!currentMessage.trim() || isTyping}
                        className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {currentMessage.trim() ? <Send size={24} /> : <Mic size={24} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Vista de Evaluación */}
        {viewMode === 'evaluation' && activeSession && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {/* Botón volver */}
            <div className="mb-6">
              <button
                onClick={backToCards}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Volver a Mis Conversaciones
              </button>
            </div>
            
            {/* Show Previous Conversation */}
            <div className="mb-8 bg-gray-50 rounded-2xl p-6 border-l-4 border-blue-500">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                <MessageCircle size={24} className="text-blue-500" />
                Tu Conversación con Valeria
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-3">
                {activeSession.messages?.map((message: any) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        message.sender === 'user'
                          ? 'bg-blue-500 text-white rounded-br-md'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                      }`}
                    >
                      <p className="leading-relaxed" style={{ fontFamily: 'Comic Neue' }}>
                        {message.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Fredoka' }}>
                ¡Excelente Trabajo!
              </h2>
              <p className="text-lg text-gray-600" style={{ fontFamily: 'Comic Neue' }}>
                Has completado la actividad de comunicación con Valeria
              </p>
            </div>

            {/* AI Evaluation */}
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-6 mb-8 border-l-4 border-blue-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <Sparkles size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Fredoka' }}>
                  Evaluación de tu Empatía
                </h3>
              </div>
              
              <div className="text-gray-700 text-lg leading-relaxed" style={{ fontFamily: 'Comic Neue' }}>
                {activeSession.ai_evaluation?.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            {/* Close Activity Message */}
            <div className="mt-6 text-center">
              <p className="text-lg text-gray-600 font-medium" style={{ fontFamily: 'Comic Neue' }}>
                💡 Para cerrar esta actividad, haz clic en la <span className="font-bold text-gray-800">X</span> de la esquina superior derecha
              </p>
            </div>

            {/* Fun Elements */}
            <div className="mt-8 text-center">
              <div className="flex justify-center gap-4 text-4xl">
                <span className="animate-pulse">💬</span>
                <span className="animate-pulse" style={{ animationDelay: '0.1s' }}>❤️</span>
                <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>🤝</span>
                <span className="animate-pulse" style={{ animationDelay: '0.3s' }}>✨</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default LaComunicacion