import React from 'react'
import { Plus } from 'lucide-react'
import DraggableTimelineNote from './DraggableTimelineNote'
import { TimelineNote } from '../lib/timelineService'

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
    <div className={`${bgColor} rounded-3xl p-4 shadow-xl border-4 border-white relative min-h-96 overflow-hidden`}>
      <div className="text-center mb-4">
        <div className="text-4xl mb-1">{icon}</div>
        <h2 className="text-xl font-bold text-white drop-shadow-lg" style={{ fontFamily: 'Fredoka' }}>
          {title}
        </h2>
        <button
          onClick={() => onAddNote(section)}
          className="mt-3 bg-white bg-opacity-90 hover:bg-opacity-100 text-purple-600 font-bold py-2 px-4 rounded-full transition-all transform hover:scale-105 shadow-lg flex items-center gap-2 mx-auto text-sm"
          style={{ fontFamily: 'Fredoka' }}
        >
          <Plus size={16} />
          Agregar Nota
        </button>
      </div>

      <div className="relative min-h-64">
        {notes.map((note) => (
          <DraggableTimelineNote
            key={note.id}
            note={note}
            onEdit={onEditNote}
            onDelete={onDeleteNote}
            onDrag={onDragNote}
          />
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center text-white text-opacity-70 mt-6">
          <p className="text-base" style={{ fontFamily: 'Fredoka' }}>
            ¡Arrastra y suelta tus notas aquí!
          </p>
        </div>
      )}
    </div>
  )
}