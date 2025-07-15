import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
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
  Smile
} from 'lucide-react'

const UserDetailPage = () => {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const { user } = useAuth()
  const [userDetails, setUserDetails] = useState<UserActivityDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('timeline')
  const [isRefreshing, setIsRefreshing] = useState(false)

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
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all"
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
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-white hover:text-gray-300 transition-colors bg-white bg-opacity-10 rounded-full p-3 hover:bg-opacity-20 backdrop-blur-sm"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0 border-2 border-white">
                {userDetails.avatar_url ? (
                  <img
                    src={userDetails.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={24} className="text-white" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                  {userDetails.nombre} {userDetails.apellido}
                </h1>
                <p className="text-white text-opacity-80" style={{ fontFamily: 'Comic Neue' }}>
                  {userDetails.email}
                </p>
              </div>
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
            <UserMenu />
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
              onClick={() => setActiveTab('emotion_matches')}
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
                <>
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
                  
                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-white bg-opacity-20 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${userDetails.emotion_matches.length > 0 ? (userDetails.emotion_matches.filter(m => m.is_correct).length / userDetails.emotion_matches.length) * 100 : 0}%` }}
                      />
              {userDetails.emotion_matches && userDetails.emotion_matches.length > 0 ? (
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
                            {match.is_correct ? '✓ Correcto' : '✗ Incorrecto'} • 
                            {match.explanation_shown ? ' Vio explicación' : ' Sin explicación'} •
                            {new Date(match.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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
                  {(() => {
                    // Group logs by date
                    const logsByDate: Record<string, typeof userDetails.emotion_logs> = {}
                    if (userDetails.emotion_logs) {
                      userDetails.emotion_logs.forEach(log => {
                        const date = new Date(log.felt_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                        if (!logsByDate[date]) {
                          logsByDate[date] = []
                        }
                        logsByDate[date].push(log)
                      })
                      
                      // Sort dates in descending order
                      const sortedDates = Object.keys(logsByDate).sort((a, b) => {
                        return new Date(b).getTime() - new Date(a).getTime()
                      })
                      
                      return sortedDates.map(date => (
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
                    ))
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
    </div>
  )
}

export default UserDetailPage