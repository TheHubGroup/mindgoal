import React, { useState } from 'react'
import { X, Palette, Type, Smile, Eye } from 'lucide-react'
import EmojiPicker from './EmojiPicker'
import { TimelineNote } from '../lib/supabase'

interface NoteEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (note: Omit<TimelineNote, 'id' | 'created_at'>) => void
  section: 'pasado' | 'presente' | 'futuro'
  editingNote?: TimelineNote | null
}

const colors = [
  '#FFE4E1', '#FFB6C1', '#FFA07A', '#FFD700', '#98FB98',
  '#87CEEB', '#DDA0DD', '#F0E68C', '#FFC0CB', '#E0E0E0'
]

const shapes = [
  'rounded-lg', 'rounded-full', 'rounded-3xl', 'rounded-none'
]

const fonts = [
  'Fredoka', 'Comic Neue', 'Bubblegum Sans'
]

export default function NoteEditor({ isOpen, onClose, onSave, section, editingNote }: NoteEditorProps) {
  const [text, setText] = useState(editingNote?.text || '')
  const [emoji, setEmoji] = useState(editingNote?.emoji || '😊')
  const [color, setColor] = useState(editingNote?.color || colors[0])
  const [shape, setShape] = useState(editingNote?.shape || shapes[0])
  const [font, setFont] = useState(editingNote?.font || fonts[0])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handleSave = () => {
    if (text.trim()) {
      onSave({
        text: text.trim(),
        emoji,
        color,
        shape,
        font,
        section,
        position_x: editingNote?.position_x || Math.random() * 300,
        position_y: editingNote?.position_y || Math.random() * 200
      })
      setText('')
      setEmoji('😊')
      setColor(colors[0])
      setShape(shapes[0])
      setFont(fonts[0])
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto border-4 border-purple-300 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-gray-500 hover:text-gray-700 transition-colors bg-white rounded-full p-1 shadow-md"
        >
          <X size={20} />
        </button>

        <div className="p-4 sm:p-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-purple-600 mb-6 text-center pr-8" style={{ fontFamily: 'Fredoka' }}>
            {editingNote ? 'Editar Nota' : 'Crear Nueva Nota'}
          </h2>

          {/* Vista previa prominente - SIEMPRE VISIBLE */}
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl border-3 border-purple-200">
            <div className="flex items-center gap-3 mb-3">
              <Eye className="text-purple-600" size={24} />
              <h3 className="text-xl font-bold text-purple-700" style={{ fontFamily: 'Fredoka' }}>
                ¡Así se verá tu nota!
              </h3>
            </div>
            <div className="flex justify-center">
              <div
                className={`p-4 shadow-lg border-2 border-gray-300 min-w-[200px] max-w-[300px] ${shape}`}
                style={{ backgroundColor: color, fontFamily: font }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-base font-medium text-gray-800">
                    {text || 'Escribe algo para ver la vista previa...'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Layout Horizontal en pantallas grandes, vertical en móviles */}
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Columna Izquierda - Texto y Emoji */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Fredoka' }}>
                  Escribe tu mensaje:
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="¿Qué quieres recordar?"
                  className="w-full p-3 border-3 border-purple-200 rounded-xl resize-none focus:border-purple-400 focus:outline-none text-base"
                  rows={4}
                  style={{ fontFamily: font }}
                />
              </div>

              <div className="relative">
                <label className="block text-lg font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Fredoka' }}>
                  <Smile className="inline mr-2" size={18} />
                  Emoji:
                </label>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-4xl p-3 border-3 border-purple-200 rounded-xl hover:border-purple-400 transition-colors bg-gray-50 hover:bg-purple-50"
                >
                  {emoji}
                </button>
                <EmojiPicker
                  isOpen={showEmojiPicker}
                  onClose={() => setShowEmojiPicker(false)}
                  onEmojiSelect={setEmoji}
                />
              </div>
            </div>

            {/* Columna Derecha - Personalización */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Fredoka' }}>
                  <Type className="inline mr-2" size={18} />
                  Fuente:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {fonts.map((fontOption) => (
                    <button
                      key={fontOption}
                      onClick={() => setFont(fontOption)}
                      className={`p-3 rounded-lg border-2 transition-all text-base ${
                        font === fontOption
                          ? 'border-purple-500 bg-purple-100'
                          : 'border-purple-200 hover:border-purple-400'
                      }`}
                      style={{ fontFamily: fontOption }}
                    >
                      Abc
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Fredoka' }}>
                  <Palette className="inline mr-2" size={18} />
                  Color:
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {colors.map((colorOption) => (
                    <button
                      key={colorOption}
                      onClick={() => setColor(colorOption)}
                      className={`w-12 h-12 rounded-lg border-3 transition-all hover:scale-110 ${
                        color === colorOption ? 'border-purple-500 ring-2 ring-purple-300' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: colorOption }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Fredoka' }}>
                  Forma:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {shapes.map((shapeOption, index) => (
                    <button
                      key={shapeOption}
                      onClick={() => setShape(shapeOption)}
                      className={`p-4 border-2 transition-all ${shapeOption} ${
                        shape === shapeOption
                          ? 'border-purple-500 bg-purple-100'
                          : 'border-purple-200 hover:border-purple-400'
                      }`}
                    >
                      <div className={`w-6 h-6 bg-purple-400 mx-auto ${shapeOption}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Botón de guardar */}
          <div className="mt-6 pt-4 border-t border-purple-200">
            <button
              onClick={handleSave}
              disabled={!text.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 rounded-xl text-xl hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg"
              style={{ fontFamily: 'Fredoka' }}
            >
              {editingNote ? 'Guardar Cambios' : 'Crear Nota'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
