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

  // Función para formatear el contenido del mensaje con HTML
  const formatMessageContent = (content: string, isUser: boolean = false) => {
    let formattedContent = content
      // Convertir **texto** a <strong>texto</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      // Convertir *texto* a <em>texto</em>
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      // Convertir títulos con números (1., 2., etc.)
      .replace(/^(\d+\.\s+)(.+)$/gm, '<div class="mt-4 mb-2"><span class="font-bold text-lg">$1</span><span class="font-semibold">$2</span></div>')
      // Convertir líneas que empiezan con • en listas
      .replace(/^•\s+(.+)$/gm, '<div class="ml-4 mb-1 flex items-start"><span class="mr-2 mt-1 w-2 h-2 bg-current rounded-full flex-shrink-0"></span><span>$1</span></div>')
      // Convertir líneas que empiezan con - en listas
      .replace(/^-\s+(.+)$/gm, '<div class="ml-4 mb-1 flex items-start"><span class="mr-2 mt-1 w-2 h-2 bg-current rounded-full flex-shrink-0"></span><span>$1</span></div>')
      // Convertir títulos en MAYÚSCULAS
      .replace(/^([A-ZÁÉÍÓÚÑ\s]+):$/gm, '<h3 class="text-lg font-bold mt-6 mb-3 border-b border-current pb-1">$1</h3>')
      // Convertir subtítulos que terminan en :
      .replace(/^([^:\n]+):$/gm, '<h4 class="font-semibold mt-4 mb-2 text-base">$1:</h4>')
      // Convertir saltos de línea dobles en párrafos
      .replace(/\n\n/g, '</p><p class="mb-3">')
      // Envolver todo en párrafos
      .replace(/^/, '<p class="mb-3">')
      .replace(/$/, '</p>')
      // Limpiar párrafos vacíos
      .replace(/<p class="mb-3"><\/p>/g, '')
      // Aplicar colores específicos para el rol del usuario
      .replace(/<strong class="font-bold">/g, `<strong class="font-bold ${isUser ? 'text-yellow-200' : 'text-indigo-700'}">`)
      .replace(/<em class="italic">/g, `<em class="italic ${isUser ? 'text-blue-200' : 'text-purple-600'}">`)
      .replace(/<h3 class="text-lg font-bold mt-6 mb-3 border-b border-current pb-1">/g, `<h3 class="text-lg font-bold mt-6 mb-3 border-b ${isUser ? 'border-white' : 'border-gray-400'} pb-1 ${isUser ? 'text-yellow-100' : 'text-indigo-800'}">`)
      .replace(/<h4 class="font-semibold mt-4 mb-2 text-base">/g, `<h4 class="font-semibold mt-4 mb-2 text-base ${isUser ? 'text-blue-100' : 'text-purple-700'}">`)

    return formattedContent
  }
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
      console.log('🚀 Iniciando análisis inicial...')
      console.log('📊 Datos del usuario:', fullUserData)
      
      const analysis = await openaiService.analyzeUserBehavior(fullUserData)
      
      console.log('✅ Análisis recibido:', analysis.substring(0, 100) + '...')
      
      // Verificar si la respuesta es un error
      if (analysis.startsWith('Error:')) {
        setError(analysis)
        return
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: analysis,
        timestamp: new Date()
      }

      setMessages([assistantMessage])
      setHasInitialAnalysis(true)
    } catch (err) {
      console.error('Error generating initial analysis:', err)
      setError(`Error al generar el análisis inicial: ${err.message || 'Error desconocido'}`)
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
      console.log('💬 Enviando mensaje del usuario...')
      
      const response = await openaiService.chatWithAnalysis(fullUserData, newMessages)
      
      console.log('✅ Respuesta del chat recibida')
      
      // Verificar si la respuesta es un error
      if (response.startsWith('Error:')) {
        setError(response)
        return
      }
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages([...newMessages, assistantMessage])
    } catch (err) {
      console.error('Error sending message:', err)
      setError(`Error al enviar el mensaje: ${err.message || 'Error desconocido'}`)
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-gray-100">
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
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-8 py-4 rounded-full font-bold transition-all transform hover:scale-105 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl"
              >
                <Brain size={20} />
                Generar Análisis Inicial
              </button>
              )}
              
              {/* Debug info para desarrollo */}
              {process.env.NODE_ENV === 'development' && fullUserData && (
                <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs">
                  <details>
                    <summary className="cursor-pointer font-bold">Debug: Datos del usuario</summary>
                    <pre className="mt-2 overflow-auto max-h-40">
                      {JSON.stringify(fullUserData, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              {message.role === 'assistant' && (
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Bot size={20} className="text-white" />
                </div>
              )}
              
              <div
                className={`max-w-3xl p-6 rounded-2xl shadow-lg ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white ml-16 shadow-indigo-200'
                    : 'bg-white border border-gray-200 mr-16 shadow-gray-200'
                }`}
              >
                <div 
                  className={`leading-relaxed ${
                    message.role === 'user' ? 'text-white' : 'text-gray-800'
                  }`}
                  style={{ fontFamily: 'Comic Neue' }}
                  dangerouslySetInnerHTML={{ 
                    __html: formatMessageContent(message.content, message.role === 'user')
                  }}
                />
                <div className={`text-xs mt-4 pt-2 border-t ${
                  message.role === 'user' ? 'text-indigo-200' : 'text-gray-500'
                } ${message.role === 'user' ? 'border-indigo-400' : 'border-gray-200'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <User size={20} className="text-white" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <Bot size={20} className="text-white" />
              </div>
              <div className="bg-white border border-gray-200 p-6 rounded-2xl mr-16 shadow-lg">
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
            <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-lg flex items-center gap-3 shadow-lg">
              <AlertCircle size={20} />
              <div>
                <div className="font-semibold">Error en el análisis:</div>
                <div className="text-sm whitespace-pre-wrap">{error}</div>
                <div className="text-xs mt-2 opacity-70">
                  Si el problema persiste, verifica que la API key de OpenAI esté configurada correctamente.
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-b-3xl">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Haz una pregunta específica sobre el análisis socioemocional..."
              className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-400 transition-all shadow-sm"
              disabled={isLoading || !fullUserData}
              style={{ fontFamily: 'Comic Neue' }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading || !fullUserData}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white p-4 rounded-full transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
        
        {/* CSS para animaciones */}
        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-fade-in {
            animation: fade-in 0.3s ease-out;
          }
        `}</style>
      </div>
    </div>
  )
}

export default UserAnalysisChat