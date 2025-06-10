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
  AlertCircle
} from 'lucide-react'
import { timelineService, TimelineNote } from '../lib/timelineService'

const TimelineActivity = () => {
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
    { id: 'pasado', title: 'Pasado', color: 'bg-gradient-to-br from-blue-500 to-cyan-500', icon: '⏮️' },
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
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 flex items-center justify-center">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
            Cargando tu línea del tiempo...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400">
      {/* Header */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <Clock size={32} className="text-white" />
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              Mi Línea del Tiempo
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Botón de Guardar */}
            <button
              onClick={handleSaveAll}
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
            ¡Crea tu línea del tiempo personal! ✨
          </h2>
          <p className="text-xl text-white text-opacity-90 max-w-3xl mx-auto" style={{ fontFamily: 'Comic Neue' }}>
            Agrega notas sobre tu pasado, presente y futuro. Puedes arrastrarlas, editarlas y personalizarlas como quieras.
          </p>
        </div>

        {/* Timeline Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {timelineSections.map((section) => (
            <TimelineSection
              key={section.id}
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
          ))}
        </div>

        {/* Estadísticas */}
        <div className="mt-8 text-center">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
              📊 Tu Progreso
            </h3>
            <div className="grid grid-cols-3 gap-4 text-white">
              <div>
                <div className="text-2xl font-bold">{getSectionNotes('pasado').length}</div>
                <div className="text-sm opacity-80">Recuerdos</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{getSectionNotes('presente').length}</div>
                <div className="text-sm opacity-80">Actualidad</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{getSectionNotes('futuro').length}</div>
                <div className="text-sm opacity-80">Sueños</div>
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

export default TimelineActivity