import React from 'react'
import Draggable from 'react-draggable'
import { Edit, Trash2 } from 'lucide-react'
import { TimelineNote } from '../lib/supabase'

interface DraggableNoteProps {
  note: TimelineNote
  onEdit: (note: TimelineNote) => void
  onDelete: (id: string) => void
  onDrag: (id: string, x: number, y: number) => void
}

export default function DraggableNote({ note, onEdit, onDelete, onDrag }: DraggableNoteProps) {
  const handleDrag = (e: any, data: any) => {
    if (note.id) {
      onDrag(note.id, data.x, data.y)
    }
  }

  return (
    <Draggable
      defaultPosition={{ x: note.position_x, y: note.position_y }}
      onStop={handleDrag}
      handle=".drag-handle"
    >
      <div
        className={`absolute cursor-move shadow-lg border-3 border-purple-300 hover:border-purple-500 transition-all group hover:scale-105 ${note.shape} max-w-xs`}
        style={{ backgroundColor: note.color, fontFamily: note.font }}
      >
        <div className="drag-handle p-4">
          <div className="flex items-start gap-2">
            <span className="text-2xl flex-shrink-0">{note.emoji}</span>
            <p className="text-lg font-medium leading-tight break-words">{note.text}</p>
          </div>
        </div>
        
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={() => onEdit(note)}
            className="bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 transition-colors"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => note.id && onDelete(note.id)}
            className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </Draggable>
  )
}
