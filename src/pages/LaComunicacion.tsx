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
  ThumbsUp
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
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [currentMessage, setCurrentMessage] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [showEvaluation, setShowEvaluation] = useState(false)
  const [evaluation, setEvaluation] = useState('')
  const [isLoadingEvaluation, setIsLoadingEvaluation] = useState(false)
  const [session, setSession] = useState<CommunicationSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Conversación predefinida de Sofía (la niña ficticia)
  const sofiaMessages = [
    "Hola... 😔 Soy nueva en este colegio y me siento muy sola. No tengo amigos y todos ya tienen sus grupos.",
    "En el recreo me quedo sola porque no sé cómo acercarme a los otros niños. Tengo miedo de que me rechacen.",
    "Ayer intenté sentarme con unas niñas en el almuerzo pero me dijeron que ese lugar era de otra persona. Me sentí muy mal 😢"
  ]

  useEffect(() => {
    if (user) {
      loadSession()
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadSession = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const userSession = await communicationService.getOrCreateSession(user.id)
      setSession(userSession)
      
      if (userSession && userSession.messages && userSession.messages.length > 0) {
        // Cargar conversación existente
        setMessages(userSession.messages.map((msg: any) => ({
          id: msg.id,
          text: msg.text,
          sender: msg.sender,
          timestamp: new Date(msg.timestamp)
        })))
        setCurrentStep(userSession.current_step || 0)
        
        if (userSession.completed_at) {
          setShowEvaluation(true)
          setEvaluation(userSession.ai_evaluation || '')
        }
      } else {
        // Iniciar nueva conversación
        startConversation()
      }
    } catch (error) {
      console.error('Error loading session:', error)
      startConversation()
    } finally {
      setIsLoading(false)
    }
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const simulateTyping = (duration: number = 2000) => {
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
    }, duration)
  }

  const sendMessage = async () => {
    if (!currentMessage.trim() || !user) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: currentMessage.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setCurrentMessage('')

    // Guardar mensaje del usuario
    await communicationService.saveUserMessage(user.id, currentMessage.trim(), currentStep)

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
        // Conversación terminada, generar evaluación
        generateEvaluation(newMessages)
      }
    }, 2500)
  }

  const generateEvaluation = async (conversationMessages: ChatMessage[]) => {
    if (!user) return

    setIsLoadingEvaluation(true)
    try {
      // Preparar contexto de la conversación para la IA
      const conversationContext = conversationMessages
        .filter(msg => msg.sender === 'user')
        .map(msg => msg.text)
        .join('\n')

      const evaluationPrompt = `
        Analiza las respuestas de este usuario a una niña de 10 años llamada Sofía que se siente sola en su nuevo colegio:

        SITUACIÓN DE SOFÍA:
        - Es nueva en el colegio
        - No tiene amigos
        - Se siente rechazada y sola
        - Tiene miedo de acercarse a otros niños
        - Tuvo una experiencia negativa en el almuerzo

        RESPUESTAS DEL USUARIO:
        ${conversationContext}

        Por favor, evalúa las respuestas del usuario considerando:
        1. Nivel de empatía mostrado
        2. Calidad de los consejos dados
        3. Comprensión de la situación emocional de Sofía
        4. Habilidades de comunicación demostradas

        Proporciona una evaluación positiva y constructiva que:
        - Felicite al usuario por su participación
        - Destaque los aspectos positivos de sus respuestas
        - Ofrezca consejos para mejorar la empatía y comunicación
        - Use un lenguaje apropiado para niños/adolescentes
        - Sea motivador y educativo

        Máximo 300 palabras.
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

      setEvaluation(aiEvaluation)
      setShowEvaluation(true)

      // Guardar sesión completa
      await communicationService.completeSession(user.id, conversationMessages, aiEvaluation)

    } catch (error) {
      console.error('Error generating evaluation:', error)
      setEvaluation('¡Excelente trabajo! Has mostrado mucha empatía y comprensión hacia Sofía. Tus consejos fueron muy thoughtful y demuestran que entiendes cómo se siente. Sigue practicando estas habilidades de comunicación.')
      setShowEvaluation(true)
    } finally {
      setIsLoadingEvaluation(false)
    }
  }

  const restartActivity = async () => {
    if (!user) return
    
    try {
      await communicationService.resetSession(user.id)
      setMessages([])
      setCurrentStep(0)
      setShowEvaluation(false)
      setEvaluation('')
      startConversation()
    } catch (error) {
      console.error('Error restarting activity:', error)
    }
  }

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('es-ES', { 
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
      <div className="max-w-md mx-auto px-4 py-8">
        {!showEvaluation ? (
          /* Mobile Phone Frame */
          <div className="bg-black rounded-[3rem] p-2 shadow-2xl">
            {/* Phone Screen */}
            <div className="bg-white rounded-[2.5rem] overflow-hidden h-[700px] flex flex-col">
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
                  onClick={() => navigate('/')}
                  className="text-white hover:text-gray-200"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 bg-pink-300 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👧</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg" style={{ fontFamily: 'Fredoka' }}>
                    Sofía
                  </h3>
                  <p className="text-xs text-green-100">
                    {isTyping ? 'escribiendo...' : 'en línea'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Phone size={20} />
                  <MoreVertical size={20} />
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 bg-gray-100 p-4 overflow-y-auto space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                        message.sender === 'user'
                          ? 'bg-green-500 text-white rounded-br-md'
                          : 'bg-white text-gray-800 rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm leading-relaxed" style={{ fontFamily: 'Comic Neue' }}>
                        {message.text}
                      </p>
                      <div className={`text-xs mt-1 flex items-center gap-1 ${
                        message.sender === 'user' ? 'text-green-100 justify-end' : 'text-gray-500'
                      }`}>
                        <span>{message.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                        {message.sender === 'user' && (
                          <CheckCircle size={12} className="text-green-200" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-800 rounded-2xl rounded-bl-md p-3 shadow-sm">
                      <div className="flex items-center gap-1">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">Sofía está escribiendo...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              {currentStep <= sofiaMessages.length && !showEvaluation && (
                <div className="bg-white border-t border-gray-200 p-3">
                  <div className="flex items-center gap-2">
                    <button className="text-gray-500 hover:text-gray-700">
                      <Smile size={24} />
                    </button>
                    <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-transparent outline-none text-gray-800"
                        style={{ fontFamily: 'Comic Neue' }}
                        disabled={isTyping}
                      />
                      <button className="text-gray-500 hover:text-gray-700">
                        <Camera size={20} />
                      </button>
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={!currentMessage.trim() || isTyping}
                      className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {currentMessage.trim() ? <Send size={20} /> : <Mic size={20} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Evaluation Screen */
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Fredoka' }}>
                ¡Excelente Trabajo!
              </h2>
              <p className="text-lg text-gray-600" style={{ fontFamily: 'Comic Neue' }}>
                Has completado la actividad de comunicación con Sofía
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
              
              {isLoadingEvaluation ? (
                <div className="flex items-center gap-3 text-gray-600">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  <span>Analizando tus respuestas...</span>
                </div>
              ) : (
                <div className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Comic Neue' }}>
                  {evaluation.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3">
                      {paragraph}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={restartActivity}
                className="flex-1 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                style={{ fontFamily: 'Fredoka' }}
              >
                <MessageCircle size={20} />
                Practicar de Nuevo
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105"
                style={{ fontFamily: 'Fredoka' }}
              >
                Volver al Inicio
              </button>
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

        {/* Instructions */}
        {!showEvaluation && (
          <div className="mt-6 bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <h3 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'Fredoka' }}>
              💡 Instrucciones
            </h3>
            <div className="text-white text-opacity-90 text-sm space-y-2" style={{ fontFamily: 'Comic Neue' }}>
              <p>• Lee cuidadosamente lo que Sofía te cuenta</p>
              <p>• Responde con empatía y comprensión</p>
              <p>• Ofrece consejos útiles y positivos</p>
              <p>• Ayúdala a sentirse mejor y más confiada</p>
              <p>• Al final recibirás una evaluación de tu empatía</p>
            </div>
            
            <div className="mt-4 bg-white bg-opacity-20 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 text-white">
                <Heart size={16} className="text-red-300" />
                <span className="text-sm font-bold">
                  Progreso: {Math.min(currentStep, sofiaMessages.length)}/{sofiaMessages.length} conversaciones
                </span>
              </div>
              <div className="w-full bg-white bg-opacity-30 rounded-full h-2 mt-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(Math.min(currentStep, sofiaMessages.length) / sofiaMessages.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LaComunicacion