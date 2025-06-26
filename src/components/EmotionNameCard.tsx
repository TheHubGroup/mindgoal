import React, { useState } from 'react'

interface EmotionNameCardProps {
  emotionName: string
  onDrop: (droppedEmotion: string, targetEmotion: string) => void
  isMatched: boolean
  className?: string
}

const EmotionNameCard: React.FC<EmotionNameCardProps> = ({
  emotionName,
  onDrop,
  isMatched,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!isMatched) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (!isMatched) {
      const droppedEmotion = e.dataTransfer.getData('text/plain')
      onDrop(droppedEmotion, emotionName)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative bg-white rounded-2xl shadow-lg border-4 p-6 
        transition-all duration-300 min-h-[120px] flex items-center justify-center
        ${isMatched 
          ? 'border-green-500 bg-green-50' 
          : isDragOver 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-purple-400'
        }
        ${className}
      `}
      style={{ width: '160px' }}
    >
      {/* Nombre de la emoción */}
      <div className="text-center">
        <h3 className="text-lg font-black text-gray-800 leading-tight" style={{ fontFamily: 'Fredoka' }}>
          {emotionName}
        </h3>
        
        {!isMatched && (
          <p className="text-xs text-gray-500 mt-2" style={{ fontFamily: 'Comic Neue' }}>
            {isDragOver ? '¡Suelta aquí!' : 'Arrastra la imagen'}
          </p>
        )}
      </div>

      {/* Indicador de completado */}
      {isMatched && (
        <div className="absolute -top-3 -right-3 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-3 border-white shadow-lg">
          <span className="text-white text-xl font-bold">✓</span>
        </div>
      )}

      {/* Efecto de arrastre */}
      {isDragOver && !isMatched && (
        <div className="absolute inset-0 bg-blue-200 bg-opacity-30 rounded-2xl border-4 border-dashed border-blue-500 flex items-center justify-center">
          <div className="text-blue-600 font-bold text-sm" style={{ fontFamily: 'Fredoka' }}>
            ¡Suelta aquí!
          </div>
        </div>
      )}
    </div>
  )
}

export default EmotionNameCard