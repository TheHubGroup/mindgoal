import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import { dashboardService, DashboardData } from '../lib/dashboardService'
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
  Sparkles,
  TrendingUp
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
                  <tr key={user.id} className="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-5">
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
                        ${user.level === 'Maestro' ? 'bg-purple-500' : 
                          user.level === 'Experto' ? 'bg-blue-500' : 
                          user.level === 'Avanzado' ? 'bg-green-500' : 
                          user.level === 'Intermedio' ? 'bg-yellow-500' : 
                          'bg-gray-500'}
                      `}>
                        {user.level}
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
        </div>
      </div>
    </div>
  )
}

export default DashboardPage