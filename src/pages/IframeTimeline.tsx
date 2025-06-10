import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Clock, 
  Calendar,
  Star,
  Sparkles,
  X
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

const IframeTimeline = () => {
  const [notes, setNotes] = useState<TimelineNote[]>([])
  const [selectedNote, setSelectedNote] = useState<TimelineNote | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [draggedNote, setDraggedNote] = useState<string | null>(null)

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
    // Load sample notes for iframe demo
    const sampleNotes: TimelineNote[] = [
      {
        id: '1',
        title: 'Mi primer día de escuela',
        content: 'Conocí a muchos amigos nuevos y mi maestra es muy amable. Fue un día increíble lleno de nuevas experiencias.',
        date: '2024-01-15',
        emoji: '🎒',
        color: 'bg-blue-200 border-blue-400',
        position: { x: 50, y: 100 }
      },
      {
        id: '2',
        title: 'Cumpleaños de mamá',
        content: 'Le hicimos una torta de chocolate y cantamos las mañanitas. Toda la familia se reunió para celebrar.',
        date: '2024-02-10',
        emoji: '🎂',
        color: 'bg-pink-200 border-pink-400',
        position: { x: 200, y: 150 }
      },
      {
        id: '3',
        title: 'Graduación',
        content: 'Finalmente me gradué de la universidad. Fue un momento muy emotivo con toda mi familia presente.',
        date: '2024-12-15',
        emoji: '🎓',
        color: 'bg-purple-200 border-purple-400',
        position: { x: 100, y: 80 }
      },
      {
        id: '4',
        title: 'Viaje a la playa',
        content: 'Unas vacaciones increíbles en la costa. El mar estaba perfecto y disfrutamos mucho en familia.',
        date: '2024-03-20',
        emoji: '🏖️',
        color: 'bg-yellow-200 border-yellow-400',
        position: { x: 150, y: 200 }
      }
    ]
    setNotes(sampleNotes)

    // Optimize for iframe
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  const handleCreateNote = () => {
    const note: TimelineNote = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      date: newNote.date,
      emoji: newNote.emoji,
      color: newNote.color,
      position: { x: Math.random() * 200 + 50, y: Math.random() * 150 + 100 }
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
        return diffDays <= 30 // Extended to 30 days for better demo
      }
      if (sectionId === 'future') return date > today
      return false
    })
  }

  const deleteNote = (noteId: string) => {
    setNotes(notes.filter(note => note.id !== noteId))
    setSelectedNote(null)
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 overflow-hidden">
      {/* Compact Header for iframe */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Clock size={24} className="text-white" />
            <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              Mi Línea del Tiempo
            </h1>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded-full flex items-center gap-1 transition-all text-sm"
          >
            <Plus size={16} />
            Nueva Nota
          </button>
        </div>
      </div>

      {/* Main Content - Optimized for iframe */}
      <div className="h-full px-4 py-4 overflow-auto">
        {/* Timeline Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {timelineSections.map((section) => {
            const IconComponent = section.icon
            const sectionNotes = getSectionNotes(section.id)
            
            return (
              <div
                key={section.id}
                className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-4 min-h-80"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, section.id)}
              >
                {/* Section Header */}
                <div className={`bg-gradient-to-r ${section.color} rounded-xl p-3 mb-4`}>
                  <div className="flex items-center gap-2 text-white">
                    <IconComponent size={20} />
                    <h2 className="text-lg font-bold" style={{ fontFamily: 'Fredoka' }}>
                      {section.title}
                    </h2>
                  </div>
                </div>

                {/* Notes Container */}
                <div className="relative min-h-48">
                  {sectionNotes.length === 0 ? (
                    <div className="text-center text-white text-opacity-70 mt-6">
                      <p className="text-sm" style={{ fontFamily: 'Comic Neue' }}>
                        Arrastra tus notas aquí
                      </p>
                    </div>
                  ) : (
                    sectionNotes.map((note) => (
                      <div
                        key={note.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, note.id)}
                        onClick={() => setSelectedNote(note)}
                        className={`absolute ${note.color} border-2 rounded-lg p-2 cursor-move hover:shadow-lg transition-all transform hover:scale-105 max-w-40`}
                        style={{
                          left: Math.min(note.position.x, 200),
                          top: Math.min(note.position.y, 150)
                        }}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-sm">{note.emoji}</span>
                          <span className="font-bold text-xs" style={{ fontFamily: 'Fredoka' }}>
                            {note.title.substring(0, 15)}...
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 mb-1" style={{ fontFamily: 'Comic Neue' }}>
                          {note.content.substring(0, 30)}...
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Calendar size={10} />
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Fredoka' }}>
                Nueva Nota
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                  placeholder="¿Qué pasó?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenido
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 h-20 text-sm"
                  placeholder="Cuéntanos más detalles..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={newNote.date}
                  onChange={(e) => setNewNote({ ...newNote, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emoji
                </label>
                <div className="grid grid-cols-6 gap-1">
                  {emojiOptions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setNewNote({ ...newNote, emoji })}
                      className={`p-1 rounded border ${
                        newNote.emoji === emoji ? 'border-purple-500 bg-purple-100' : 'border-gray-300'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewNote({ ...newNote, color })}
                      className={`h-6 rounded border ${color} ${
                        newNote.color === color ? 'ring-2 ring-purple-500' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNote}
                disabled={!newNote.title || !newNote.content}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-sm"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Note Detail Modal */}
      {selectedNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedNote.emoji}</span>
                <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: 'Fredoka' }}>
                  {selectedNote.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNote(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-gray-700 mb-4 text-sm" style={{ fontFamily: 'Comic Neue' }}>
              {selectedNote.content}
            </p>
            
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <Calendar size={14} />
              <span className="text-sm">{new Date(selectedNote.date).toLocaleDateString()}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedNote(null)}
                className="flex-1 bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 text-sm"
              >
                Cerrar
              </button>
              <button
                onClick={() => deleteNote(selectedNote.id)}
                className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 text-sm"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default IframeTimeline
