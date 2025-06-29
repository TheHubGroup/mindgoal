import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import { dashboardService, DashboardData, UserActivityDetails } from '../lib/dashboardService'
import { 
  ArrowLeft, 
  BarChart3, 
  Users,
  Clock,
  RefreshCw,
  FileText,
  Brain,
  Heart,
  Flame,
  Award,
  ChevronDown,
  ChevronUp,
  Info,
  X,
  Sparkles,
  TrendingUp,
  Mail,
  MessageSquare,
  Calendar
} from 'lucide-react'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([])
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    totalTimelines: 0,
    totalLetters: 0,
    totalMeditations: 0,
    totalEmotionMatches: 0,
    totalEmotionLogs: 0,
    totalAngerSessions: 0,
    averageScore: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [userDetails, setUserDetails] = useState<UserActivityDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('timeline') 
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null)
  const [showActivityModal, setShowActivityModal] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Load all dashboard data
      const data = await dashboardService.getAllDashboardData()
      setDashboardData(data)
      
      // Load statistics
      const stats = await dashboardService.getActivityStatistics()
      setStatistics(stats)
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshDashboard = async () => {
    setIsRefreshing(true)
    try {
      if (user) {
        // Force update for current user
        await dashboardService.forceUpdateDashboard(user.id)
      }
      
      // Reload all data
      await loadDashboardData()
    } catch (error) {
      console.error('Error refreshing dashboard:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleUserClick = async (userId: string) => {
    if (selectedUser === userId) {
      // If clicking the same user, close the details
      setSelectedUser(null)
      setUserDetails(null)
      return
    }
    
    setSelectedUser(userId)
    setIsLoadingDetails(true)
    
    try {
      const details = await dashboardService.getUserActivityDetails(userId)
      setUserDetails(details)
    } catch (error) {
      console.error('Error loading user details:', error)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleActivityClick = (activity: any) => {
    setSelectedActivity(activity)
    setShowActivityModal(true)
  }

  const closeActivityModal = () => {
    setSelectedActivity(null)
    setShowActivityModal(false)
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
            Cargando datos del dashboard...
          </p>
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
              onClick={() => navigate('/')}
              className="text-white hover:text-gray-300 transition-colors bg-white bg-opacity-10 rounded-full p-3 hover:bg-opacity-20 backdrop-blur-sm"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <BarChart3 size={40} className="text-blue-400" />
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                  <Sparkles size={12} className="text-blue-900" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: 'Fredoka' }}>
                  DASHBOARD
                </h1>
                <p className="text-white text-opacity-80" style={{ fontFamily: 'Comic Neue' }}>
                  Estadísticas de actividad de todos los usuarios
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={refreshDashboard}
              disabled={isRefreshing}
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Last Updated Info */}
        <div className="text-white text-opacity-70 text-sm mb-6 flex items-center gap-2">
          <Clock size={16} />
          <span>Última actualización: {lastUpdated ? lastUpdated.toLocaleString() : 'Nunca'}</span>
        </div>

        {/* Global Statistics */}
        <div className="bg-black bg-opacity-20 backdrop-blur-lg rounded-3xl p-6 mb-8 border border-white border-opacity-10">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'Fredoka' }}>
            <TrendingUp size={24} className="text-blue-400" />
            ESTADÍSTICAS GLOBALES
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-center border-2 border-white border-opacity-20 shadow-xl">
              <div className="text-4xl font-black text-white mb-2">{statistics.totalUsers}</div>
              <div className="text-white text-opacity-90 font-bold">USUARIOS</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-center border-2 border-white border-opacity-20 shadow-xl">
              <div className="text-4xl font-black text-white mb-2">{statistics.totalTimelines + statistics.totalLetters}</div>
              <div className="text-white text-opacity-90 font-bold">ACTIVIDADES ESCRITAS</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl p-6 text-center border-2 border-white border-opacity-20 shadow-xl">
              <div className="text-4xl font-black text-white mb-2">{statistics.totalEmotionMatches + statistics.totalEmotionLogs}</div>
              <div className="text-white text-opacity-90 font-bold">ACTIVIDADES EMOCIONALES</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-center border-2 border-white border-opacity-20 shadow-xl">
              <div className="text-4xl font-black text-white mb-2">{statistics.averageScore.toLocaleString()}</div>
              <div className="text-white text-opacity-90 font-bold">SCORE PROMEDIO</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
            <div className="bg-white bg-opacity-10 rounded-2xl p-4 text-center border border-white border-opacity-20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FileText size={20} className="text-blue-300" />
                <div className="text-white font-bold">Líneas de Tiempo</div>
              </div>
              <div className="text-2xl font-bold text-blue-300">{statistics.totalTimelines}</div>
            </div>
            
            <div className="bg-white bg-opacity-10 rounded-2xl p-4 text-center border border-white border-opacity-20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FileText size={20} className="text-green-300" />
                <div className="text-white font-bold">Cartas</div>
              </div>
              <div className="text-2xl font-bold text-green-300">{statistics.totalLetters}</div>
            </div>
            
            <div className="bg-white bg-opacity-10 rounded-2xl p-4 text-center border border-white border-opacity-20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Brain size={20} className="text-purple-300" />
                <div className="text-white font-bold">Meditaciones</div>
              </div>
              <div className="text-2xl font-bold text-purple-300">{statistics.totalMeditations}</div>
            </div>
            
            <div className="bg-white bg-opacity-10 rounded-2xl p-4 text-center border border-white border-opacity-20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame size={20} className="text-red-300" />
                <div className="text-white font-bold">Menú de la Ira</div>
              </div>
              <div className="text-2xl font-bold text-red-300">{statistics.totalAngerSessions}</div>
            </div>
          </div>
        </div>

        {/* User Dashboard Table */}
        <div className="bg-black bg-opacity-20 backdrop-blur-lg rounded-3xl p-6 border border-white border-opacity-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3" style={{ fontFamily: 'Fredoka' }}>
              <Users size={24} className="text-blue-400" />
              DATOS DE USUARIOS
            </h2>
            <div className="text-white text-opacity-70 text-sm">
              {dashboardData.length} usuarios en total
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-white text-opacity-90">
              <thead>
                <tr className="border-b border-white border-opacity-20">
                  <th className="py-3 px-4 text-left">Nombre</th>
                  <th className="py-3 px-4 text-center">Línea Tiempo</th>
                  <th className="py-3 px-4 text-center">Cartas</th>
                  <th className="py-3 px-4 text-center">Meditación</th>
                  <th className="py-3 px-4 text-center">Emociones</th>
                  <th className="py-3 px-4 text-center">Menú Ira</th>
                  <th className="py-3 px-4 text-right">Score Total</th>
                  <th className="py-3 px-4 text-center">Nivel</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.map((user) => (
                  <tr 
                    key={user.id} 
                    className={`border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5 cursor-pointer ${
                      selectedUser === user.user_id ? 'bg-white bg-opacity-10' : ''
                    }`}
                    onClick={() => handleUserClick(user.user_id)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0">
                          {user.profile_info?.avatar_url ? (
                            <img
                              src={user.profile_info.avatar_url}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Users size={16} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold">
                            {user.profile_info?.nombre || ''} {user.profile_info?.apellido || ''}
                          </div>
                          <div className="text-xs text-white text-opacity-70">
                            {user.profile_info?.email || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-bold">{user.timeline_stats?.count || 0}</div>
                      <div className="text-xs text-white text-opacity-70">
                        {user.timeline_stats?.score?.toLocaleString() || 0} pts
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-bold">{user.letters_stats?.count || 0}</div>
                      <div className="text-xs text-white text-opacity-70">
                        {user.letters_stats?.score?.toLocaleString() || 0} pts
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-bold">{user.meditation_stats?.count || 0}</div>
                      <div className="text-xs text-white text-opacity-70">
                        {user.meditation_stats?.completed || 0} completadas
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-bold">{user.emotion_matches_stats?.attempts || 0}</div>
                      <div className="text-xs text-white text-opacity-70">
                        {user.emotion_matches_stats?.correct || 0} correctas
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-bold">{user.anger_stats?.count || 0}</div>
                      <div className="text-xs text-white text-opacity-70">
                        {user.anger_stats?.completed || 0} completadas
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-lg">{user.total_score?.toLocaleString() || 0}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className={`
                        inline-block px-3 py-1 rounded-full font-bold text-xs
                        ${user.level === 'Maestro' ? 'bg-purple-500 text-white' : 
                          user.level === 'Experto' ? 'bg-blue-500 text-white' : 
                          user.level === 'Avanzado' ? 'bg-green-500 text-white' : 
                          user.level === 'Intermedio' ? 'bg-yellow-500 text-black' : 
                          'bg-gray-500 text-white'}
                      `}>
                        {user.level}
                      </div>
                      <div className="mt-1">
                        {selectedUser === user.user_id ? (
                          <ChevronUp size={14} className="mx-auto text-white" />
                        ) : (
                          <ChevronDown size={14} className="mx-auto text-white text-opacity-50" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                
                {dashboardData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-white text-opacity-70">
                      <Award size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No hay datos de usuarios disponibles</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* User Details Section */}
          {selectedUser && (
            <div className="mt-8 bg-white bg-opacity-5 rounded-2xl p-6 border border-white border-opacity-20">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Fredoka' }}>
                  <Info size={20} className="text-blue-400" />
                  DETALLES DEL USUARIO
                </h3>
                <button
                  onClick={() => {
                    setSelectedUser(null)
                    setUserDetails(null)
                  }}
                  className="text-white text-opacity-70 hover:text-opacity-100 p-2"
                >
                  <X size={20} />
                </button>
              </div>
              
              {isLoadingDetails ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              ) : userDetails ? (
                <div>
                  {/* User Profile Summary */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-white bg-opacity-20 flex-shrink-0 border-2 border-white">
                        {userDetails.avatar_url ? (
                          <img
                            src={userDetails.avatar_url}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Users size={24} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-white">
                          {userDetails.nombre} {userDetails.apellido}
                        </h4>
                        <div className="flex items-center gap-4 text-white text-opacity-90 text-sm">
                          <div className="flex items-center gap-1">
                            <Mail size={14} />
                            <span>{userDetails.email}</span>
                          </div>
                          {userDetails.grado && (
                            <div className="flex items-center gap-1">
                              <FileText size={14} />
                              <span>{userDetails.grado}</span>
                            </div>
                          )}
                          {userDetails.edad && (
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{userDetails.edad} años</span>
                            </div>
                          )}
                        </div>
                        {userDetails.nombre_colegio && (
                          <div className="text-white text-opacity-80 text-sm mt-1">
                            {userDetails.nombre_colegio}, {userDetails.ciudad}, {userDetails.pais}
                          </div>
                        )}
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
                        onClick={() => setActiveTab('emotions')}
                        className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                          activeTab === 'emotions' 
                            ? 'bg-pink-500 text-white' 
                            : 'bg-white bg-opacity-10 text-white text-opacity-70 hover:bg-opacity-20'
                        }`}
                      >
                        Emociones ({(userDetails.emotion_matches?.length || 0) + (userDetails.emotion_logs?.length || 0)})
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
                  <div className="bg-black bg-opacity-30 rounded-xl p-4">
                    {/* Timeline Notes */}
                    {activeTab === 'timeline' && (
                      <div>
                        <h4 className="text-lg font-bold text-white mb-4">Notas de Línea del Tiempo</h4>
                        {userDetails.timeline_notes && userDetails.timeline_notes.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {userDetails.timeline_notes.map(note => (
                              <div
                                key={note.id}
                                onClick={() => handleActivityClick(note)}
                                className="p-4 rounded-lg"
                                style={{ backgroundColor: note.color, cursor: 'pointer' }}
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
                            <FileText size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No hay notas de línea del tiempo</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* User Responses */}
                    {activeTab === 'responses' && (
                      <div>
                        <h4 className="text-lg font-bold text-white mb-4">Cuéntame Quién Eres</h4>
                        {userDetails.user_responses && userDetails.user_responses.filter(r => r.activity_type === 'cuentame_quien_eres').length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {userDetails.user_responses
                              .filter(r => r.activity_type === 'cuentame_quien_eres')
                              .map(response => (
                                <div
                                  key={response.id}
                                  onClick={() => handleActivityClick(response)}
                                  className={`p-4 rounded-lg ${
                                    response.question === 'me_gusta' 
                                      ? 'bg-green-100 border-l-4 border-green-500' 
                                      : 'bg-red-100 border-l-4 border-red-500'
                                  } cursor-pointer`}
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
                            <Heart size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No hay respuestas de "Cuéntame Quién Eres"</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Letters */}
                    {activeTab === 'letters' && (
                      <div>
                        <h4 className="text-lg font-bold text-white mb-4">Cartas a Mí Mismo</h4>
                        {userDetails.letters && userDetails.letters.length > 0 ? (
                          <div className="space-y-4">
                            {userDetails.letters.map(letter => (
                              <div
                                key={letter.id}
                                onClick={() => handleActivityClick(letter)}
                                className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500 cursor-pointer"
                              >
                                <h5 className="text-lg font-bold text-amber-800 mb-2">{letter.title}</h5>
                                <p className="text-gray-800 whitespace-pre-line" style={{ fontFamily: 'Kalam, cursive' }}>
                                  {letter.content}
                                </p>
                                <div className="text-xs text-gray-600 mt-2 text-right">
                                  {new Date(letter.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-white text-opacity-70">
                            <Mail size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No hay cartas</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Meditation Sessions */}
                    {activeTab === 'meditation' && (
                      <div>
                        <h4 className="text-lg font-bold text-white mb-4">Sesiones de Meditación</h4>
                        {userDetails.meditation_sessions && userDetails.meditation_sessions.length > 0 ? (
                          <div className="space-y-4">
                            {userDetails.meditation_sessions.map(session => (
                              <div
                                key={session.id}
                                onClick={() => handleActivityClick(session)}
                                className="bg-purple-100 p-4 rounded-lg border-l-4 border-purple-500 cursor-pointer"
                              >
                                <h5 className="text-lg font-bold text-purple-800 mb-2">{session.video_title}</h5>
                                <div className="grid grid-cols-2 gap-4 mb-3">
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
                                </div>
                                
                                {session.reflection_text && (
                                  <div className="mt-3 bg-white bg-opacity-50 p-3 rounded-lg">
                                    <div className="text-sm text-gray-600 mb-1">Reflexión:</div>
                                    <p className="text-gray-800">{session.reflection_text}</p>
                                  </div>
                                )}
                                
                                <div className="text-xs text-gray-600 mt-2 text-right">
                                  {new Date(session.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-white text-opacity-70">
                            <Brain size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No hay sesiones de meditación</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Emotions */}
                    {activeTab === 'emotions' && (
                      <div>
                        <h4 className="text-lg font-bold text-white mb-4">Actividades de Emociones</h4>
                        
                        {/* Emotion Matches */}
                        <div className="mb-6">
                          <h5 className="text-md font-bold text-white mb-3 bg-pink-500 inline-block px-3 py-1 rounded-lg">
                            Nombra tus Emociones
                          </h5>
                          
                          {userDetails.emotion_matches && userDetails.emotion_matches.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {userDetails.emotion_matches.map(match => (
                                <div
                                  key={match.id}
                                  onClick={() => handleActivityClick(match)}
                                  className={`p-3 rounded-lg ${
                                    match.is_correct 
                                      ? 'bg-green-100 border-l-4 border-green-500' 
                                      : 'bg-red-100 border-l-4 border-red-500'
                                  } cursor-pointer`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="text-2xl">
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
                                        {match.explanation_shown ? ' Vio explicación' : ' Sin explicación'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-white text-opacity-70 bg-black bg-opacity-20 rounded-lg">
                              <p>No hay registros de "Nombra tus Emociones"</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Emotion Logs */}
                        <div>
                          <h5 className="text-md font-bold text-white mb-3 bg-pink-500 inline-block px-3 py-1 rounded-lg">
                            Calculadora de Emociones
                          </h5>
                          
                          {userDetails.emotion_logs && userDetails.emotion_logs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {userDetails.emotion_logs.map(log => (
                                <div
                                  key={log.id}
                                  onClick={() => handleActivityClick(log)}
                                  className="bg-pink-100 p-3 rounded-lg border-l-4 border-pink-500 cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="text-2xl">
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
                                        {new Date(log.felt_at).toLocaleDateString()} • 
                                        {log.intensity ? ` Intensidad: ${log.intensity}` : ''}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {log.notes && (
                                    <div className="mt-2 bg-white bg-opacity-50 p-2 rounded text-sm text-gray-700">
                                      {log.notes}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-4 text-white text-opacity-70 bg-black bg-opacity-20 rounded-lg">
                              <p>No hay registros de "Calculadora de Emociones"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Anger Management */}
                    {activeTab === 'anger' && (
                      <div>
                        <h4 className="text-lg font-bold text-white mb-4">Menú de la Ira</h4>
                        {userDetails.anger_management_sessions && userDetails.anger_management_sessions.length > 0 ? (
                          <div className="space-y-4">
                            {userDetails.anger_management_sessions.map(session => (
                              <div
                                key={session.id}
                                onClick={() => handleActivityClick(session)}
                                className="bg-red-100 p-4 rounded-lg border-l-4 border-red-500 cursor-pointer"
                              >
                                <h5 className="text-lg font-bold text-red-800 mb-2">{session.video_title}</h5>
                                <div className="grid grid-cols-2 gap-4 mb-3">
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
                                </div>
                                
                                {session.reflection_text && (
                                  <div className="mt-3 bg-white bg-opacity-50 p-3 rounded-lg">
                                    <div className="text-sm text-gray-600 mb-1">Reflexión:</div>
                                    <p className="text-gray-800">{session.reflection_text}</p>
                                  </div>
                                )}
                                
                                {session.techniques_applied && session.techniques_applied.length > 0 && (
                                  <div className="mt-3">
                                    <div className="text-sm text-gray-600 mb-1">Técnicas seleccionadas:</div>
                                    <div className="flex flex-wrap gap-2">
                                      {session.techniques_applied.map((technique, index) => (
                                        <span 
                                          key={index}
                                          className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-xs font-bold"
                                        >
                                          {technique}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="text-xs text-gray-600 mt-2 text-right">
                                  {new Date(session.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-white text-opacity-70">
                            <Flame size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No hay sesiones de Menú de la Ira</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-white text-opacity-70">
                  <Info size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No se pudieron cargar los detalles del usuario</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal para ver detalles de actividad */}
      {showActivityModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Fredoka' }}>
                  Detalles de la Actividad
                </h3>
                <button
                  onClick={closeActivityModal}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Contenido según el tipo de actividad */}
                {selectedActivity.text && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-2">Nota de Línea del Tiempo</h4>
                    <div 
                      className={`p-4 rounded-lg ${selectedActivity.shape || 'rounded-lg'} mb-4`}
                      style={{ 
                        backgroundColor: selectedActivity.color || '#f0f0f0',
                        fontFamily: selectedActivity.font || 'inherit'
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-2xl">{selectedActivity.emoji}</span>
                        <p className="text-lg font-medium">{selectedActivity.text}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Sección:</span> {selectedActivity.section}
                      </div>
                      <div>
                        <span className="font-medium">Creada:</span> {formatDate(selectedActivity.created_at)}
                      </div>
                      <div>
                        <span className="font-medium">Posición X:</span> {selectedActivity.position_x}
                      </div>
                      <div>
                        <span className="font-medium">Posición Y:</span> {selectedActivity.position_y}
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedActivity.response && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-2">Respuesta de Usuario</h4>
                    <div className={`p-4 rounded-lg mb-4 ${
                      selectedActivity.question === 'me_gusta' 
                        ? 'bg-green-100 border-l-4 border-green-500' 
                        : 'bg-red-100 border-l-4 border-red-500'
                    }`}>
                      <div className="flex items-start gap-2">
                        <span className="text-2xl">
                          {selectedActivity.question === 'me_gusta' ? '❤️' : '👎'}
                        </span>
                        <p className="text-lg font-medium text-gray-800">{selectedActivity.response}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Tipo:</span> {selectedActivity.question === 'me_gusta' ? 'Me gusta' : 'No me gusta'}
                      </div>
                      <div>
                        <span className="font-medium">Actividad:</span> {selectedActivity.activity_type}
                      </div>
                      <div>
                        <span className="font-medium">Creada:</span> {formatDate(selectedActivity.created_at)}
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedActivity.title && selectedActivity.content && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-2">Carta Personal</h4>
                    <div className="bg-amber-50 p-4 rounded-lg border-l-4 border-amber-500 mb-4">
                      <h5 className="text-xl font-bold text-amber-800 mb-3">{selectedActivity.title}</h5>
                      <p className="text-gray-800 whitespace-pre-line" style={{ fontFamily: 'Kalam, cursive' }}>
                        {selectedActivity.content}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Creada:</span> {formatDate(selectedActivity.created_at)}
                      </div>
                      <div>
                        <span className="font-medium">Actualizada:</span> {formatDate(selectedActivity.updated_at)}
                      </div>
                      <div>
                        <span className="font-medium">Longitud:</span> {selectedActivity.content.length} caracteres
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedActivity.video_title && selectedActivity.watch_duration !== undefined && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-2">
                      {selectedActivity.techniques_applied !== undefined ? 'Sesión de Menú de la Ira' : 'Sesión de Meditación'}
                    </h4>
                    <div className={`p-4 rounded-lg border-l-4 mb-4 ${
                      selectedActivity.techniques_applied !== undefined 
                        ? 'bg-red-50 border-red-500' 
                        : 'bg-purple-50 border-purple-500'
                    }`}>
                      <h5 className="text-xl font-bold mb-3" className={
                        selectedActivity.techniques_applied !== undefined 
                          ? 'text-red-800' 
                          : 'text-purple-800'
                      }>
                        {selectedActivity.video_title}
                      </h5>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-gray-600">Duración vista:</div>
                          <div className="font-bold" className={
                            selectedActivity.techniques_applied !== undefined 
                              ? 'text-red-700' 
                              : 'text-purple-700'
                          }>
                            {Math.floor(selectedActivity.watch_duration / 60)}:{(selectedActivity.watch_duration % 60).toString().padStart(2, '0')} minutos
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Completado:</div>
                          <div className="font-bold" className={
                            selectedActivity.techniques_applied !== undefined 
                              ? 'text-red-700' 
                              : 'text-purple-700'
                          }>
                            {selectedActivity.completion_percentage}% {selectedActivity.completed_at ? '(Finalizado)' : '(En progreso)'}
                          </div>
                        </div>
                      </div>
                      
                      {selectedActivity.reflection_text && (
                        <div className="mt-3 bg-white p-3 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Reflexión:</div>
                          <p className="text-gray-800">{selectedActivity.reflection_text}</p>
                        </div>
                      )}
                      
                      {selectedActivity.techniques_applied && selectedActivity.techniques_applied.length > 0 && (
                        <div className="mt-3">
                          <div className="text-sm text-gray-600 mb-1">Técnicas seleccionadas:</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedActivity.techniques_applied.map((technique: string, index: number) => (
                              <span 
                                key={index}
                                className="bg-red-200 text-red-800 px-2 py-1 rounded-full text-xs font-bold"
                              >
                                {technique}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Video ID:</span> {selectedActivity.video_id}
                      </div>
                      <div>
                        <span className="font-medium">Creada:</span> {formatDate(selectedActivity.created_at)}
                      </div>
                      <div>
                        <span className="font-medium">Veces visto:</span> {selectedActivity.view_count || 1}
                      </div>
                      <div>
                        <span className="font-medium">Skips:</span> {selectedActivity.skip_count || 0}
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedActivity.emotion_name && selectedActivity.is_correct !== undefined && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-2">Match de Emoción</h4>
                    <div className={`p-4 rounded-lg mb-4 ${
                      selectedActivity.is_correct 
                        ? 'bg-green-100 border-l-4 border-green-500' 
                        : 'bg-red-100 border-l-4 border-red-500'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">
                          {selectedActivity.emotion_name === 'Alegría' ? '😊' :
                           selectedActivity.emotion_name === 'Tristeza' ? '😢' :
                           selectedActivity.emotion_name === 'Enojo' ? '😡' :
                           selectedActivity.emotion_name === 'Miedo' ? '😨' :
                           selectedActivity.emotion_name === 'Emoción' ? '🤩' :
                           selectedActivity.emotion_name === 'Calma' ? '😌' :
                           selectedActivity.emotion_name === 'Vergüenza' ? '😳' :
                           selectedActivity.emotion_name === 'Confusión' ? '😕' :
                           selectedActivity.emotion_name === 'Cariño' ? '🥰' :
                           selectedActivity.emotion_name === 'Desilusión' ? '😞' : '😐'}
                        </div>
                        <div>
                          <h5 className="text-xl font-bold text-gray-800">{selectedActivity.emotion_name}</h5>
                          <div className="text-sm text-gray-600">
                            {selectedActivity.is_correct ? '✓ Respuesta correcta' : '✗ Respuesta incorrecta'}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Vio explicación:</span> {selectedActivity.explanation_shown ? 'Sí' : 'No'}
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span> {formatDate(selectedActivity.created_at)}
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedActivity.emotion_name && selectedActivity.felt_at && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-2">Registro de Emoción</h4>
                    <div className="bg-pink-100 p-4 rounded-lg border-l-4 border-pink-500 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">
                          {selectedActivity.emotion_name === 'Alegría' ? '😊' :
                           selectedActivity.emotion_name === 'Tristeza' ? '😢' :
                           selectedActivity.emotion_name === 'Enojo' ? '😡' :
                           selectedActivity.emotion_name === 'Miedo' ? '😨' :
                           selectedActivity.emotion_name === 'Emoción' ? '🤩' :
                           selectedActivity.emotion_name === 'Calma' ? '😌' :
                           selectedActivity.emotion_name === 'Vergüenza' ? '😳' :
                           selectedActivity.emotion_name === 'Confusión' ? '😕' :
                           selectedActivity.emotion_name === 'Cariño' ? '🥰' :
                           selectedActivity.emotion_name === 'Desilusión' ? '😞' : '😐'}
                        </div>
                        <div>
                          <h5 className="text-xl font-bold text-gray-800">{selectedActivity.emotion_name}</h5>
                          <div className="text-sm text-gray-600">
                            Sentida el {formatDate(selectedActivity.felt_at)}
                          </div>
                        </div>
                      </div>
                      
                      {selectedActivity.notes && (
                        <div className="mt-3 bg-white p-3 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Notas:</div>
                          <p className="text-gray-800">{selectedActivity.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Intensidad:</span> {selectedActivity.intensity || 'No especificada'}
                      </div>
                      <div>
                        <span className="font-medium">Registrada:</span> {formatDate(selectedActivity.created_at)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeActivityModal}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage