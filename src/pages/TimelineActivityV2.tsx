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
  Palette,
  Lightbulb,
  Zap,
  Heart
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
        savedNote = await timelineService.updateNote(editingNote.id, noteWithUser)
        if (savedNote) {
          setNotes(prev => prev.map(note => 
            note.id === editingNote.id ? savedNote! : note
          ))
          setSaveMessage('¡Nota actualizada correctamente!')
        }
      } else {
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
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, position_x: x, position_y: y } : note
    ))
    
    setHasUnsavedChanges(true)
    
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
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
        }}
      >
        {/* Grid Background - Más fuerte */}
        <div 
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.4) 2px, transparent 2px),
              linear-gradient(90deg, rgba(255,255,255,0.4) 2px, transparent 2px)
            `,
            backgroundSize: '30px 30px'
          }}
        />
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-16 h-16 bg-yellow-400 rounded-full animate-bounce opacity-80" />
        <div className="absolute top-40 right-32 w-12 h-12 bg-pink-400 rounded-lg rotate-45 animate-pulse opacity-80" />
        <div className="absolute bottom-32 left-40 w-20 h-20 bg-blue-400 rounded-full animate-bounce opacity-80" style={{ animationDelay: '0.5s' }} />
        
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl p-8 text-center border-4 border-black shadow-2xl relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-black mx-auto mb-4"></div>
          <p className="text-2xl font-black text-black tracking-wide" style={{ fontFamily: 'Fredoka', fontWeight: '900' }}>
            CARGANDO TU LÍNEA DEL TIEMPO...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 100%, #764ba2 100%, #f093fb 100%)'
      }}
    >
      {/* Grid Background - Mucho más fuerte y visible */}
      <div 
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.9) 2px, transparent 2px),
            linear-gradient(90deg, rgba(255,255,255,0.9) 2px, transparent 2px)
          `,
          backgroundSize: '30px 30px'
        }}
      />

      {/* Grid adicional con líneas más gruesas para mayor impacto */}
      <div 
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />

      {/* Floating Decorative Elements */}
      <div className="absolute top-20 left-20 w-16 h-16 bg-yellow-400 rounded-full animate-bounce opacity-80 shadow-lg" />
      <div className="absolute top-40 right-32 w-12 h-12 bg-pink-400 rounded-lg rotate-45 animate-pulse opacity-80 shadow-lg" />
      <div className="absolute bottom-32 left-40 w-20 h-20 bg-blue-400 rounded-full animate-bounce opacity-80 shadow-lg" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-60 left-1/2 w-8 h-8 bg-green-400 rounded-full animate-ping opacity-60" />
      <div className="absolute bottom-40 right-20 w-14 h-14 bg-purple-400 rounded-lg rotate-12 animate-pulse opacity-80 shadow-lg" style={{ animationDelay: '1s' }} />
      
      {/* Floating Icons */}
      <div className="absolute top-32 right-1/4 text-4xl animate-bounce opacity-80" style={{ animationDelay: '0.3s' }}>
        <Lightbulb className="text-yellow-300 drop-shadow-lg" size={32} />
      </div>
      <div className="absolute bottom-60 left-1/4 text-4xl animate-pulse opacity-80" style={{ animationDelay: '0.8s' }}>
        <Zap className="text-orange-300 drop-shadow-lg" size={28} />
      </div>
      <div className="absolute top-1/2 right-16 text-4xl animate-bounce opacity-80" style={{ animationDelay: '1.2s' }}>
        <Heart className="text-red-300 drop-shadow-lg" size={24} />
      </div>

      {/* Header */}
      <div className="bg-white bg-opacity-95 backdrop-blur-md border-b-4 border-black shadow-lg relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-black hover:text-gray-700 transition-colors bg-white bg-opacity-80 rounded-full p-3 hover:bg-opacity-100 border-3 border-black shadow-lg transform hover:scale-105"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-3 border-black shadow-lg">
                  <Clock size={24} className="text-black" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-400 rounded-full animate-ping" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-black tracking-tight leading-none" style={{ fontFamily: 'Fredoka', fontWeight: '900' }}>
                  MI LÍNEA DEL TIEMPO V2
                </h1>
                <div className="flex items-center gap-2 text-gray-800">
                  <Palette size={16} />
                  <span className="text-sm font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent tracking-wide" style={{ fontFamily: 'Fredoka', fontWeight: '900' }}>
                    VERSIÓN EXPERIMENTAL
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Botón de Guardar */}
            <button
              onClick={handleSaveAll}
              disabled={isSaving || !hasUnsavedChanges}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-black transition-all transform hover:scale-105 shadow-lg border-4 border-black tracking-wide ${
                hasUnsavedChanges 
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white animate-pulse' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={{ fontFamily: 'Fredoka', fontWeight: '900' }}
            >
              <Save size={20} />
              {isSaving ? 'GUARDANDO...' : hasUnsavedChanges ? 'GUARDAR CAMBIOS' : 'TODO GUARDADO'}
            </button>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Mensaje de estado */}
      {saveMessage && (
        <div className="fixed top-24 right-4 z-50 flex items-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl shadow-2xl p-4 border-4 border-black transform animate-bounce">
          <CheckCircle size={24} />
          <span className="font-black text-lg tracking-wide" style={{ fontFamily: 'Fredoka', fontWeight: '900' }}>{saveMessage.toUpperCase()}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Instrucciones */}
        <div className="text-center mb-8">
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl p-8 max-w-4xl mx-auto border-4 border-black shadow-xl relative overflow-hidden">
            {/* Decorative elements inside the card */}
            <div className="absolute top-4 left-4 w-6 h-6 bg-yellow-400 rounded-full animate-pulse" />
            <div className="absolute top-4 right-4 w-4 h-4 bg-pink-400 rounded-full animate-bounce" />
            <div className="absolute bottom-4 left-8 w-5 h-5 bg-blue-400 rounded-full animate-ping" />
            <div className="absolute bottom-4 right-8 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-3 border-black shadow-lg">
                  <Sparkles size={24} className="text-black" />
                </div>
                <h2 className="text-4xl font-black text-black tracking-tight leading-none" style={{ fontFamily: 'Fredoka', fontWeight: '900' }}>
                  ¡CREA TU LÍNEA DEL TIEMPO PERSONAL!
                </h2>
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center border-3 border-black shadow-lg">
                  <Star size={24} className="text-black" />
                </div>
              </div>
              <p className="text-xl text-gray-800 max-w-3xl mx-auto font-bold tracking-wide" style={{ fontFamily: 'Fredoka', fontWeight: '700' }}>
                AGREGA NOTAS SOBRE TU PASADO, PRESENTE Y FUTURO. PUEDES ARRASTRARLAS, EDITARLAS Y PERSONALIZARLAS COMO QUIERAS.
              </p>
            </div>
          </div>
        </div>

        {/* Timeline Sections */}
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

        {/* Estadísticas */}
        <div className="mt-12 text-center">
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl p-8 max-w-4xl mx-auto border-4 border-black shadow-xl relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-4 left-4 w-8 h-8 bg-yellow-400 rounded-full" />
              <div className="absolute top-8 right-8 w-6 h-6 bg-pink-400 rounded-lg rotate-45" />
              <div className="absolute bottom-4 left-8 w-10 h-10 bg-blue-400 rounded-full" />
              <div className="absolute bottom-8 right-4 w-7 h-7 bg-green-400 rounded-lg" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center border-3 border-black shadow-lg">
                  <Star size={24} className="text-black" />
                </div>
                <h3 className="text-3xl font-black text-black tracking-tight" style={{ fontFamily: 'Fredoka', fontWeight: '900' }}>
                  📊 TU PROGRESO CREATIVO
                </h3>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center border-3 border-black shadow-lg">
                  <Sparkles size={24} className="text-black" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-8">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-6 border-4 border-black shadow-lg transform hover:scale-105 transition-all">
                  <div className="text-5xl font-black text-blue-700 mb-2" style={{ fontFamily: 'Fredoka', fontWeight: '900' }}>{getSectionNotes('pasado').length}</div>
                  <div className="text-xl font-black text-blue-800 tracking-wide" style={{ fontFamily: 'Fredoka', fontWeight: '900' }}>RECUERDOS</div>
                  <div className="text-sm font-bold text-blue-600 mt-1 tracking-wide" style={{ fontFamily: 'Fredoka', fontWeight: '700' }}>DEL PASADO</div>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-2xl p-6 border-4 border-black shadow-lg transform hover:scale-105 transition-all">
                  <div className="text-5xl font-black text-green-700 mb-2" style={{ fontFamily: 'Fredoka', fontWeight: '900' }}>{getSectionNotes('presente').length}</div>
                  <div className="text-xl font-black text-green-800 tracking-wide" style={{ fontFamily: 'Fredoka', fontWeight: '900' }}>ACTUALIDAD</div>
                  <div className="text-sm font-bold text-green-600 mt-1 tracking-wide" style={{ fontFamily: 'Fredoka', fontWeight: '700' }}>VIVIENDO AHORA</div>
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl p-6 border-4 border-black shadow-lg transform hover:scale-105 transition-all">
                  <div className="text-5xl font-black text-purple-700 mb-2" style={{ fontFamily: 'Fredoka', fontWeight: '900' }}>{getSectionNotes('futuro').length}</div>
                  <div className="text-xl font-black text-purple-800 tracking-wide" style={{ fontFamily: 'Fredoka', fontWeight: '900' }}>SUEÑOS</div>
                  <div className="text-sm font-bold text-purple-600 mt-1 tracking-wide" style={{ fontFamily: 'Fredoka', fontWeight: '700' }}>POR CUMPLIR</div>
                </div>
              </div>
              <div className="mt-6 text-black">
                <p className="text-xl font-black tracking-wide" style={{ fontFamily: 'Fredoka', fontWeight: '900' }}>
                  TOTAL DE NOTAS CREADAS: <span className="font-black text-orange-700 text-2xl bg-yellow-200 px-4 py-2 rounded-full border-3 border-black shadow-lg">{notes.length}</span>
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