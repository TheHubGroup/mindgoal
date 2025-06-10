import React from 'react'
import { Plus } from 'lucide-react'
import DraggableNote from './DraggableNote'
import { TimelineNote } from '../lib/supabase'

interface TimelineSectionProps {
  title: string
  section: 'pasado' | 'presente' | 'futuro'
  notes: TimelineNote[]
  onAddNote: (section: 'pasado' | 'presente' | 'futuro') => void
  onEditNote: (note: TimelineNote) => void
  onDeleteNote: (id: string) => void
  onDragNote: (id: string, x: number, y: number) => void
  bgColor: string
  icon: string
}

export default function TimelineSection({
  title,
  section,
  notes,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onDragNote,
  bgColor,
  icon
}: TimelineSectionProps) {
  return (
    <div className={`${bgColor} rounded-3xl p-6 shadow-xl border-4 border-white relative min-h-96 overflow-hidden`}>
      <div className="text-center mb-6">
        <div className="text-6xl mb-2">{icon}</div>
        <h2 className="text-3xl font-bold text-white drop-shadow-lg" style={{ fontFamily: 'Fredoka' }}>
          {title}
        </h2>
        <button
          onClick={() => onAddNote(section)}
          className="mt-4 bg-white bg-opacity-90 hover:bg-opacity-100 text-purple-600 font-bold py-3 px-6 rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto"
          style={{ fontFamily: 'Fredoka' }}
        >
          <Plus size={20} />
          Agregar Nota
        </button>
      </div>

      <div className="relative">
        {notes.map((note) => (
          <DraggableNote
            key={note.id}
            note={note}
            onEdit={onEditNote}
            onDelete={onDeleteNote}
            onDrag={onDragNote}
          />
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center text-white text-opacity-70 mt-8">
          <p className="text-lg" style={{ fontFamily: 'Fredoka' }}>
            ¡Arrastra y suelta tus notas aquí!
          </p>
        </div>
      )}
    </div>
  )
}
