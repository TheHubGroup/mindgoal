import React from 'react'
import Draggable from 'react-draggable'
import { Edit, Trash2 } from 'lucide-react'
import { TimelineNote } from '../lib/timelineService'

interface DraggableTimelineNoteProps {
  note: TimelineNote
  onEdit: (note: TimelineNote) => void
  onDelete: (id: string) => void
  onDrag: (id: string, x: number, y: number) => void
}

export default function DraggableTimelineNote({ note, onEdit, onDelete, onDrag }: DraggableTimelineNoteProps) {
  const handleDrag = (e: any, data: any) => {
    if (note.id) {
      // Limitar el arrastre dentro de los límites del contenedor
      const boundedX = Math.max(0, Math.min(data.x, 250))
      const boundedY = Math.max(0, Math.min(data.y, 200))
      onDrag(note.id, boundedX, boundedY)
    }
  }

  return (
    <Draggable
      defaultPosition={{ x: note.position_x, y: note.position_y }}
      onStop={handleDrag}
      handle=".drag-handle"
      bounds={{ left: 0, top: 0, right: 250, bottom: 200 }}
    >
      <div
        className={`absolute cursor-move shadow-lg border-2 border-purple-300 hover:border-purple-500 transition-all group hover:scale-105 ${note.shape} max-w-[180px]`}
        style={{ backgroundColor: note.color, fontFamily: note.font }}
      >
        <div className="drag-handle p-3">
          <div className="flex items-start gap-2">
            <span className="text-lg flex-shrink-0">{note.emoji}</span>
            <p className="text-sm font-medium leading-tight break-words">{note.text}</p>
          </div>
        </div>
        
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={() => onEdit(note)}
            className="bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 transition-colors shadow-sm"
          >
            <Edit size={12} />
          </button>
          <button
            onClick={() => note.id && onDelete(note.id)}
            className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-sm"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </Draggable>
  )
}