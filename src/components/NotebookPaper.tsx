import React from 'react'

interface NotebookPaperProps {
  children: React.ReactNode
  className?: string
}

const NotebookPaper: React.FC<NotebookPaperProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative bg-white ${className}`}>
      {/* Líneas de la libreta */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 30 }, (_, i) => (
          <div
            key={i}
            className="absolute w-full border-b border-blue-200"
            style={{
              top: `${(i + 1) * 40}px`,
              opacity: 0.3
            }}
          />
        ))}
      </div>

      {/* Margen izquierdo */}
      <div className="absolute left-0 top-0 bottom-0 w-16 border-r-2 border-red-300 opacity-30 pointer-events-none" />

      {/* Agujeros de la libreta */}
      <div className="absolute left-8 top-0 bottom-0 pointer-events-none">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="absolute w-4 h-4 bg-white border-2 border-gray-300 rounded-full"
            style={{
              top: `${50 + i * 150}px`,
              left: '-8px'
            }}
          />
        ))}
      </div>

      {/* Contenido */}
      <div className="relative z-10 p-8 pl-20">
        {children}
      </div>
    </div>
  )
}

export default NotebookPaper