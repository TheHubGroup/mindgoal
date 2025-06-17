import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import { userResponsesService } from '../lib/userResponsesService'
import { 
  ArrowLeft, 
  Mail, 
  Send,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Calendar,
  Heart,
  Star,
  Sparkles,
  Clock,
  Target,
  Gift
} from 'lucide-react'

interface Carta {
  id: string
  titulo: string
  destinatario: string
  contenido: string
  categoria: 'pasado' | 'presente' | 'futuro'
  fecha_creacion: string
  fecha_entrega?: string
  estado: 'borrador' | 'enviada' | 'programada'
}

const CartaMiMismo = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [cartas, setCartas] = useState<Carta[]>([])
  const [cartaActual, setCartaActual] = useState<Carta | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const categorias = [
    { 
      id: 'pasado', 
      titulo: 'Carta a mi yo del pasado', 
      descripcion: 'Reflexiona sobre experiencias pasadas y comparte sabiduría',
      icon: Clock,
      color: 'from-blue-500 to-cyan-500',
      emoji: '📚'
    },
    { 
      id: 'presente', 
      titulo: 'Carta a mi yo actual', 
      descripcion: 'Reflexiona sobre tu presente y tus sentimientos actuales',
      icon: Heart,
      color: 'from-green-500 to-emerald-500',
      emoji: '⭐'
    },
    { 
      id: 'futuro', 
      titulo: 'Carta a mi yo del futuro', 
      descripcion: 'Comparte tus sueños, metas y esperanzas',
      icon: Target,
      color: 'from-purple-500 to-pink-500',
      emoji: '🚀'
    }
  ]

  const plantillasCartas = {
    pasado: {
      titulo: 'Querido yo del pasado',
      contenido: `Querido yo de hace unos años,

Quiero contarte algunas cosas importantes que he aprendido desde entonces...

Lo que más me gustaría decirte es:
- 

Las experiencias que más me han marcado han sido:
- 

Si pudiera darte un consejo, sería:
- 

Gracias por todas las decisiones que tomaste, porque me trajeron hasta aquí.

Con cariño,
Tu yo del presente`
    },
    presente: {
      titulo: 'Querido yo de hoy',
      contenido: `Querido yo del presente,

Hoy quiero tomarme un momento para reflexionar sobre quién soy ahora...

En este momento de mi vida me siento:
- 

Las cosas que más valoro son:
- 

Mis mayores fortalezas son:
- 

Los desafíos que estoy enfrentando:
- 

Quiero recordar siempre que:
- 

Con amor propio,
Yo mismo/a`
    },
    futuro: {
      titulo: 'Querido yo del futuro',
      contenido: `Querido yo del futuro,

Te escribo desde el presente con mucha emoción por conocerte...

Mis sueños para ti son:
- 

Espero que hayas logrado:
- 

Las metas que me propongo alcanzar:
- 

Los valores que espero que mantengas:
- 

Recuerda siempre de dónde vienes y lo mucho que has crecido.

Con esperanza,
Tu yo del pasado`
    }
  }

  useEffect(() => {
    if (user) {
      loadCartas()
    }
  }, [user])

  const loadCartas = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const responses = await userResponsesService.getResponses(user.id, 'carta_mi_mismo')
      
      const cartasFormateadas = responses.map(response => {
        const data = JSON.parse(response.response)
        return {
          id: response.id || Date.now().toString(),
          titulo: data.titulo || 'Carta sin título',
          destinatario: data.destinatario || 'Mi yo',
          contenido: data.contenido || '',
          categoria: data.categoria || 'presente',
          fecha_creacion: response.created_at || new Date().toISOString(),
          fecha_entrega: data.fecha_entrega,
          estado: data.estado || 'borrador'
        }
      })
      
      setCartas(cartasFormateadas)
    } catch (error) {
      console.error('Error loading cartas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveCartas = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      // Limpiar respuestas anteriores de esta actividad
      const existingResponses = await userResponsesService.getResponses(user.id, 'carta_mi_mismo')
      for (const response of existingResponses) {
        if (response.id) {
          await userResponsesService.deleteResponse(response.id)
        }
      }

      // Guardar nuevas cartas
      const responsesToSave = cartas.map(carta => ({
        user_id: user.id,
        question: `carta_${carta.categoria}`,
        response: JSON.stringify({
          titulo: carta.titulo,
          destinatario: carta.destinatario,
          contenido: carta.contenido,
          categoria: carta.categoria,
          fecha_entrega: carta.fecha_entrega,
          estado: carta.estado
        }),
        activity_type: 'carta_mi_mismo'
      }))

      if (responsesToSave.length > 0) {
        const success = await userResponsesService.saveMultipleResponses(responsesToSave)
        
        if (success) {
          setSaveMessage('¡Cartas guardadas exitosamente!')
          setHasUnsavedChanges(false)
        } else {
          setSaveMessage('Error al guardar las cartas')
        }
      } else {
        setSaveMessage('¡Cartas guardadas exitosamente!')
        setHasUnsavedChanges(false)
      }
      
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving cartas:', error)
      setSaveMessage('Error al guardar las cartas')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const crearNuevaCarta = (categoria: 'pasado' | 'presente' | 'futuro') => {
    const plantilla = plantillasCartas[categoria]
    const nuevaCarta: Carta = {
      id: Date.now().toString(),
      titulo: plantilla.titulo,
      destinatario: `Mi yo del ${categoria}`,
      contenido: plantilla.contenido,
      categoria,
      fecha_creacion: new Date().toISOString(),
      estado: 'borrador'
    }
    
    setCartaActual(nuevaCarta)
    setIsEditing(true)
    setHasUnsavedChanges(true)
  }

  const editarCarta = (carta: Carta) => {
    setCartaActual(carta)
    setIsEditing(true)
  }

  const guardarCarta = () => {
    if (!cartaActual) return

    const cartasActualizadas = cartas.some(c => c.id === cartaActual.id)
      ? cartas.map(c => c.id === cartaActual.id ? cartaActual : c)
      : [...cartas, cartaActual]

    setCartas(cartasActualizadas)
    setIsEditing(false)
    setCartaActual(null)
    setHasUnsavedChanges(true)
  }

  const eliminarCarta = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta carta?')) {
      setCartas(cartas.filter(c => c.id !== id))
      setHasUnsavedChanges(true)
    }
  }

  const enviarCarta = (id: string) => {
    setCartas(cartas.map(c => 
      c.id === id 
        ? { ...c, estado: 'enviada' as const, fecha_entrega: new Date().toISOString() }
        : c
    ))
    setHasUnsavedChanges(true)
    setSaveMessage('¡Carta enviada a tu yo! 💌')
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const getCartasPorCategoria = (categoria: string) => {
    return cartas.filter(carta => carta.categoria === categoria)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-400 to-pink-400 flex items-center justify-center">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
            Cargando tus cartas...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-400 to-pink-400">
      {/* Header */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white hover:text-opacity-80 transition-colors"
            >
              <ArrowLeft size={24} />
              <span className="font-bold">Volver</span>
            </button>
            <div className="flex items-center gap-3">
              <Mail size={32} className="text-white" />
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                Carta a mi mismo
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={saveCartas}
              disabled={isSaving || !hasUnsavedChanges}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${
                hasUnsavedChanges 
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white animate-pulse' 
                  : 'bg-green-500 text-white'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save size={20} />
              {isSaving ? 'Guardando...' : hasUnsavedChanges ? 'Guardar Cambios' : 'Todo Guardado'}
            </button>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Mensaje de estado */}
      {saveMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-white rounded-lg shadow-lg p-4 border-l-4 border-green-500">
          <CheckCircle size={20} className="text-green-500" />
          <span className="font-medium text-gray-800">{saveMessage}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Instrucciones */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
            ¡Escribe cartas a diferentes versiones de ti mismo! 💌
          </h2>
          <p className="text-xl text-white text-opacity-90 max-w-3xl mx-auto" style={{ fontFamily: 'Comic Neue' }}>
            Reflexiona sobre tu pasado, presente y futuro escribiendo cartas personales llenas de sabiduría y amor propio.
          </p>
        </div>

        {!isEditing ? (
          <>
            {/* Categorías de cartas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {categorias.map((categoria) => {
                const IconComponent = categoria.icon
                const cartasCategoria = getCartasPorCategoria(categoria.id)
                
                return (
                  <div
                    key={categoria.id}
                    className="bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-6"
                  >
                    {/* Header de categoría */}
                    <div className={`bg-gradient-to-r ${categoria.color} rounded-xl p-4 mb-6`}>
                      <div className="flex items-center gap-3 text-white mb-2">
                        <span className="text-2xl">{categoria.emoji}</span>
                        <IconComponent size={24} />
                        <h3 className="text-lg font-bold" style={{ fontFamily: 'Fredoka' }}>
                          {categoria.titulo}
                        </h3>
                      </div>
                      <p className="text-white text-opacity-90 text-sm" style={{ fontFamily: 'Comic Neue' }}>
                        {categoria.descripcion}
                      </p>
                    </div>

                    {/* Botón crear nueva carta */}
                    <button
                      onClick={() => crearNuevaCarta(categoria.id as 'pasado' | 'presente' | 'futuro')}
                      className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl p-4 mb-4 flex items-center gap-3 transition-all transform hover:scale-105"
                    >
                      <Plus size={20} className="text-white" />
                      <span className="text-white font-bold" style={{ fontFamily: 'Fredoka' }}>
                        Nueva Carta
                      </span>
                    </button>

                    {/* Lista de cartas */}
                    <div className="space-y-3">
                      {cartasCategoria.map((carta) => (
                        <div
                          key={carta.id}
                          className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all group"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-gray-800 text-sm" style={{ fontFamily: 'Fredoka' }}>
                              {carta.titulo}
                            </h4>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => editarCarta(carta)}
                                className="text-blue-500 hover:text-blue-700 p-1"
                              >
                                <Mail size={14} />
                              </button>
                              {carta.estado === 'borrador' && (
                                <button
                                  onClick={() => enviarCarta(carta.id)}
                                  className="text-green-500 hover:text-green-700 p-1"
                                >
                                  <Send size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => eliminarCarta(carta.id)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-600 text-xs mb-2" style={{ fontFamily: 'Comic Neue' }}>
                            {carta.contenido.substring(0, 100)}...
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">
                              {new Date(carta.fecha_creacion).toLocaleDateString()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              carta.estado === 'enviada' 
                                ? 'bg-green-100 text-green-700'
                                : carta.estado === 'programada'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {carta.estado === 'enviada' ? 'Enviada' : 
                               carta.estado === 'programada' ? 'Programada' : 'Borrador'}
                            </span>
                          </div>
                        </div>
                      ))}

                      {cartasCategoria.length === 0 && (
                        <div className="text-center py-8 text-white text-opacity-70">
                          <Mail size={48} className="mx-auto mb-4 opacity-50" />
                          <p style={{ fontFamily: 'Comic Neue' }}>
                            Aún no has escrito ninguna carta para esta categoría
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Estadísticas */}
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 text-center" style={{ fontFamily: 'Fredoka' }}>
                📊 Tus Cartas
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-300">{getCartasPorCategoria('pasado').length}</div>
                  <div className="text-sm opacity-80">Al Pasado</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-300">{getCartasPorCategoria('presente').length}</div>
                  <div className="text-sm opacity-80">Al Presente</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-300">{getCartasPorCategoria('futuro').length}</div>
                  <div className="text-sm opacity-80">Al Futuro</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-300">{cartas.filter(c => c.estado === 'enviada').length}</div>
                  <div className="text-sm opacity-80">Enviadas</div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Editor de carta */
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Fredoka' }}>
                {cartaActual ? 'Editando Carta' : 'Nueva Carta'}
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <ArrowLeft size={24} />
              </button>
            </div>

            {cartaActual && (
              <div className="space-y-6">
                {/* Título */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título de la carta
                  </label>
                  <input
                    type="text"
                    value={cartaActual.titulo}
                    onChange={(e) => setCartaActual({ ...cartaActual, titulo: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Título de tu carta..."
                  />
                </div>

                {/* Destinatario */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Para:
                  </label>
                  <input
                    type="text"
                    value={cartaActual.destinatario}
                    onChange={(e) => setCartaActual({ ...cartaActual, destinatario: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Mi yo del..."
                  />
                </div>

                {/* Contenido */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenido de la carta
                  </label>
                  <textarea
                    value={cartaActual.contenido}
                    onChange={(e) => setCartaActual({ ...cartaActual, contenido: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent h-96 resize-none"
                    placeholder="Escribe tu carta aquí..."
                    style={{ fontFamily: 'Comic Neue' }}
                  />
                </div>

                {/* Botones de acción */}
                <div className="flex gap-4">
                  <button
                    onClick={guardarCarta}
                    disabled={!cartaActual.titulo.trim() || !cartaActual.contenido.trim()}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    Guardar Carta
                  </button>
                  
                  <button
                    onClick={() => {
                      guardarCarta()
                      if (cartaActual) {
                        enviarCarta(cartaActual.id)
                      }
                    }}
                    disabled={!cartaActual.titulo.trim() || !cartaActual.contenido.trim()}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Send size={20} />
                    Guardar y Enviar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 text-center">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 justify-center mb-3">
              <Sparkles size={24} className="text-yellow-300" />
              <h4 className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                Consejos para escribir
              </h4>
            </div>
            <div className="text-white text-opacity-90 text-left space-y-2" style={{ fontFamily: 'Comic Neue' }}>
              <p>• <strong>Al pasado:</strong> Comparte lo que has aprendido y agradece las experiencias</p>
              <p>• <strong>Al presente:</strong> Reflexiona sobre tus sentimientos y valora quién eres ahora</p>
              <p>• <strong>Al futuro:</strong> Comparte tus sueños, metas y los valores que quieres mantener</p>
              <p>• <strong>Sé honesto:</strong> Estas cartas son para ti, exprésate con sinceridad</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartaMiMismo