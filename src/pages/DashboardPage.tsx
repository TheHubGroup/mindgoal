import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import { dashboardService, DashboardData } from '../lib/dashboardService'
import { 
  ArrowLeft, 
  BarChart3, 
  Users,
  FileText,
  Mail,
  Brain,
  Heart,
  Flame,
  RefreshCw,
  Clock,
  Trophy,
  Search,
  User,
  Eye,
  Filter,
  X
} from 'lucide-react'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    grado: '',
    edad: { min: '', max: '' },
    sexo: '',
    colegio: '',
    ciudad: '',
    pais: '',
    tieneLineasTiempo: false,
    tieneCartas: false,
    tieneMeditacion: false,
    tieneNombraEmociones: false,
    tieneCalculadoraEmociones: false,
    tieneMenuIra: false
  })
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTimelines: 0,
    totalLetters: 0,
    totalMeditations: 0,
    totalEmotionMatches: 0,
    totalEmotionLogs: 0,
    totalAngerSessions: 0,
    averageScore: 0
  })

  useEffect(() => {
    loadDashboardData()
    loadActivityStatistics()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const data = await dashboardService.getAllDashboardData()
      setDashboardData(data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadActivityStatistics = async () => {
    try {
      const statistics = await dashboardService.getActivityStatistics()
      setStats(statistics)
    } catch (error) {
      console.error('Error loading activity statistics:', error)
    }
  }

  const refreshDashboard = async () => {
    setIsRefreshing(true)
    try {
      // Force update for current user
      if (user) {
        await dashboardService.forceUpdateDashboard(user.id)
      }
      
      // Reload all data
      await loadDashboardData()
      await loadActivityStatistics()
    } catch (error) {
      console.error('Error refreshing dashboard:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFilters(prev => ({ ...prev, [name]: checked }));
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  }
  
  const handleEdadChange = (type: 'min' | 'max', value: string) => {
    setFilters(prev => ({
      ...prev,
      edad: { ...prev.edad, [type]: value }
    }));
  }
  
  const resetFilters = () => {
    setFilters({
      grado: '',
      edad: { min: '', max: '' },
      sexo: '',
      colegio: '',
      ciudad: '',
      pais: '',
      tieneLineasTiempo: false,
      tieneCartas: false,
      tieneMeditacion: false,
      tieneNombraEmociones: false,
      tieneCalculadoraEmociones: false,
      tieneMenuIra: false
    });
  }

  const filteredUsers = dashboardData.filter(userData => {
    // Apply search filter
    const searchLower = searchTerm.toLowerCase()
    const fullName = `${userData.profile_info.nombre || ''} ${userData.profile_info.apellido || ''}`.toLowerCase()
    const email = (userData.profile_info.email || '').toLowerCase()
    const school = (userData.profile_info.nombre_colegio || '').toLowerCase()
    
    const matchesSearch = fullName.includes(searchLower) || 
                         email.includes(searchLower) || 
                         school.includes(searchLower)
    
    // Skip other filters if no search match
    if (!matchesSearch) return false;
    
    // Apply grade filter
    if (filters.grado && userData.profile_info.grado !== filters.grado) {
      return false;
    }
    
    // Apply gender filter
    if (filters.sexo && userData.profile_info.sexo !== filters.sexo) {
      return false;
    }
    
    // Apply school filter
    if (filters.colegio && !userData.profile_info.nombre_colegio?.toLowerCase().includes(filters.colegio.toLowerCase())) {
      return false;
    }
    
    // Apply city filter
    if (filters.ciudad && !userData.profile_info.ciudad?.toLowerCase().includes(filters.ciudad.toLowerCase())) {
      return false;
    }
    
    // Apply country filter
    if (filters.pais && !userData.profile_info.pais?.toLowerCase().includes(filters.pais.toLowerCase())) {
      return false;
    }
    
    // Apply age filter
    const age = userData.profile_info.edad;
    if (filters.edad.min && (!age || age < parseInt(filters.edad.min))) return false;
    if (filters.edad.max && (!age || age > parseInt(filters.edad.max))) return false;
    
    // Apply activity filters
    if (filters.tieneLineasTiempo && userData.timeline_stats.count <= 0) return false;
    if (filters.tieneCartas && userData.letters_stats.count <= 0) return false;
    if (filters.tieneMeditacion && userData.meditation_stats.count <= 0) return false;
    if (filters.tieneNombraEmociones && userData.emotion_matches_stats.attempts <= 0) return false;
    if (filters.tieneCalculadoraEmociones && userData.emotion_logs_stats.count <= 0) return false;
    if (filters.tieneMenuIra && userData.anger_stats.count <= 0) return false;
    
    return true;
  })

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
            Cargando dashboard...
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
                  <Users size={12} className="text-blue-900" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: 'Fredoka' }}>
                  DASHBOARD
                </h1>
                <p className="text-white text-opacity-80" style={{ fontFamily: 'Comic Neue' }}>
                  Estadísticas de usuarios y actividades
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
              Actualizar Dashboard
            </button>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl border-2 border-white border-opacity-20">
            <div className="flex items-center gap-3 mb-3">
              <Users size={24} className="text-white" />
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Fredoka' }}>Usuarios</h3>
            </div>
            <div className="text-4xl font-black mb-2">{stats.totalUsers}</div>
            <div className="text-sm text-white text-opacity-80">Usuarios registrados</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl border-2 border-white border-opacity-20">
            <div className="flex items-center gap-3 mb-3">
              <FileText size={24} className="text-white" />
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Fredoka' }}>Actividades</h3>
            </div>
            <div className="text-4xl font-black mb-2">
              {stats.totalTimelines + stats.totalLetters + stats.totalMeditations + 
               stats.totalEmotionMatches + stats.totalEmotionLogs + stats.totalAngerSessions}
            </div>
            <div className="text-sm text-white text-opacity-80">Total de actividades realizadas</div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl border-2 border-white border-opacity-20">
            <div className="flex items-center gap-3 mb-3">
              <Trophy size={24} className="text-white" />
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Fredoka' }}>Score Promedio</h3>
            </div>
            <div className="text-4xl font-black mb-2">{stats.averageScore}</div>
            <div className="text-sm text-white text-opacity-80">Puntos promedio por usuario</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl border-2 border-white border-opacity-20">
            <div className="flex items-center gap-3 mb-3">
              <Clock size={24} className="text-white" />
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Fredoka' }}>Actualización</h3>
            </div>
            <div className="text-xl font-bold mb-2">
              {new Date().toLocaleString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </div>
            <div className="text-sm text-white text-opacity-80">Última actualización</div>
          </div>
        </div>

        {/* Activity Breakdown */}
        <div className="bg-black bg-opacity-20 backdrop-blur-lg rounded-3xl p-6 mb-8 border border-white border-opacity-10">
          <h3 className="text-xl font-bold text-white mb-6" style={{ fontFamily: 'Fredoka' }}>
            Desglose de Actividades
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white bg-opacity-10 rounded-xl p-4 text-center">
              <FileText size={32} className="mx-auto mb-2 text-blue-400" />
              <div className="text-2xl font-bold text-white">{stats.totalTimelines}</div>
              <div className="text-sm text-white text-opacity-80">Líneas del Tiempo</div>
            </div>
            
            <div className="bg-white bg-opacity-10 rounded-xl p-4 text-center">
              <Heart size={32} className="mx-auto mb-2 text-green-400" />
              <div className="text-2xl font-bold text-white">{stats.totalEmotionLogs}</div>
              <div className="text-sm text-white text-opacity-80">Cuéntame Quién Eres</div>
            </div>
            
            <div className="bg-white bg-opacity-10 rounded-xl p-4 text-center">
              <Mail size={32} className="mx-auto mb-2 text-yellow-400" />
              <div className="text-2xl font-bold text-white">{stats.totalLetters}</div>
              <div className="text-sm text-white text-opacity-80">Cartas</div>
            </div>
            
            <div className="bg-white bg-opacity-10 rounded-xl p-4 text-center">
              <Brain size={32} className="mx-auto mb-2 text-purple-400" />
              <div className="text-2xl font-bold text-white">{stats.totalMeditations}</div>
              <div className="text-sm text-white text-opacity-80">Meditaciones</div>
            </div>
            
            <div className="bg-white bg-opacity-10 rounded-xl p-4 text-center">
              <Heart size={32} className="mx-auto mb-2 text-pink-400" />
              <div className="text-2xl font-bold text-white">{stats.totalEmotionMatches + stats.totalEmotionLogs}</div>
              <div className="text-sm text-white text-opacity-80">Emociones Totales</div>
            </div>
            
            <div className="bg-white bg-opacity-10 rounded-xl p-4 text-center">
              <Heart size={32} className="mx-auto mb-2 text-pink-400" />
              <div className="text-2xl font-bold text-white">{stats.totalEmotionMatches}</div>
              <div className="text-sm text-white text-opacity-80">Nombra Emociones</div>
            </div>
            
            <div className="bg-white bg-opacity-10 rounded-xl p-4 text-center">
              <Heart size={32} className="mx-auto mb-2 text-pink-400" />
              <div className="text-2xl font-bold text-white">{stats.totalEmotionLogs}</div>
              <div className="text-sm text-white text-opacity-80">Calculadora</div>
            </div>
            
            <div className="bg-white bg-opacity-10 rounded-xl p-4 text-center">
              <Flame size={32} className="mx-auto mb-2 text-red-400" />
              <div className="text-2xl font-bold text-white">{stats.totalAngerSessions}</div>
              <div className="text-sm text-white text-opacity-80">Menú de la Ira</div>
            </div>
          </div>
        </div>
        
        {/* Filter Section */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Filter size={18} />
            {filtersOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
          </button>
          
          {filtersOpen && (
            <button
              onClick={resetFilters}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm"
            >
              Resetear Filtros
            </button>
          )}
        </div>
        
        {filtersOpen && (
          <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white border-opacity-20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                Filtros Avanzados
              </h3>
              <button 
                onClick={() => setFiltersOpen(false)}
                className="text-white bg-gray-700 hover:bg-gray-800 p-2 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Datos Personales */}
              <div className="bg-white bg-opacity-10 rounded-xl p-4">
                <h4 className="font-bold text-white mb-4 border-b border-white border-opacity-20 pb-2">
                  Datos Personales
                </h4>
                
                <div className="space-y-4">
                  {/* Grado */}
                  <div>
                    <label className="block text-white text-sm mb-1">Grado</label>
                    <select 
                      name="grado"
                      value={filters.grado}
                      onChange={handleFilterChange}
                      className="w-full bg-black bg-opacity-50 border border-white border-opacity-20 rounded p-2 text-white"
                    >
                      <option value="">Todos</option>
                      <option value="1°">1° Primaria</option>
                      <option value="2°">2° Primaria</option>
                      <option value="3°">3° Primaria</option>
                      <option value="4°">4° Primaria</option>
                      <option value="5°">5° Primaria</option>
                      <option value="6°">6° Secundaria</option>
                      <option value="7°">7° Secundaria</option>
                      <option value="8°">8° Secundaria</option>
                      <option value="9°">9° Secundaria</option>
                      <option value="10°">10° Secundaria</option>
                      <option value="11°">11° Secundaria</option>
                    </select>
                  </div>
                  
                  {/* Edad */}
                  <div>
                    <label className="block text-white text-sm mb-1">Edad</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.edad.min}
                        onChange={(e) => handleEdadChange('min', e.target.value)}
                        className="w-1/2 bg-black bg-opacity-50 border border-white border-opacity-20 rounded p-2 text-white"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.edad.max}
                        onChange={(e) => handleEdadChange('max', e.target.value)}
                        className="w-1/2 bg-black bg-opacity-50 border border-white border-opacity-20 rounded p-2 text-white"
                      />
                    </div>
                  </div>
                  
                  {/* Sexo */}
                  <div>
                    <label className="block text-white text-sm mb-1">Género</label>
                    <select 
                      name="sexo"
                      value={filters.sexo}
                      onChange={handleFilterChange}
                      className="w-full bg-black bg-opacity-50 border border-white border-opacity-20 rounded p-2 text-white"
                    >
                      <option value="">Todos</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                      <option value="Prefiero no decir">Prefiero no decir</option>
                    </select>
                  </div>
                  
                  {/* Colegio */}
                  <div>
                    <label className="block text-white text-sm mb-1">Colegio</label>
                    <input 
                      type="text"
                      name="colegio"
                      value={filters.colegio}
                      onChange={handleFilterChange}
                      placeholder="Nombre del colegio"
                      className="w-full bg-black bg-opacity-50 border border-white border-opacity-20 rounded p-2 text-white"
                    />
                  </div>
                </div>
              </div>
              
              {/* Ubicación */}
              <div className="bg-white bg-opacity-10 rounded-xl p-4">
                <h4 className="font-bold text-white mb-4 border-b border-white border-opacity-20 pb-2">
                  Ubicación
                </h4>
                
                <div className="space-y-4">
                  {/* Ciudad */}
                  <div>
                    <label className="block text-white text-sm mb-1">Ciudad</label>
                    <input 
                      type="text"
                      name="ciudad"
                      value={filters.ciudad}
                      onChange={handleFilterChange}
                      placeholder="Ciudad"
                      className="w-full bg-black bg-opacity-50 border border-white border-opacity-20 rounded p-2 text-white"
                    />
                  </div>
                  
                  {/* País */}
                  <div>
                    <label className="block text-white text-sm mb-1">País</label>
                    <input 
                      type="text"
                      name="pais"
                      value={filters.pais}
                      onChange={handleFilterChange}
                      placeholder="País"
                      className="w-full bg-black bg-opacity-50 border border-white border-opacity-20 rounded p-2 text-white"
                    />
                  </div>
                </div>
              </div>
              
              {/* Actividades */}
              <div className="bg-white bg-opacity-10 rounded-xl p-4">
                <h4 className="font-bold text-white mb-4 border-b border-white border-opacity-20 pb-2">
                  Actividades Realizadas
                </h4>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="tieneLineasTiempo"
                      name="tieneLineasTiempo"
                      checked={filters.tieneLineasTiempo}
                      onChange={(e) => setFilters(prev => ({ ...prev, tieneLineasTiempo: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="tieneLineasTiempo" className="text-white text-sm">Tiene Líneas de Tiempo</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="tieneCartas"
                      name="tieneCartas"
                      checked={filters.tieneCartas}
                      onChange={(e) => setFilters(prev => ({ ...prev, tieneCartas: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="tieneCartas" className="text-white text-sm">Tiene Cartas</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="tieneMeditacion"
                      name="tieneMeditacion"
                      checked={filters.tieneMeditacion}
                      onChange={(e) => setFilters(prev => ({ ...prev, tieneMeditacion: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="tieneMeditacion" className="text-white text-sm">Tiene Meditación</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="tieneNombraEmociones"
                      name="tieneNombraEmociones"
                      checked={filters.tieneNombraEmociones}
                      onChange={(e) => setFilters(prev => ({ ...prev, tieneNombraEmociones: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="tieneNombraEmociones" className="text-white text-sm">Tiene Nombra tus Emociones</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="tieneCalculadoraEmociones"
                      name="tieneCalculadoraEmociones"
                      checked={filters.tieneCalculadoraEmociones}
                      onChange={(e) => setFilters(prev => ({ ...prev, tieneCalculadoraEmociones: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="tieneCalculadoraEmociones" className="text-white text-sm">Tiene Calculadora de Emociones</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="tieneMenuIra"
                      name="tieneMenuIra"
                      checked={filters.tieneMenuIra}
                      onChange={(e) => setFilters(prev => ({ ...prev, tieneMenuIra: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="tieneMenuIra" className="text-white text-sm">Tiene Menú de la Ira</label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Filter Counts */}
            <div className="mt-4 flex justify-between items-center text-white">
              <div>
                <span className="text-green-400 font-bold">{filteredUsers.length}</span> de {dashboardData.length} usuarios mostrados
              </div>
              <div>
                {Object.values(filters).some(value => 
                  value !== '' && value !== false && 
                  !(typeof value === 'object' && Object.values(value).every(v => v === ''))
                ) && (
                  <button 
                    onClick={resetFilters}
                    className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                  >
                    <X size={14} />
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User List */}
        <div className="bg-black bg-opacity-20 backdrop-blur-lg rounded-3xl p-6 border border-white border-opacity-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              Usuarios Registrados ({filteredUsers.length})
            </h3>
            
            <div className="relative">
              <input
                type="text"
                id="searchInput"
                name="searchInput"
                aria-label="Buscar usuario"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar usuario..."
                className="bg-white bg-opacity-10 text-white border border-white border-opacity-20 rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 placeholder-white placeholder-opacity-50"
              />
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white text-opacity-70" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white text-opacity-80 border-b border-white border-opacity-20">
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Colegio</th>
                  <th className="px-4 py-3">Grado</th>
                  <th className="px-4 py-3">Línea Tiempo</th>
                  <th className="px-4 py-3">Cartas</th>
                  <th className="px-4 py-3">Meditación</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userData) => (
                  <tr 
                    key={userData.user_id} 
                    className="border-b border-white border-opacity-10 hover:bg-white hover:bg-opacity-10 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0">
                          {userData.profile_info.avatar_url ? (
                            <img
                              src={userData.profile_info.avatar_url}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User size={16} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white">
                            {userData.profile_info.nombre} {userData.profile_info.apellido}
                          </div>
                          <div className="text-xs text-white text-opacity-70">
                            {userData.profile_info.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-white">
                      {userData.profile_info.nombre_colegio || 'N/A'}
                    </td>
                    <td className="px-4 py-4 text-white">
                      {userData.profile_info.grado || 'N/A'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                          {userData.timeline_stats.count}
                        </div>
                        <div className="text-white text-opacity-80 text-sm">
                          notas
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold">
                          {userData.letters_stats.count}
                        </div>
                        <div className="text-white text-opacity-80 text-sm">
                          cartas
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                          {userData.meditation_stats.count}
                        </div>
                        <div className="text-white text-opacity-80 text-sm">
                          sesiones
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full font-bold inline-flex items-center gap-2">
                        <Trophy size={14} />
                        {userData.total_score.toLocaleString()}
                      </div>
                      <div className="text-xs text-white text-opacity-70 mt-1">
                        {userData.level}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => navigate(`/user/${userData.user_id}`)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded-full text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Eye size={14} />
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-white text-opacity-70">
              <Users size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-xl" style={{ fontFamily: 'Comic Neue' }}>
                No se encontraron usuarios que coincidan con la búsqueda
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage