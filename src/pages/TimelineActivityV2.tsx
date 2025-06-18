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
        {/* Overlay para mejorar legibilidad */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        <div className="relative z-10 bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 text-center border border-white border-opacity-30">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold text-white drop-shadow-lg" style={{ fontFamily: 'Fredoka' }}>
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
      {/* Overlay para mejorar legibilidad y mantener el estilo */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 from-opacity-60 via-purple-900 via-opacity-50 to-pink-900 to-opacity-60"></div>
      
      {/* Todo el contenido con z-index relativo */}
      <div className="relative z-10">
        {/* Header con nuevo diseño */}
        <div className="bg-white bg-opacity-15 backdrop-blur-md border-b border-white border-opacity-20">
          <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-white hover:text-gray-200 transition-colors bg-white bg-opacity-20 rounded-full p-2 hover:bg-opacity-30"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Clock size={36} className="text-white drop-shadow-lg" />
                  <Sparkles size={16} className="absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white drop-shadow-lg" style={{ fontFamily: 'Fredoka' }}>
                    Mi Línea del Tiempo v2
                  </h1>
                  <div className="flex items-center gap-2 text-white text-opacity-80">
                    <Palette size={16} />
                    <span className="text-sm" style={{ fontFamily: 'Comic Neue' }}>
                      Versión de diseño experimental
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Botón de Guardar con nuevo estilo */}
              <button
                onClick={handleSaveAll}
                disabled={isSaving || !hasUnsavedChanges}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all transform hover:scale-105 ${
                  hasUnsavedChanges 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-white animate-pulse shadow-lg' 
                    : 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-lg'
                } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Save size={20} />
                {isSaving ? 'Guardando...' : hasUnsavedChanges ? 'Guardar Cambios' : 'Todo Guardado'}
              </button>
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Mensaje de estado con nuevo diseño */}
        {saveMessage && (
          <div className="fixed top-24 right-4 z-50 flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl shadow-2xl p-4 border border-white border-opacity-30 backdrop-blur-sm">
            <CheckCircle size={24} />
            <span className="font-bold text-lg" style={{ fontFamily: 'Fredoka' }}>{saveMessage}</span>
          </div>
        )}

        {/* Main Content con nuevo diseño */}
        <div className="max-w-7xl mx-auto px-4 py-8">
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

          {/* Estadísticas con nuevo diseño */}
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-r from-white from-opacity-10 to-white to-opacity-5 backdrop-blur-sm rounded-3xl p-8 max-w-4xl mx-auto border border-white border-opacity-20 shadow-2xl">
              <div className="flex items-center justify-center gap-3 mb-6">
                <Star size={32} className="text-yellow-300" />
                <h3 className="text-2xl font-bold text-white drop-shadow-lg" style={{ fontFamily: 'Fredoka' }}>
                  📊 Tu Progreso Creativo
                </h3>
                <Star size={32} className="text-yellow-300" />
              </div>
              <div className="grid grid-cols-3 gap-8 text-white">
                <div className="bg-white bg-opacity-10 rounded-2xl p-6 backdrop-blur-sm border border-white border-opacity-20">
                  <div className="text-4xl font-bold text-blue-300 mb-2 drop-shadow-lg">{getSectionNotes('pasado').length}</div>
                  <div className="text-lg font-medium opacity-90">Recuerdos</div>
                  <div className="text-sm opacity-70 mt-1">del pasado</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-2xl p-6 backdrop-blur-sm border border-white border-opacity-20">
                  <div className="text-4xl font-bold text-green-300 mb-2 drop-shadow-lg">{getSectionNotes('presente').length}</div>
                  <div className="text-lg font-medium opacity-90">Actualidad</div>
                  <div className="text-sm opacity-70 mt-1">viviendo ahora</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-2xl p-6 backdrop-blur-sm border border-white border-opacity-20">
                  <div className="text-4xl font-bold text-purple-300 mb-2 drop-shadow-lg">{getSectionNotes('futuro').length}</div>
                  <div className="text-lg font-medium opacity-90">Sueños</div>
                  <div className="text-sm opacity-70 mt-1">por cumplir</div>
                </div>
              </div>
              <div className="mt-6 text-white text-opacity-80" style={{ fontFamily: 'Comic Neue' }}>
                <p className="text-lg drop-shadow-lg">
                  Total de notas creadas: <span className="font-bold text-yellow-300">{notes.length}</span>
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