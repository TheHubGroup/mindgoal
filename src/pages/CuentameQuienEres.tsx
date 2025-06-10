import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import { supabase } from '../lib/supabase'
import { 
  Heart, 
  X, 
  ArrowLeft, 
  Sparkles, 
  Save,
  Plus,
  Trash2
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

  useEffect(() => {
    loadPreferences()
  }, [user])

  const loadPreferences = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      if (data) {
        setPreferences(data.map(item => ({
          id: item.id,
          text: item.preference_text,
          category: item.category as 'likes' | 'dislikes'
        })))
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
      // Delete existing preferences
      await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user.id)

      // Insert new preferences
      const preferencesToSave = preferences.map(pref => ({
        user_id: user.id,
        preference_text: pref.text,
        category: pref.category
      }))

      if (preferencesToSave.length > 0) {
        const { error } = await supabase
          .from('user_preferences')
          .insert(preferencesToSave)

        if (error) throw error
      }

      alert('¡Preferencias guardadas exitosamente!')
    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Error al guardar las preferencias')
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
  }

  const removePreference = (id: string) => {
    setPreferences(preferences.filter(pref => pref.id !== id))
  }

  const movePreference = (id: string, newCategory: 'likes' | 'dislikes') => {
    setPreferences(preferences.map(pref => 
      pref.id === id ? { ...pref, category: newCategory } : pref
    ))
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
      {/* Header */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/home')}
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
              disabled={isSaving}
              className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-full font-bold transition-all disabled:opacity-50"
            >
              <Save size={20} />
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Debug Info */}
        <div className="mb-4 text-white text-sm opacity-70">
          Usuario: {user?.email || 'No autenticado'} | Preferencias: {preferences.length}
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
      </div>
    </div>
  )
}

export default CuentameQuienEres
