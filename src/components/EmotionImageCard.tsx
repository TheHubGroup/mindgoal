import React from 'react'

interface EmotionImageCardProps {
  emotion: {
    name: string
    emoji: string
    imageUrl: string
    explanation: string
  }
  onDragStart: (emotionName: string) => void
  isMatched: boolean
  className?: string
}

const EmotionImageCard: React.FC<EmotionImageCardProps> = ({
  emotion,
  onDragStart,
  isMatched,
  className = ''
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', emotion.name)
    onDragStart(emotion.name)
  }

  return (
    <div
      draggable={!isMatched}
      onDragStart={handleDragStart}
      className={`
        relative bg-white rounded-2xl shadow-lg border-4 border-purple-300 p-4 
        transition-all duration-300 transform hover:scale-105 cursor-move
        ${isMatched ? 'opacity-50 cursor-not-allowed border-green-500 bg-green-50' : 'hover:shadow-xl hover:border-purple-500'}
        ${className}
      `}
      style={{ width: '140px', height: '140px' }}
    >
      {/* Imagen de la emoción */}
      <div className="w-full h-20 mb-2 rounded-lg overflow-hidden bg-gray-100">
        <img
          src={emotion.imageUrl}
          alt={`Niño/a mostrando ${emotion.name}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback en caso de error de imagen
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              parent.innerHTML = `<div class="w-full h-full flex items-center justify-center text-4xl">${emotion.emoji}</div>`
            }
          }}
        />
      </div>

      {/* Emoji de la emoción */}
      <div className="text-center">
        <div className="text-3xl mb-1">{emotion.emoji}</div>
        <div className="text-xs font-bold text-gray-600 leading-tight" style={{ fontFamily: 'Fredoka' }}>
          {isMatched ? '¡Correcto!' : 'Arrastra'}
        </div>
      </div>

      {/* Indicador de completado */}
      {isMatched && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
          <span className="text-white text-lg">✓</span>
        </div>
      )}
    </div>
  )
}

export default EmotionImageCard