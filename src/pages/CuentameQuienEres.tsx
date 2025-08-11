import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import { supabase } from '../lib/supabase'
import { userResponsesService } from '../lib/userResponsesService'
import { 
  Heart, 
  X, 
  ArrowLeft, 
  Sparkles, 
  Save,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface PreferenceItem {
  id: string
  text: string
  category: 'likes' | 'dislikes'
}

const CuentameQuienEres = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<PreferenceItem[]>([])
  const [newItem, setNewItem] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    loadPreferences()
  }, [user])

  const loadPreferences = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      
      // Cargar desde user_preferences (formato anterior)
      const { data: oldPreferences, error: oldError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)

      if (!oldError && oldPreferences && oldPreferences.length > 0) {
        // Convertir formato anterior a nuevo formato
        const convertedPreferences = oldPreferences.map(item => ({
          id: item.id,
          text: item.preference_text,
          category: item.category as 'likes' | 'dislikes'
        }))
        setPreferences(convertedPreferences)
      } else {
        // Cargar desde user_responses (nuevo formato)
        const responses = await userResponsesService.getResponses(user.id, 'cuentame_quien_eres')
        
        if (responses.length > 0) {
          const convertedPreferences = responses.map(response => ({
            id: response.id || Date.now().toString(),
            text: response.response,
            category: response.question === 'me_gusta' ? 'likes' as const : 'dislikes' as const
          }))
          setPreferences(convertedPreferences)
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const savePreferences = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      // Limpiar respuestas anteriores de esta actividad
      const existingResponses = await userResponsesService.getResponses(user.id, 'cuentame_quien_eres')
      for (const response of existingResponses) {
        if (response.id) {
          await userResponsesService.deleteResponse(response.id)
        }
      }

      // Guardar nuevas respuestas en user_responses
      const responsesToSave = preferences.map(pref => ({
        user_id: user.id,
        question: pref.category === 'likes' ? 'me_gusta' : 'no_me_gusta',
        response: pref.text,
        activity_type: 'cuentame_quien_eres'
      }))

      if (responsesToSave.length > 0) {
        const success = await userResponsesService.saveMultipleResponses(responsesToSave)
        
        if (success) {
          setSaveMessage('¡Preferencias guardadas exitosamente!')
          setHasUnsavedChanges(false)
          
          // También mantener compatibilidad con user_preferences por ahora
          await supabase.from('user_preferences').delete().eq('user_id', user.id)
          const legacyPreferences = preferences.map(pref => ({
            user_id: user.id,
            preference_text: pref.text,
            category: pref.category
          }))
          if (legacyPreferences.length > 0) {
            await supabase.from('user_preferences').insert(legacyPreferences)
          }
        } else {
          setSaveMessage('Error al guardar las preferencias')
        }
      } else {
        setSaveMessage('¡Preferencias guardadas exitosamente!')
        setHasUnsavedChanges(false)
      }
      
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving preferences:', error)
      setSaveMessage('Error al guardar las preferencias')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const addPreference = (category: 'likes' | 'dislikes') => {
    if (!newItem.trim()) return

    const newPreference: PreferenceItem = {
      id: Date.now().toString(),
      text: newItem.trim(),
      category
    }

    setPreferences([...preferences, newPreference])
    setNewItem('')
    setHasUnsavedChanges(true)
  }

  const removePreference = (id: string) => {
    setPreferences(preferences.filter(pref => pref.id !== id))
    setHasUnsavedChanges(true)
  }

  const movePreference = (id: string, newCategory: 'likes' | 'dislikes') => {
    setPreferences(preferences.map(pref => 
      pref.id === id ? { ...pref, category: newCategory } : pref
    ))
    setHasUnsavedChanges(true)
  }

  const handleDragStart = (e: React.DragEvent, preference: PreferenceItem) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(preference))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, category: 'likes' | 'dislikes') => {
    e.preventDefault()
    const preferenceData = e.dataTransfer.getData('text/plain')
    const preference = JSON.parse(preferenceData)
    movePreference(preference.id, category)
  }

  const likesItems = preferences.filter(pref => pref.category === 'likes')
  const dislikesItems = preferences.filter(pref => pref.category === 'dislikes')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-purple-400 flex items-center justify-center">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
            Cargando tus preferencias...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-purple-400">
      {/* Mensaje de estado */}
      {saveMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-white rounded-lg shadow-lg p-4 border-l-4 border-green-500">
          <CheckCircle size={20} className="text-green-500" />
          <span className="font-medium text-gray-800">{saveMessage}</span>
        </div>
      )}

      {/* Main Content */}
      {/* Header moved to bottom */}
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
              <Heart size={32} className="text-white" />
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                Cuéntame quien eres
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={savePreferences}
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Debug Info */}
        <div className="mb-4 text-white text-sm opacity-70">
          Usuario: {user?.email || 'No autenticado'} | Preferencias: {preferences.length} | 
          {hasUnsavedChanges ? ' ⚠️ Cambios sin guardar' : ' ✅ Todo guardado'}
        </div>

        {/* Instructions */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
            ¡Comparte tus gustos y preferencias! 💫
          </h2>
          <p className="text-xl text-white text-opacity-90 max-w-3xl mx-auto" style={{ fontFamily: 'Comic Neue' }}>
            Escribe algo que te gusta o no te gusta, y luego arrastra las tarjetas entre las columnas para organizarlas.
          </p>
        </div>

        {/* Add New Item */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Escribe algo que te gusta o no te gusta..."
              className="flex-1 px-4 py-3 rounded-full border-none outline-none text-gray-800 font-medium"
              style={{ fontFamily: 'Comic Neue' }}
              onKeyPress={(e) => e.key === 'Enter' && addPreference('likes')}
            />
            <div className="flex gap-3">
              <button
                onClick={() => addPreference('likes')}
                disabled={!newItem.trim()}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Heart size={20} />
                Me Gusta
              </button>
              <button
                onClick={() => addPreference('dislikes')}
                disabled={!newItem.trim()}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={20} />
                No Me Gusta
              </button>
            </div>
          </div>
        </div>

        {/* Preferences Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Me Gusta Column */}
          <div
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-6 min-h-96"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'likes')}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Heart size={24} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                Me Gusta ({likesItems.length})
              </h3>
            </div>

            <div className="space-y-3">
              {likesItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  className="bg-white rounded-2xl p-4 shadow-lg cursor-move hover:shadow-xl transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-800 font-medium flex-1" style={{ fontFamily: 'Comic Neue' }}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => removePreference(item.id)}
                      className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              {likesItems.length === 0 && (
                <div className="text-center py-12 text-white text-opacity-70">
                  <Heart size={48} className="mx-auto mb-4 opacity-50" />
                  <p style={{ fontFamily: 'Comic Neue' }}>
                    Arrastra aquí las cosas que te gustan
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* No Me Gusta Column */}
          <div
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-6 min-h-96"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'dislikes')}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <X size={24} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                No Me Gusta ({dislikesItems.length})
              </h3>
            </div>

            <div className="space-y-3">
              {dislikesItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item)}
                  className="bg-white rounded-2xl p-4 shadow-lg cursor-move hover:shadow-xl transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-800 font-medium flex-1" style={{ fontFamily: 'Comic Neue' }}>
                      {item.text}
                    </span>
                    <button
                      onClick={() => removePreference(item.id)}
                      className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              {dislikesItems.length === 0 && (
                <div className="text-center py-12 text-white text-opacity-70">
                  <X size={48} className="mx-auto mb-4 opacity-50" />
                  <p style={{ fontFamily: 'Comic Neue' }}>
                    Arrastra aquí las cosas que no te gustan
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 text-center">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 justify-center mb-3">
              <Sparkles size={24} className="text-yellow-300" />
              <h4 className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                Consejos
              </h4>
            </div>
            <p className="text-white text-opacity-90" style={{ fontFamily: 'Comic Neue' }}>
              • Puedes arrastrar las tarjetas entre columnas para cambiar tu opinión<br/>
              • Haz clic en el ícono de basura para eliminar elementos<br/>
              • No olvides guardar tus cambios cuando termines
            </p>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="mt-8 text-center">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
              📊 Tus Preferencias
            </h3>
            <div className="grid grid-cols-2 gap-4 text-white">
              <div>
                <div className="text-2xl font-bold text-green-300">{likesItems.length}</div>
                <div className="text-sm opacity-80">Me Gusta</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-300">{dislikesItems.length}</div>
                <div className="text-sm opacity-80">No Me Gusta</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CuentameQuienEres