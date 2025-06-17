import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import NotebookPaper from '../components/NotebookPaper'
import HandwritingEffect from '../components/HandwritingEffect'
import { letterService, Letter } from '../lib/letterService'
import { 
  ArrowLeft, 
  Mail, 
  Save,
  Plus,
  Trash2,
  Edit,
  Eye,
  Heart,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

const CartaMiMismo = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [letters, setLetters] = useState<Letter[]>([])
  const [isWriting, setIsWriting] = useState(false)
  const [currentLetter, setCurrentLetter] = useState<Letter | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [previewText, setPreviewText] = useState('')

  useEffect(() => {
    if (user) {
      loadLetters()
    }
  }, [user])

  const loadLetters = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const userLetters = await letterService.getLetters(user.id)
      setLetters(userLetters)
    } catch (error) {
      console.error('Error loading letters:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewLetter = () => {
    setCurrentLetter(null)
    setTitle('')
    setContent('')
    setIsWriting(true)
    setShowPreview(false)
  }

  const handleEditLetter = (letter: Letter) => {
    setCurrentLetter(letter)
    setTitle(letter.title)
    setContent(letter.content)
    setIsWriting(true)
    setShowPreview(false)
  }

  const handlePreviewLetter = (letter: Letter) => {
    setPreviewText(letter.content)
    setShowPreview(true)
  }

  const handleSaveLetter = async () => {
    if (!user || !title.trim() || !content.trim()) return

    setIsSaving(true)
    try {
      if (currentLetter && currentLetter.id) {
        // Actualizar carta existente
        const updatedLetter = await letterService.updateLetter(currentLetter.id, {
          title: title.trim(),
          content: content.trim()
        })
        
        if (updatedLetter) {
          setLetters(prev => prev.map(letter => 
            letter.id === currentLetter.id ? updatedLetter : letter
          ))
          setSaveMessage('¡Carta actualizada correctamente!')
        }
      } else {
        // Crear nueva carta
        const newLetter = await letterService.createLetter({
          user_id: user.id,
          title: title.trim(),
          content: content.trim()
        })
        
        if (newLetter) {
          setLetters(prev => [newLetter, ...prev])
          setSaveMessage('¡Carta guardada correctamente!')
        }
      }

      setIsWriting(false)
      setTitle('')
      setContent('')
      setCurrentLetter(null)
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving letter:', error)
      setSaveMessage('Error al guardar la carta')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteLetter = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta carta?')) return

    try {
      const success = await letterService.deleteLetter(id)
      if (success) {
        setLetters(prev => prev.filter(letter => letter.id !== id))
        setSaveMessage('¡Carta eliminada correctamente!')
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error deleting letter:', error)
      setSaveMessage('Error al eliminar la carta')
      setTimeout(() => setSaveMessage(''), 3000)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-red-100 flex items-center justify-center">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-xl font-bold text-amber-800" style={{ fontFamily: 'Fredoka' }}>
            Cargando tus cartas...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-100 to-red-100">
      {/* Header */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-amber-800 hover:text-amber-600 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <Mail size={32} className="text-amber-800" />
            <h1 className="text-2xl font-bold text-amber-800" style={{ fontFamily: 'Fredoka' }}>
              Carta a mí mismo
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {!isWriting && (
              <button
                onClick={handleNewLetter}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-full font-bold transition-all transform hover:scale-105"
              >
                <Plus size={20} />
                Nueva Carta
              </button>
            )}
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
        {!isWriting && !showPreview ? (
          // Lista de cartas
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-amber-800 mb-4" style={{ fontFamily: 'Fredoka' }}>
                Mis Cartas Personales 💌
              </h2>
              <p className="text-xl text-amber-700 max-w-3xl mx-auto" style={{ fontFamily: 'Comic Neue' }}>
                Escribe cartas para tu yo del futuro. Comparte tus pensamientos, sueños y reflexiones.
              </p>
            </div>

            {letters.length === 0 ? (
              <div className="text-center py-16">
                <Mail size={64} className="mx-auto text-amber-400 mb-4" />
                <h3 className="text-2xl font-bold text-amber-700 mb-2" style={{ fontFamily: 'Fredoka' }}>
                  Aún no has escrito ninguna carta
                </h3>
                <p className="text-amber-600 mb-6" style={{ fontFamily: 'Comic Neue' }}>
                  ¡Comienza escribiendo tu primera carta personal!
                </p>
                <button
                  onClick={handleNewLetter}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 flex items-center gap-2 mx-auto"
                >
                  <Plus size={20} />
                  Escribir mi primera carta
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {letters.map((letter) => (
                  <div
                    key={letter.id}
                    className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-amber-400 hover:shadow-xl transition-all transform hover:scale-105"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800 truncate" style={{ fontFamily: 'Fredoka' }}>
                        {letter.title}
                      </h3>
                      <Heart size={20} className="text-red-400 flex-shrink-0" />
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3" style={{ fontFamily: 'Comic Neue' }}>
                      {letter.content.substring(0, 100)}...
                    </p>
                    
                    <div className="text-xs text-gray-500 mb-4">
                      {new Date(letter.created_at || '').toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePreviewLetter(letter)}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye size={14} />
                        Ver
                      </button>
                      <button
                        onClick={() => handleEditLetter(letter)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit size={14} />
                        Editar
                      </button>
                      <button
                        onClick={() => letter.id && handleDeleteLetter(letter.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : showPreview ? (
          // Vista previa con efecto de escritura
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-amber-800" style={{ fontFamily: 'Fredoka' }}>
                Vista Previa
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Volver
              </button>
            </div>

            <NotebookPaper className="min-h-96 shadow-2xl">
              <div className="handwriting-font text-lg leading-10 text-blue-900">
                <HandwritingEffect
                  text={previewText}
                  speed={30}
                  className="block"
                />
              </div>
            </NotebookPaper>
          </div>
        ) : (
          // Editor de carta
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-amber-800" style={{ fontFamily: 'Fredoka' }}>
                {currentLetter ? 'Editar Carta' : 'Nueva Carta'}
              </h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsWriting(false)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveLetter}
                  disabled={isSaving || !title.trim() || !content.trim()}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} />
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-amber-800 font-bold mb-2" style={{ fontFamily: 'Fredoka' }}>
                Título de tu carta:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Carta para mi yo de 18 años"
                className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none text-lg"
                style={{ fontFamily: 'Comic Neue' }}
              />
            </div>

            <NotebookPaper className="min-h-96 shadow-2xl">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Querido yo del futuro..."
                className="w-full h-80 bg-transparent border-none outline-none resize-none text-lg leading-10 text-blue-900 handwriting-font"
                style={{ 
                  fontFamily: 'Comic Neue',
                  lineHeight: '40px'
                }}
              />
            </NotebookPaper>

            <div className="mt-6 text-center">
              <div className="flex justify-center gap-4 text-4xl">
                <span className="animate-pulse">✍️</span>
                <span className="animate-pulse" style={{ animationDelay: '0.1s' }}>💌</span>
                <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>💭</span>
                <span className="animate-pulse" style={{ animationDelay: '0.3s' }}>✨</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .handwriting-font {
          font-family: 'Comic Neue', cursive;
          font-weight: 400;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

export default CartaMiMismo