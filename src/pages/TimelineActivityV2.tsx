import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import TimelineSection from '../components/TimelineSection'
import TimelineNoteEditor from '../components/TimelineNoteEditor'
import { 
  ArrowLeft, 
  Clock, 
  Star,
  Sparkles,
  Save,
  CheckCircle,
  AlertCircle,
  Palette
} from 'lucide-react'
import { timelineService, TimelineNote } from '../lib/timelineService'

const TimelineActivityV2 = () => {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [notes, setNotes] = useState<TimelineNote[]>([])
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<TimelineNote | null>(null)
  const [selectedSection, setSelectedSection] = useState<'pasado' | 'presente' | 'futuro'>('presente')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const timelineSections = [
    { id: 'pasado', title: 'Pasado', color: 'bg-gradient-to-br from-blue-500 to-cyan-500', icon: '📚' },
    { id: 'presente', title: 'Presente', color: 'bg-gradient-to-br from-green-500 to-emerald-500', icon: '⭐' },
    { id: 'futuro', title: 'Futuro', color: 'bg-gradient-to-br from-purple-500 to-pink-500', icon: '🚀' }
  ]

  useEffect(() => {
    if (user) {
      loadNotes()
    }
  }, [user])

  const loadNotes = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const userNotes = await timelineService.getNotes(user.id)
      setNotes(userNotes)
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNote = (section: 'pasado' | 'presente' | 'futuro') => {
    setSelectedSection(section)
    setEditingNote(null)
    setIsEditorOpen(true)
  }

  const handleEditNote = (note: TimelineNote) => {
    setEditingNote(note)
    setSelectedSection(note.section)
    setIsEditorOpen(true)
  }

  const handleSaveNote = async (noteData: Omit<TimelineNote, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return

    setIsSaving(true)
    try {
      const noteWithUser = {
        ...noteData,
        user_id: user.id
      }

      let savedNote: TimelineNote | null = null

      if (editingNote && editingNote.id) {
        // Actualizar nota existente
        savedNote = await timelineService.updateNote(editingNote.id, noteWithUser)
        if (savedNote) {
          setNotes(prev => prev.map(note => 
            note.id === editingNote.id ? savedNote! : note
          ))
          setSaveMessage('¡Nota actualizada correctamente!')
        }
      } else {
        // Crear nueva nota
        savedNote = await timelineService.createNote(noteWithUser)
        if (savedNote) {
          setNotes(prev => [...prev, savedNote!])
          setSaveMessage('¡Nota creada correctamente!')
        }
      }

      if (savedNote) {
        setHasUnsavedChanges(false)
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        setSaveMessage('Error al guardar la nota')
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error saving note:', error)
      setSaveMessage('Error al guardar la nota')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) return

    setIsSaving(true)
    try {
      const success = await timelineService.deleteNote(id)
      if (success) {
        setNotes(prev => prev.filter(note => note.id !== id))
        setSaveMessage('¡Nota eliminada correctamente!')
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        setSaveMessage('Error al eliminar la nota')
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      setSaveMessage('Error al eliminar la nota')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDragNote = async (id: string, x: number, y: number) => {
    // Actualizar posición localmente de inmediato
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, position_x: x, position_y: y } : note
    ))
    
    // Marcar como cambios no guardados
    setHasUnsavedChanges(true)
    
    // Guardar en la base de datos
    try {
      await timelineService.updateNotePosition(id, x, y)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error updating note position:', error)
    }
  }

  const handleSaveAll = async () => {
    setSaveMessage('¡Todas las notas están guardadas!')
    setHasUnsavedChanges(false)
    setTimeout(() => setSaveMessage(''), 3000)
  }

  const getSectionNotes = (sectionId: string) => {
    return notes.filter(note => note.section === sectionId)
  }

  if (loading || isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative"
        style={{
          backgroundImage: 'url(/cuadricula-prueba.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Overlay muy sutil para loading */}
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        
        <div className="relative z-10 bg-white bg-opacity-90 backdrop-blur-sm rounded-3xl p-8 text-center border border-white border-opacity-50 shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Fredoka' }}>
            Cargando tu línea del tiempo...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(/cuadricula-prueba.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay muy sutil para mantener la cuadrícula visible */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-900 from-opacity-10 via-yellow-900 via-opacity-5 to-amber-900 to-opacity-15"></div>
      
      {/* Todo el contenido con z-index relativo */}
      <div className="relative z-10">
        {/* Header con fondo más transparente */}
        <div className="bg-white bg-opacity-80 backdrop-blur-md border-b border-yellow-400 border-opacity-30 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-800 hover:text-gray-600 transition-colors bg-yellow-400 bg-opacity-20 rounded-full p-2 hover:bg-opacity-40 border border-yellow-500 border-opacity-30"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Clock size={36} className="text-gray-800" />
                  <Sparkles size={16} className="absolute -top-1 -right-1 text-yellow-600 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800" style={{ fontFamily: 'Fredoka' }}>
                    Mi Línea del Tiempo v2
                  </h1>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Palette size={16} />
                    <span className="text-sm" style={{ fontFamily: 'Comic Neue' }}>
                      Versión de diseño experimental
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Botón de Guardar con colores que contrasten con el fondo */}
              <button
                onClick={handleSaveAll}
                disabled={isSaving || !hasUnsavedChanges}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg border-2 ${
                  hasUnsavedChanges 
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white animate-pulse border-red-300' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-300'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save size={20} />
                {isSaving ? 'Guardando...' : hasUnsavedChanges ? 'Guardar Cambios' : 'Todo Guardado'}
              </button>
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Mensaje de estado con colores que contrasten */}
        {saveMessage && (
          <div className="fixed top-24 right-4 z-50 flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl shadow-2xl p-4 border-2 border-green-400">
            <CheckCircle size={24} />
            <span className="font-bold text-lg" style={{ fontFamily: 'Fredoka' }}>{saveMessage}</span>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Instrucciones con fondo semi-transparente */}
          <div className="text-center mb-8">
            <div className="bg-white bg-opacity-85 backdrop-blur-sm rounded-3xl p-6 max-w-4xl mx-auto border-2 border-yellow-400 border-opacity-40 shadow-xl">
              <h2 className="text-3xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Fredoka' }}>
                ✨ ¡Crea tu línea del tiempo personal! ✨
              </h2>
              <p className="text-xl text-gray-700 max-w-3xl mx-auto" style={{ fontFamily: 'Comic Neue' }}>
                Agrega notas sobre tu pasado, presente y futuro. Puedes arrastrarlas, editarlas y personalizarlas como quieras.
              </p>
            </div>
          </div>

          {/* Timeline Sections con espaciado mejorado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {timelineSections.map((section) => (
              <div key={section.id} className="transform hover:scale-105 transition-all duration-300">
                <TimelineSection
                  title={section.title}
                  section={section.id as 'pasado' | 'presente' | 'futuro'}
                  notes={getSectionNotes(section.id)}
                  onAddNote={handleAddNote}
                  onEditNote={handleEditNote}
                  onDeleteNote={handleDeleteNote}
                  onDragNote={handleDragNote}
                  bgColor={section.color}
                  icon={section.icon}
                />
              </div>
            ))}
          </div>

          {/* Estadísticas con fondo semi-transparente */}
          <div className="mt-12 text-center">
            <div className="bg-white bg-opacity-85 backdrop-blur-sm rounded-3xl p-8 max-w-4xl mx-auto border-2 border-yellow-400 border-opacity-40 shadow-xl">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Star size={32} className="text-yellow-600" />
                <h3 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Fredoka' }}>
                  📊 Tu Progreso Creativo
                </h3>
                <Star size={32} className="text-yellow-600" />
              </div>
              <div className="grid grid-cols-3 gap-8">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-6 border-2 border-blue-300 shadow-lg">
                  <div className="text-4xl font-bold text-blue-700 mb-2">{getSectionNotes('pasado').length}</div>
                  <div className="text-lg font-medium text-blue-800">Recuerdos</div>
                  <div className="text-sm text-blue-600 mt-1">del pasado</div>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl p-6 border-2 border-green-300 shadow-lg">
                  <div className="text-4xl font-bold text-green-700 mb-2">{getSectionNotes('presente').length}</div>
                  <div className="text-lg font-medium text-green-800">Actualidad</div>
                  <div className="text-sm text-green-600 mt-1">viviendo ahora</div>
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-6 border-2 border-purple-300 shadow-lg">
                  <div className="text-4xl font-bold text-purple-700 mb-2">{getSectionNotes('futuro').length}</div>
                  <div className="text-lg font-medium text-purple-800">Sueños</div>
                  <div className="text-sm text-purple-600 mt-1">por cumplir</div>
                </div>
              </div>
              <div className="mt-6 text-gray-700" style={{ fontFamily: 'Comic Neue' }}>
                <p className="text-lg">
                  Total de notas creadas: <span className="font-bold text-yellow-700 text-xl">{notes.length}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      <TimelineNoteEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveNote}
        editingNote={editingNote}
        initialSection={selectedSection}
      />
    </div>
  )
}

export default TimelineActivityV2