import React from 'react'
import { Eye } from 'lucide-react'

interface EmotionImageCardProps {
  emotion: {
    name: string
    emoji: string
    imageUrl: string
    explanation: string
  }
  onDragStart: (emotionName: string) => void
  onImageClick: (emotion: any) => void
  isMatched: boolean
  className?: string
}

const EmotionImageCard: React.FC<EmotionImageCardProps> = ({
  emotion,
  onDragStart,
  onImageClick,
  isMatched,
  className = ''
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', emotion.name)
    onDragStart(emotion.name)
  }

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('Image clicked:', emotion.name) // Debug log
    onImageClick(emotion)
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
      <div className="relative w-full h-20 mb-2 rounded-lg overflow-hidden bg-gray-100 group">
        <img
          src={emotion.imageUrl}
          alt={`Niño/a mostrando ${emotion.name}`}
          className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-110"
          onClick={handleImageClick}
          draggable={false}
          onError={(e) => {
            // Fallback en caso de error de imagen
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full flex items-center justify-center text-4xl cursor-pointer bg-gray-200 rounded-lg" 
                     onclick="this.parentElement.parentElement.parentElement.querySelector('img').click()">
                  ${emotion.emoji}
                </div>
              `
            }
          }}
        />
        
        {/* Overlay para indicar que se puede hacer click */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center cursor-pointer"
          onClick={handleImageClick}
        >
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 rounded-full p-2">
            <Eye size={16} className="text-gray-700" />
          </div>
        </div>
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