import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import UserAnalysisChat from '../components/UserAnalysisChat'
import { dashboardService, UserActivityDetails } from '../lib/dashboardService'
import { 
  ArrowLeft, 
  User, 
  FileText,
  Mail,
  Heart,
  Brain,
  Flame,
  Clock,
  Calendar,
  MapPin,
  School,
  Users,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Smile,
  MessageCircle,
  Shield,
  Candy
} from 'lucide-react'

const UserDetailPage = () => {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const { user } = useAuth()
  const [userDetails, setUserDetails] = useState<UserActivityDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('timeline')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAnalysisChat, setShowAnalysisChat] = useState(false)

  useEffect(() => {
    if (userId) {
      loadUserDetails(userId)
    }
  }, [userId])

  const loadUserDetails = async (id: string) => {
    setIsLoading(true)
    try {
      const details = await dashboardService.getUserActivityDetails(id)
      setUserDetails(details)
    } catch (error) {
      console.error('Error loading user details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUserDetails = async () => {
    if (!userId) return
    
    setIsRefreshing(true)
    try {
      await dashboardService.forceUpdateDashboard(userId)
      await loadUserDetails(userId)
    } catch (error) {
      console.error('Error refreshing user details:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
            Cargando detalles del usuario...
          </p>
        </div>
      </div>
    )
  }

  if (!userDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl p-8 text-center">
          <User size={64} className="mx-auto mb-4 text-white opacity-50" />
          <p className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
            Usuario no encontrado
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-full font-bold transition-all transform hover:scale-105"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Header */}
      <div className="bg-black bg-opacity-20 backdrop-blur-lg border-b border-white border-opacity-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 bg-white bg-opacity-10 hover:bg-opacity-20 text-white px-4 py-2 rounded-full font-bold transition-all"
              >
                <ArrowLeft size={20} />
                Volver
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                  {userDetails.nombre} {userDetails.apellido}
                </h1>
                <p className="text-white text-opacity-80" style={{ fontFamily: 'Comic Neue' }}>
                  {userDetails.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={refreshUserDetails}
                disabled={isRefreshing}
                aria-label="Actualizar datos"
                className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white px-4 py-2 rounded-full font-bold transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRefreshing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <RefreshCw size={20} />
                )}
                Actualizar Datos
              </button>
              <button
                onClick={() => setShowAnalysisChat(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-full font-bold transition-all transform hover:scale-105"
              >
                <MessageCircle size={20} />
                Análisis IA
              </button>
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <Calendar size={24} className="text-blue-300" />
              <div>
                <div className="text-sm text-white text-opacity-70">Edad</div>
                <div className="text-lg font-bold text-white">{userDetails.edad || 'No especificada'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <School size={24} className="text-green-300" />
              <div>
                <div className="text-sm text-white text-opacity-70">Grado</div>
                <div className="text-lg font-bold text-white">{userDetails.grado || 'No especificado'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <School size={24} className="text-yellow-300" />
              <div>
                <div className="text-sm text-white text-opacity-70">Colegio</div>
                <div className="text-lg font-bold text-white">{userDetails.nombre_colegio || 'No especificado'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={24} className="text-red-300" />
              <div>
                <div className="text-sm text-white text-opacity-70">Ubicación</div>
                <div className="text-lg font-bold text-white">
                  {userDetails.ciudad ? `${userDetails.ciudad}, ${userDetails.pais}` : userDetails.pais || 'No especificada'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Tabs */}
        <div className="mb-6">
          <div className="flex overflow-x-auto space-x-2 pb-2">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                activeTab === 'timeline' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white bg-opacity-10 text-white text-opacity-70 hover:bg-opacity-20'
              }`}
            >
              Línea del Tiempo ({userDetails.timeline_notes?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                activeTab === 'responses' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white bg-opacity-10 text-white text-opacity-70 hover:bg-opacity-20'
              }`}
            >
              Cuéntame Quién Eres ({userDetails.user_responses?.filter(r => r.activity_type === 'cuentame_quien_eres').length || 0})
            </button>
            <button
              onClick={() => setActiveTab('letters')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                activeTab === 'letters' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-white bg-opacity-10 text-white text-opacity-70 hover:bg-opacity-20'
              }`}
            >
              Cartas ({userDetails.letters?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('meditation')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                activeTab === 'meditation' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-white bg-opacity-10 text-white text-opacity-70 hover:bg-opacity-20'
              }`}
            >
              Meditación ({userDetails.meditation_sessions?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('emotion_logs')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                activeTab === 'emotion_logs' 
                  ? 'bg-pink-400 text-white' 
                  : 'bg-white bg-opacity-10 text-white text-opacity-70 hover:bg-opacity-20'
              }`}
            >
              Calculadora de Emociones ({userDetails.emotion_logs?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('emotion_matches')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                activeTab === 'emotion_matches' 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-white bg-opacity-10 text-white text-opacity-70 hover:bg-opacity-20'
              }`}
            >
              Nombra tus Emociones ({userDetails.emotion_matches?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('communication')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                activeTab === 'communication' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white bg-opacity-10 text-white text-opacity-70 hover:bg-opacity-20'
              }`}
            >
              La Comunicación ({userDetails.communication_sessions?.length || 0})
            </button>
            
            <button
              onClick={() => setActiveTab('semaforo_limites')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                activeTab === 'semaforo_limites' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white bg-opacity-10 text-white text-opacity-70 hover:bg-opacity-20'
              }`}
            >
              Semáforo de Límites ({userDetails.semaforo_limites_sessions?.length || 0})
            </button>
            
            <button
              onClick={() => setActiveTab('problema_resuelto')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                activeTab === 'problema_resuelto' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white bg-opacity-10 text-white text-opacity-70 hover:bg-opacity-20'
              }`}
            >
              Problema Resuelto ({userDetails.problema_resuelto_sessions?.length || 0})
            </button>
            
            <button
              onClick={() => setActiveTab('dulces_magicos')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                activeTab === 'dulces_magicos' 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-white bg-opacity-10 text-white text-opacity-70 hover:bg-opacity-20'
              }`}
            >
              Dulces Mágicos ({userDetails.dulces_magicos_sessions?.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('anger')}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                activeTab === 'anger' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white bg-opacity-10 text-white text-opacity-70 hover:bg-opacity-20'
              }`}
            >
              Menú de la Ira ({userDetails.anger_management_sessions?.length || 0})
            </button>
          </div>
        </div>

        {/* Activity Content */}
        <div className="bg-black bg-opacity-20 backdrop-blur-lg rounded-3xl p-6 border border-white border-opacity-10">
          {/* Timeline Notes */}
          {activeTab === 'timeline' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                <FileText size={24} className="text-blue-400" />
                Notas de Línea del Tiempo
              </h3>
              
              {userDetails.timeline_notes && userDetails.timeline_notes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userDetails.timeline_notes.map(note => (
                    <div 
                      key={note.id} 
                      className={`p-4 rounded-lg ${note.shape || 'rounded-lg'}`}
                      style={{ 
                        backgroundColor: note.color || '#f0f0f0',
                        fontFamily: note.font || 'inherit'
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-2xl">{note.emoji}</span>
                        <div>
                          <p className="font-medium">{note.text}</p>
                          <div className="flex justify-between items-center mt-2 text-xs text-gray-700">
                            <span>{note.section}</span>
                            <span>{new Date(note.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white text-opacity-70">
                  <FileText size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-xl" style={{ fontFamily: 'Comic Neue' }}>No hay notas de línea del tiempo</p>
                </div>
              )}
            </div>
          )}
          
          {/* User Responses */}
          {activeTab === 'responses' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                <Heart size={24} className="text-green-400" />
                Cuéntame Quién Eres
              </h3>
              
              {userDetails.user_responses && userDetails.user_responses.filter(r => r.activity_type === 'cuentame_quien_eres').length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userDetails.user_responses
                    .filter(r => r.activity_type === 'cuentame_quien_eres')
                    .map(response => (
                      <div 
                        key={response.id} 
                        className={`p-4 rounded-lg ${
                          response.question === 'me_gusta' 
                            ? 'bg-green-100 border-l-4 border-green-500' 
                            : 'bg-red-100 border-l-4 border-red-500'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-2xl">
                            {response.question === 'me_gusta' ? '❤️' : '👎'}
                          </span>
                          <div>
                            <p className="font-medium text-gray-800">
                              {response.response}
                            </p>
                            <div className="text-xs text-gray-600 mt-2">
                              {response.question === 'me_gusta' ? 'Me gusta' : 'No me gusta'} • {new Date(response.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white text-opacity-70">
                  <Heart size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-xl" style={{ fontFamily: 'Comic Neue' }}>No hay respuestas de "Cuéntame Quién Eres"</p>
                </div>
              )}
            </div>
          )}
          
          {/* Letters */}
          {activeTab === 'letters' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                <Mail size={24} className="text-yellow-400" />
                Cartas a Mí Mismo
              </h3>
              
              {userDetails.letters && userDetails.letters.length > 0 ? (
                <div className="space-y-6">
                  {userDetails.letters.map(letter => (
                    <div 
                      key={letter.id} 
                      className="bg-amber-50 p-6 rounded-lg border-l-4 border-amber-500"
                    >
                      <h4 className="text-xl font-bold text-amber-800 mb-4">{letter.title}</h4>
                      <p className="text-gray-800 whitespace-pre-line" style={{ fontFamily: 'Kalam, cursive' }}>
                        {letter.content}
                      </p>
                      <div className="text-xs text-gray-600 mt-4 text-right">
                        {new Date(letter.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white text-opacity-70">
                  <Mail size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-xl" style={{ fontFamily: 'Comic Neue' }}>No hay cartas</p>
                </div>
              )}
            </div>
          )}
          
          {/* Meditation Sessions */}
          {activeTab === 'meditation' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                <Brain size={24} className="text-purple-400" />
                Sesiones de Meditación
              </h3>
              
              {userDetails.meditation_sessions && userDetails.meditation_sessions.length > 0 ? (
                <div className="space-y-6">
                  {userDetails.meditation_sessions.map(session => (
                    <div 
                      key={session.id} 
                      className="bg-purple-100 p-6 rounded-lg border-l-4 border-purple-500"
                    >
                      <h4 className="text-xl font-bold text-purple-800 mb-4">{session.video_title}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">Duración vista:</div>
                          <div className="font-bold text-purple-700">
                            {Math.floor(session.watch_duration / 60)}:{(session.watch_duration % 60).toString().padStart(2, '0')} minutos
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Completado:</div>
                          <div className="font-bold text-purple-700">
                            {session.completion_percentage}% {session.completed_at ? '(Finalizado)' : '(En progreso)'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Fecha:</div>
                          <div className="font-bold text-purple-700">
                            {new Date(session.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      {session.reflection_text && (
                        <div className="mt-4 bg-white p-4 rounded-lg">
                          <div className="text-sm text-gray-600 mb-2">Reflexión:</div>
                          <p className="text-gray-800">{session.reflection_text}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white text-opacity-70">
                  <Brain size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-xl" style={{ fontFamily: 'Comic Neue' }}>No hay sesiones de meditación</p>
                </div>
              )}
            </div>
          )}
          
          {/* Emotion Matches - "Nombra tus Emociones" */}
          {activeTab === 'emotion_matches' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                <Smile size={24} className="text-pink-400" />
                Nombra tus Emociones
                <span className="text-sm bg-pink-500 px-2 py-1 rounded-full">{userDetails.emotion_matches?.length || 0}</span>
              </h3>
              
              {/* Statistics Summary */}
              {userDetails.emotion_matches && userDetails.emotion_matches.length > 0 ? (
                <div>
                  <div className="bg-black bg-opacity-30 rounded-xl p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-white">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{userDetails.emotion_matches.length}</div>
                        <div className="text-sm opacity-80">Intentos Totales</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                          {userDetails.emotion_matches.filter(m => m.is_correct).length}
                        </div>
                        <div className="text-sm opacity-80">Aciertos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">
                          {userDetails.emotion_matches.filter(m => !m.is_correct).length}
                        </div>
                        <div className="text-sm opacity-80">Fallos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                          {userDetails.emotion_matches.length > 0 
                            ? Math.round((userDetails.emotion_matches.filter(m => m.is_correct).length / userDetails.emotion_matches.length) * 100)
                            : 0}%
                        </div>
                        <div className="text-sm opacity-80">Precisión</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userDetails.emotion_matches.map(match => (
                      <div 
                        key={match.id} 
                        className={`p-4 rounded-lg ${
                          match.is_correct 
                            ? 'bg-green-100 border-l-4 border-green-500' 
                            : 'bg-red-100 border-l-4 border-red-500'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">
                            {match.emotion_name === 'Alegría' ? '😊' :
                             match.emotion_name === 'Tristeza' ? '😢' :
                             match.emotion_name === 'Enojo' ? '😡' :
                             match.emotion_name === 'Miedo' ? '😨' :
                             match.emotion_name === 'Emoción' ? '🤩' :
                             match.emotion_name === 'Calma' ? '😌' :
                             match.emotion_name === 'Vergüenza' ? '😳' :
                             match.emotion_name === 'Confusión' ? '😕' :
                             match.emotion_name === 'Cariño' ? '🥰' :
                             match.emotion_name === 'Desilusión' ? '😞' : '😐'}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800">{match.emotion_name}</div>
                            <div className="text-xs text-gray-600">
                              {new Date(match.created_at).toLocaleString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <div className="ml-auto">
                            {match.is_correct ? (
                              <CheckCircle size={24} className="text-green-500" />
                            ) : (
                              <AlertCircle size={24} className="text-red-500" />
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-600">
                          {match.is_correct 
                            ? 'Respuesta correcta' 
                            : 'Respuesta incorrecta'}
                          {match.explanation_shown && ' • Explicación mostrada'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-white text-opacity-70 bg-black bg-opacity-20 rounded-lg">
                  <p>No hay registros de "Nombra tus Emociones"</p>
                </div>
              )}
            </div>
          )}
          
          {/* Emotion Logs - "Calculadora de Emociones" */}
          {activeTab === 'emotion_logs' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                <Heart size={24} className="text-pink-400" />
                Calculadora de Emociones <span className="text-sm bg-pink-400 px-2 py-1 rounded-full">{userDetails.emotion_logs?.length || 0}</span>
              </h3>
              
              {userDetails.emotion_logs && userDetails.emotion_logs.length > 0 ? (
                <div>
                  {/* Group logs by date */}
                  {(() => {
                    const logsByDate: Record<string, any[]> = {};
                    
                    userDetails.emotion_logs.forEach(log => {
                      const date = new Date(log.felt_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      });
                      
                      if (!logsByDate[date]) {
                        logsByDate[date] = [];
                      }
                      
                      logsByDate[date].push(log);
                    });
                    
                    // Sort dates in descending order
                    const sortedDates = Object.keys(logsByDate).sort((a, b) => {
                      return new Date(b).getTime() - new Date(a).getTime();
                    });
                    
                    return (
                      <div>
                        {sortedDates.map(date => (
                          <div key={date} className="mb-8">
                            <h4 className="text-lg font-bold text-white mb-4 bg-pink-500 inline-block px-3 py-1 rounded-lg">
                              {date}
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {logsByDate[date].map(log => (
                                <div 
                                  key={log.id} 
                                  className="bg-pink-100 p-4 rounded-lg border-l-4 border-pink-500"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="text-3xl">
                                      {log.emotion_name === 'Alegría' ? '😊' :
                                       log.emotion_name === 'Tristeza' ? '😢' :
                                       log.emotion_name === 'Enojo' ? '😡' :
                                       log.emotion_name === 'Miedo' ? '😨' :
                                       log.emotion_name === 'Emoción' ? '🤩' :
                                       log.emotion_name === 'Calma' ? '😌' :
                                       log.emotion_name === 'Vergüenza' ? '😳' :
                                       log.emotion_name === 'Confusión' ? '😕' :
                                       log.emotion_name === 'Cariño' ? '🥰' :
                                       log.emotion_name === 'Desilusión' ? '😞' : '😐'}
                                    </div>
                                    <div>
                                      <div className="font-bold text-gray-800">{log.emotion_name}</div>
                                      <div className="text-xs text-gray-600">
                                        {new Date(log.felt_at).toLocaleTimeString('es-ES', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })} • 
                                        {log.intensity ? ` Intensidad: ${log.intensity}` : ''}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {log.notes && (
                                    <div className="mt-3 bg-white p-3 rounded-lg">
                                      <div className="text-sm text-gray-600 mb-1">Notas:</div>
                                      <p className="text-gray-800">{log.notes}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-6 text-white text-opacity-70 bg-black bg-opacity-20 rounded-lg">
                  <Heart size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-xl" style={{ fontFamily: 'Comic Neue' }}>No hay registros de "Calculadora de Emociones"</p>
                </div>
              )}
            </div>
          )}
          
          {/* Communication Sessions */}
          {activeTab === 'communication' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                <MessageCircle size={24} className="text-green-400" />
                La Comunicación
              </h3>
              
              {userDetails.communication_sessions && userDetails.communication_sessions.length > 0 ? (
                <div className="space-y-6">
                  {userDetails.communication_sessions.map(session => (
                    <div 
                      key={session.id} 
                      className="bg-green-100 p-6 rounded-lg border-l-4 border-green-500"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">Mensajes:</div>
                          <div className="font-bold text-green-700">
                            {session.messages?.length || 0} mensajes
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Estado:</div>
                          <div className="font-bold text-green-700">
                            {session.completed_at ? 'Completada' : 'En progreso'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Fecha:</div>
                          <div className="font-bold text-green-700">
                            {new Date(session.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      {session.ai_evaluation && (
                        <div className="mt-4 bg-white p-4 rounded-lg">
                          <div className="text-sm text-gray-600 mb-2">Evaluación de IA:</div>
                          <p className="text-gray-800">{session.ai_evaluation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white text-opacity-70">
                  <MessageCircle size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-xl" style={{ fontFamily: 'Comic Neue' }}>No hay sesiones de La Comunicación</p>
                </div>
              )}
            </div>
          )}
          
          {/* Semáforo de Límites */}
          {activeTab === 'semaforo_limites' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                <Shield size={24} className="text-red-400" />
                Semáforo de los Límites
              </h3>
              
              {userDetails.semaforo_limites_sessions && userDetails.semaforo_limites_sessions.length > 0 ? (
                <div className="space-y-6">
                  {userDetails.semaforo_limites_sessions.map((session: any, sessionIndex: number) => (
                    <div key={session.id} className="mb-6">
                      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-bold text-gray-800">Sesión #{sessionIndex + 1}</h4>
                          <div className="flex items-center gap-2">
                            {session.completed_at ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle size={16} />
                                <span className="text-sm font-medium">Completada</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-yellow-600">
                                <Clock size={16} />
                                <span className="text-sm font-medium">En progreso</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-3">
                          Situaciones completadas: {session.completed_situations}/{session.total_situations}
                        </div>
                        
                        {/* Progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                          <div 
                            className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${(session.completed_situations / session.total_situations) * 100}%` }}
                          />
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {new Date(session.created_at).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      {/* Detailed Responses */}
                      {session.responses && session.responses.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Shield size={18} />
                            Respuestas Detalladas por Situación
                          </h5>
                          
                          {/* Summary by color */}
                          <div className="grid grid-cols-3 gap-3 mb-6">
                            {(() => {
                              const colorCounts = {
                                rojo: session.responses.filter((r: any) => r.user_choice === 'rojo').length,
                                amarillo: session.responses.filter((r: any) => r.user_choice === 'amarillo').length,
                                verde: session.responses.filter((r: any) => r.user_choice === 'verde').length
                              }
                              const total = session.responses.length
                              
                              return (
                                <>
                                  <div className="bg-red-100 rounded-lg p-3 text-center border-2 border-red-300">
                                    <div className="text-2xl font-bold text-red-700 mb-1">{colorCounts.rojo}</div>
                                    <div className="text-xs text-red-600 font-medium">🔴 No lo Permito</div>
                                    <div className="text-xs text-red-500 mt-1">
                                      {total > 0 ? Math.round((colorCounts.rojo / total) * 100) : 0}%
                                    </div>
                                  </div>
                                  <div className="bg-yellow-100 rounded-lg p-3 text-center border-2 border-yellow-300">
                                    <div className="text-2xl font-bold text-yellow-700 mb-1">{colorCounts.amarillo}</div>
                                    <div className="text-xs text-yellow-600 font-medium">🟡 Más o Menos</div>
                                    <div className="text-xs text-yellow-500 mt-1">
                                      {total > 0 ? Math.round((colorCounts.amarillo / total) * 100) : 0}%
                                    </div>
                                  </div>
                                  <div className="bg-green-100 rounded-lg p-3 text-center border-2 border-green-300">
                                    <div className="text-2xl font-bold text-green-700 mb-1">{colorCounts.verde}</div>
                                    <div className="text-xs text-green-600 font-medium">🟢 Permitido</div>
                                    <div className="text-xs text-green-500 mt-1">
                                      {total > 0 ? Math.round((colorCounts.verde / total) * 100) : 0}%
                                    </div>
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                          
                          {/* Individual responses */}
                          <div className="space-y-3">
                            {session.responses.map((response: any, responseIndex: number) => {
                              const getChoiceColor = (choice: string) => {
                                switch (choice) {
                                  case 'rojo': return 'bg-red-100 border-red-300 text-red-800'
                                  case 'amarillo': return 'bg-yellow-100 border-yellow-300 text-yellow-800'
                                  case 'verde': return 'bg-green-100 border-green-300 text-green-800'
                                  default: return 'bg-gray-100 border-gray-300 text-gray-800'
                                }
                              }
                              
                              const getChoiceEmoji = (choice: string) => {
                                switch (choice) {
                                  case 'rojo': return '🔴'
                                  case 'amarillo': return '🟡'
                                  case 'verde': return '🟢'
                                  default: return '⚪'
                                }
                              }
                              
                              const getChoiceText = (choice: string) => {
                                switch (choice) {
                                  case 'rojo': return 'No lo Permito'
                                  case 'amarillo': return 'Más o Menos'
                                  case 'verde': return 'Permitido'
                                  default: return 'Sin respuesta'
                                }
                              }
                              
                              return (
                                <div key={response.id} className={`rounded-lg p-4 border-2 ${getChoiceColor(response.user_choice)}`}>
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <h6 className="font-bold text-sm mb-1">
                                        Situación #{responseIndex + 1}: {response.situation_title}
                                      </h6>
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                      <span className="text-lg">{getChoiceEmoji(response.user_choice)}</span>
                                      <span className="font-bold text-sm">
                                        {getChoiceText(response.user_choice)}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="text-xs text-gray-600">
                                    Respondido el {new Date(response.created_at).toLocaleDateString('es-ES', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          
                          {/* Analysis */}
                          <div className="mt-6 bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                            <h6 className="font-bold text-blue-800 mb-2">📊 Análisis de Límites</h6>
                            <div className="text-sm text-blue-700">
                              {(() => {
                                const colorCounts = {
                                  rojo: session.responses.filter((r: any) => r.user_choice === 'rojo').length,
                                  amarillo: session.responses.filter((r: any) => r.user_choice === 'amarillo').length,
                                  verde: session.responses.filter((r: any) => r.user_choice === 'verde').length
                                }
                                const total = session.responses.length
                                
                                if (colorCounts.rojo > colorCounts.verde && colorCounts.rojo > colorCounts.amarillo) {
                                  return `Tiende a establecer límites firmes (${Math.round((colorCounts.rojo / total) * 100)}% de respuestas "No lo Permito"). Muestra una personalidad que valora el respeto y las reglas claras.`
                                } else if (colorCounts.verde > colorCounts.rojo && colorCounts.verde > colorCounts.amarillo) {
                                  return `Tiende a ser permisivo con las situaciones (${Math.round((colorCounts.verde / total) * 100)}% de respuestas "Permitido"). Muestra una personalidad flexible y tolerante.`
                                } else if (colorCounts.amarillo > colorCounts.rojo && colorCounts.amarillo > colorCounts.verde) {
                                  return `Tiende a evaluar cada situación individualmente (${Math.round((colorCounts.amarillo / total) * 100)}% de respuestas "Más o Menos"). Muestra una personalidad reflexiva y contextual.`
                                } else {
                                  return `Muestra un equilibrio en el establecimiento de límites, adaptándose según la situación. Esto indica flexibilidad emocional y capacidad de análisis.`
                                }
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white text-opacity-70">
                  <Shield size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-xl" style={{ fontFamily: 'Comic Neue' }}>No hay sesiones de Semáforo de Límites</p>
                </div>
              )}
            </div>
          )}
          
          {/* Problema Resuelto */}
          {activeTab === 'problema_resuelto' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                <Brain size={24} className="text-blue-400" />
                Problema Resuelto
              </h3>
              
              {userDetails.problema_resuelto_sessions && userDetails.problema_resuelto_sessions.length > 0 ? (
                <div className="space-y-6">
                  {userDetails.problema_resuelto_sessions.map(session => (
                    <div 
                      key={session.id} 
                      className="bg-blue-100 p-6 rounded-lg border-l-4 border-blue-500"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">Problemas:</div>
                          <div className="font-bold text-blue-700">
                            {session.completed_problems}/{session.total_problems}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Resiliencia:</div>
                          <div className="font-bold text-blue-700">
                            {Math.round(session.resilience_score)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Estado:</div>
                          <div className="font-bold text-blue-700">
                            {session.completed_at ? 'Completada' : 'En progreso'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Fecha:</div>
                          <div className="font-bold text-blue-700">
                            {new Date(session.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-green-200 text-green-800 px-3 py-2 rounded text-center">
                          <div className="font-bold">{session.resilient_responses}</div>
                          <div className="text-sm">Respuestas Resilientes</div>
                        </div>
                        <div className="bg-red-200 text-red-800 px-3 py-2 rounded text-center">
                          <div className="font-bold">{session.impulsive_responses}</div>
                          <div className="text-sm">Respuestas Impulsivas</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white text-opacity-70">
                  <Brain size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-xl" style={{ fontFamily: 'Comic Neue' }}>No hay sesiones de Problema Resuelto</p>
                </div>
              )}
            </div>
          )}
          
          {/* Dulces Mágicos */}
          {activeTab === 'dulces_magicos' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                <Candy size={24} className="text-pink-400" />
                Dulces Mágicos
              </h3>
              
              {userDetails.dulces_magicos_sessions && userDetails.dulces_magicos_sessions.length > 0 ? (
                <div className="space-y-6">
                  {userDetails.dulces_magicos_sessions.map(session => (
                    <div 
                      key={session.id} 
                      className="bg-pink-100 p-6 rounded-lg border-l-4 border-pink-500"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">Final Alcanzado:</div>
                          <div className="font-bold text-pink-700">
                            {session.ending_reached === 'ending_sad' ? '😢 Final Triste' :
                             session.ending_reached === 'ending_resilient' ? '💪 Final Resiliente' :
                             session.ending_reached === 'ending_sharing' ? '🤝 Final Compartir' :
                             session.ending_reached === 'ending_control' ? '🤔 Final Control' : 
                             session.ending_reached}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Nivel de Resiliencia:</div>
                          <div className="font-bold text-pink-700">
                            {session.resilience_level}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Fecha:</div>
                          <div className="font-bold text-pink-700">
                            {new Date(session.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 bg-white p-4 rounded-lg">
                        <div className="text-sm text-gray-600 mb-2">Camino de Decisiones:</div>
                        <div className="flex flex-wrap gap-2">
                          {session.decision_path.map((decision, index) => (
                            <span 
                              key={index}
                              className="bg-pink-200 text-pink-800 px-3 py-1 rounded-full text-sm font-bold"
                            >
                              {decision}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white text-opacity-70">
                  <Candy size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-xl" style={{ fontFamily: 'Comic Neue' }}>No hay sesiones de Dulces Mágicos</p>
                </div>
              )}
            </div>
          )}
          
          {/* Anger Management */}
          {activeTab === 'anger' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                <Flame size={24} className="text-red-400" />
                Menú de la Ira
              </h3>
              
              {userDetails.anger_management_sessions && userDetails.anger_management_sessions.length > 0 ? (
                <div className="space-y-6">
                  {userDetails.anger_management_sessions.map(session => (
                    <div 
                      key={session.id} 
                      className="bg-red-100 p-6 rounded-lg border-l-4 border-red-500"
                    >
                      <h4 className="text-xl font-bold text-red-800 mb-4">{session.video_title}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">Duración vista:</div>
                          <div className="font-bold text-red-700">
                            {Math.floor(session.watch_duration / 60)}:{(session.watch_duration % 60).toString().padStart(2, '0')} minutos
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Completado:</div>
                          <div className="font-bold text-red-700">
                            {session.completion_percentage}% {session.completed_at ? '(Finalizado)' : '(En progreso)'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Fecha:</div>
                          <div className="font-bold text-red-700">
                            {new Date(session.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      {session.reflection_text && (
                        <div className="mt-4 bg-white p-4 rounded-lg">
                          <div className="text-sm text-gray-600 mb-2">Reflexión:</div>
                          <p className="text-gray-800">{session.reflection_text}</p>
                        </div>
                      )}
                      
                      {session.techniques_applied && session.techniques_applied.length > 0 && (
                        <div className="mt-4">
                          <div className="text-sm text-gray-600 mb-2">Técnicas seleccionadas:</div>
                          <div className="flex flex-wrap gap-2">
                            {session.techniques_applied.map((technique, index) => (
                              <span 
                                key={index}
                                className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm font-bold"
                              >
                                {technique}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white text-opacity-70">
                  <Flame size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-xl" style={{ fontFamily: 'Comic Neue' }}>No hay sesiones de Menú de la Ira</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat de Análisis IA */}
      <UserAnalysisChat
        userData={userDetails}
        isOpen={showAnalysisChat}
        onClose={() => setShowAnalysisChat(false)}
      />
    </div>
  )
}

export default UserDetailPage