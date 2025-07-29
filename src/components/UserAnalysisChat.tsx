import React, { useState, useRef, useEffect } from 'react'
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader, 
  Brain,
  X,
  Sparkles,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { openaiService } from '../lib/openaiService'
import { dashboardService } from '../lib/dashboardService'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface UserAnalysisChatProps {
  userData: any
  isOpen: boolean
  onClose: () => void
}

const UserAnalysisChat: React.FC<UserAnalysisChatProps> = ({ userData, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasInitialAnalysis, setHasInitialAnalysis] = useState(false)
  const [fullUserData, setFullUserData] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Cargar datos completos del usuario cuando se abre el chat
  useEffect(() => {
    if (isOpen && userData?.user_id) {
      loadFullUserData()
    }
  }, [isOpen, userData?.user_id])

  const loadFullUserData = async () => {
    if (!userData?.user_id) return

    try {
      const detailedData = await dashboardService.getUserActivityDetails(userData.user_id)
      setFullUserData(detailedData)
      console.log('Datos completos del usuario cargados:', detailedData)
    } catch (error) {
      console.error('Error cargando datos completos del usuario:', error)
      setError('Error al cargar los datos completos del usuario')
    }
  }
  const generateInitialAnalysis = async () => {
    if (hasInitialAnalysis) return

    if (!fullUserData) {
      setError('Los datos del usuario aún no están disponibles. Por favor, espera un momento.')
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      const analysis = await openaiService.analyzeUserBehavior(fullUserData)
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: analysis,
        timestamp: new Date()
      }

      setMessages([assistantMessage])
      setHasInitialAnalysis(true)
    } catch (err) {
      console.error('Error generating initial analysis:', err)
      setError('Error al generar el análisis inicial. Por favor, intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    if (!fullUserData) {
      setError('Los datos del usuario aún no están disponibles. Por favor, espera un momento.')
      return
    }
    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputMessage('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await openaiService.chatWithAnalysis(fullUserData, newMessages)
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages([...newMessages, assistantMessage])
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Error al enviar el mensaje. Por favor, intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetChat = () => {
    setMessages([])
    setHasInitialAnalysis(false)
    setError(null)
  }

  if (!isOpen) return null

  const userName = `${userData.nombre || ''} ${userData.apellido || ''}`.trim() || 'Usuario'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col border-4 border-indigo-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-3xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Brain size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Fredoka' }}>
                Análisis Socioemocional
              </h3>
              <p className="text-indigo-200 text-sm" style={{ fontFamily: 'Comic Neue' }}>
                Análisis de {userName} • {userData.edad} años • {userData.grado}
                {fullUserData && <span className="ml-2 text-green-300">• Datos cargados ✓</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetChat}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all"
              title="Reiniciar chat"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles size={32} className="text-indigo-600" />
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Fredoka' }}>
                Análisis Socioemocional con IA
              </h4>
              <p className="text-gray-600 max-w-md mx-auto mb-6" style={{ fontFamily: 'Comic Neue' }}>
                Genera un análisis completo del comportamiento y desarrollo socioemocional de {userName} 
                basado en todas sus actividades en la plataforma.
              </p>
              {!fullUserData ? (
                <div className="flex items-center justify-center gap-2 text-gray-500 mb-4">
                  <Loader size={20} className="animate-spin" />
                  <span>Cargando datos del usuario...</span>
                </div>
              ) : (
              <button
                onClick={generateInitialAnalysis}
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-3 rounded-full font-bold transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
              >
                <Brain size={20} />
                Generar Análisis Inicial
              </button>
              )}
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={20} className="text-white" />
                </div>
              )}
              
              <div
                className={`max-w-3xl p-4 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-indigo-500 text-white ml-12'
                    : 'bg-white border border-gray-200 mr-12'
                }`}
              >
                <div className="whitespace-pre-wrap" style={{ fontFamily: 'Comic Neue' }}>
                  {message.content}
                </div>
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-indigo-200' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={20} className="text-white" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot size={20} className="text-white" />
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-2xl mr-12">
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader size={16} className="animate-spin" />
                  <span style={{ fontFamily: 'Comic Neue' }}>
                    Analizando datos socioemocionales...
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-gray-200 bg-white rounded-b-3xl">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Haz una pregunta específica sobre el análisis socioemocional..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={isLoading || !fullUserData}
              style={{ fontFamily: 'Comic Neue' }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading || !fullUserData}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white p-3 rounded-full transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </div>
          
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500" style={{ fontFamily: 'Comic Neue' }}>
              💡 Puedes preguntar sobre patrones emocionales, recomendaciones específicas, o profundizar en cualquier aspecto del análisis
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserAnalysisChat