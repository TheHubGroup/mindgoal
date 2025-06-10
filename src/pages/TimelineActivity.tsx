import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import { 
  ArrowLeft, 
  Plus, 
  Clock, 
  Calendar,
  Star,
  Heart,
  Smile,
  Camera,
  Music,
  Gift,
  Trophy,
  Sparkles
} from 'lucide-react'

interface TimelineNote {
  id: string
  title: string
  content: string
  date: string
  emoji: string
  color: string
  position: { x: number; y: number }
}

const TimelineActivity = () => {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [notes, setNotes] = useState<TimelineNote[]>([])
  const [selectedNote, setSelectedNote] = useState<TimelineNote | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [draggedNote, setDraggedNote] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const timelineSections = [
    { id: 'past', title: 'Pasado', color: 'from-blue-500 to-cyan-500', icon: Clock },
    { id: 'present', title: 'Presente', color: 'from-green-500 to-emerald-500', icon: Star },
    { id: 'future', title: 'Futuro', color: 'from-purple-500 to-pink-500', icon: Sparkles }
  ]

  const emojiOptions = ['😊', '🎉', '❤️', '⭐', '🎯', '🎨', '📚', '🎵', '🏆', '🎁', '📸', '🌟']
  const colorOptions = [
    'bg-yellow-200 border-yellow-400',
    'bg-pink-200 border-pink-400',
    'bg-blue-200 border-blue-400',
    'bg-green-200 border-green-400',
    'bg-purple-200 border-purple-400',
    'bg-orange-200 border-orange-400'
  ]

  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    emoji: '😊',
    color: colorOptions[0],
    section: 'present'
  })

  useEffect(() => {
    console.log('TimelineActivity mounted')
    console.log('User:', user)
    console.log('Loading:', loading)
    
    // Simular carga de datos
    const loadData = async () => {
      try {
        // Load sample notes
        const sampleNotes: TimelineNote[] = [
          {
            id: '1',
            title: 'Mi primer día de escuela',
            content: 'Conocí a muchos amigos nuevos y mi maestra es muy amable.',
            date: '2024-01-15',
            emoji: '🎒',
            color: 'bg-blue-200 border-blue-400',
            position: { x: 50, y: 100 }
          },
          {
            id: '2',
            title: 'Cumpleaños de mamá',
            content: 'Le hicimos una torta de chocolate y cantamos las mañanitas.',
            date: '2024-02-10',
            emoji: '🎂',
            color: 'bg-pink-200 border-pink-400',
            position: { x: 200, y: 150 }
          },
          {
            id: '3',
            title: 'Vacaciones de verano',
            content: 'Vamos a ir a la playa y construir castillos de arena.',
            date: '2024-07-15',
            emoji: '🏖️',
            color: 'bg-yellow-200 border-yellow-400',
            position: { x: 100, y: 120 }
          }
        ]
        setNotes(sampleNotes)
        console.log('Notes loaded:', sampleNotes)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [user, loading])

  // Mostrar loading mientras se cargan los datos
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

  const handleCreateNote = () => {
    const note: TimelineNote = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      date: newNote.date,
      emoji: newNote.emoji,
      color: newNote.color,
      position: { x: Math.random() * 300 + 50, y: Math.random() * 200 + 100 }
    }
    
    setNotes([...notes, note])
    setNewNote({
      title: '',
      content: '',
      date: new Date().toISOString().split('T')[0],
      emoji: '😊',
      color: colorOptions[0],
      section: 'present'
    })
    setIsCreating(false)
  }

  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    setDraggedNote(noteId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault()
    if (!draggedNote) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setNotes(notes.map(note => 
      note.id === draggedNote 
        ? { ...note, position: { x: Math.max(0, x - 100), y: Math.max(0, y - 50) } }
        : note
    ))
    setDraggedNote(null)
  }

  const getSectionNotes = (sectionId: string) => {
    const today = new Date()
    const noteDate = (note: TimelineNote) => new Date(note.date)
    
    return notes.filter(note => {
      const date = noteDate(note)
      if (sectionId === 'past') return date < today
      if (sectionId === 'present') {
        const diffTime = Math.abs(today.getTime() - date.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays <= 7
      }
      if (sectionId === 'future') return date > today
      return false
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400">
      {/* Header */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
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
            <button
              onClick={() => setIsCreating(true)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-all"
            >
              <Plus size={20} />
              Nueva Nota
            </button>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Debug Info */}
        <div className="mb-4 text-white text-sm opacity-70">
          Usuario: {user?.email || 'No autenticado'} | Notas: {notes.length}
        </div>

        {/* Timeline Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {timelineSections.map((section) => {
            const IconComponent = section.icon
            const sectionNotes = getSectionNotes(section.id)
            
            return (
              <div
                key={section.id}
                className="bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-6 min-h-96"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, section.id)}
              >
                {/* Section Header */}
                <div className={`bg-gradient-to-r ${section.color} rounded-2xl p-4 mb-6`}>
                  <div className="flex items-center gap-3 text-white">
                    <IconComponent size={24} />
                    <h2 className="text-xl font-bold" style={{ fontFamily: 'Fredoka' }}>
                      {section.title}
                    </h2>
                  </div>
                </div>

                {/* Notes Container */}
                <div className="relative min-h-64">
                  {sectionNotes.length === 0 ? (
                    <div className="text-center text-white text-opacity-70 mt-8">
                      <p style={{ fontFamily: 'Comic Neue' }}>
                        {section.id === 'present' && notes.length === 0 
                          ? 'Crea tu primera nota' 
                          : 'Arrastra tus notas aquí'
                        }
                      </p>
                    </div>
                  ) : (
                    sectionNotes.map((note) => (
                      <div
                        key={note.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, note.id)}
                        onClick={() => setSelectedNote(note)}
                        className={`absolute ${note.color} border-2 rounded-lg p-3 cursor-move hover:shadow-lg transition-all transform hover:scale-105 max-w-48`}
                        style={{
                          left: note.position.x,
                          top: note.position.y
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{note.emoji}</span>
                          <span className="font-bold text-sm" style={{ fontFamily: 'Fredoka' }}>
                            {note.title}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 mb-2" style={{ fontFamily: 'Comic Neue' }}>
                          {note.content.substring(0, 50)}...
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar size={12} />
                          {new Date(note.date).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Create Note Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <h3 className="text-2xl font-bold text-gray-800 mb-6" style={{ fontFamily: 'Fredoka' }}>
              Nueva Nota
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="¿Qué pasó?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 h-24"
                  placeholder="Cuéntanos más detalles..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={newNote.date}
                  onChange={(e) => setNewNote({ ...newNote, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emoji
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setNewNote({ ...newNote, emoji })}
                      className={`p-2 rounded-lg border-2 ${
                        newNote.emoji === emoji ? 'border-purple-500 bg-purple-100' : 'border-gray-300'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewNote({ ...newNote, color })}
                      className={`h-8 rounded-lg border-2 ${color} ${
                        newNote.color === color ? 'ring-2 ring-purple-500' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNote}
                disabled={!newNote.title || !newNote.content}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
              >
                Crear Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Detail Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{selectedNote.emoji}</span>
              <h3 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Fredoka' }}>
                {selectedNote.title}
              </h3>
            </div>
            
            <p className="text-gray-700 mb-4" style={{ fontFamily: 'Comic Neue' }}>
              {selectedNote.content}
            </p>
            
            <div className="flex items-center gap-2 text-gray-600 mb-6">
              <Calendar size={16} />
              {new Date(selectedNote.date).toLocaleDateString()}
            </div>

            <button
              onClick={() => setSelectedNote(null)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimelineActivity
