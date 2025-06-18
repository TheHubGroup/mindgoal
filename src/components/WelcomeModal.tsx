import React, { useEffect, useState } from 'react'
import { Sparkles, Heart, Star, X } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'

interface WelcomeModalProps {
  isOpen: boolean
  onClose: () => void
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useProfile()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Pequeño delay para la animación de entrada
      setTimeout(() => setShowContent(true), 100)
    } else {
      setShowContent(false)
    }
  }, [isOpen])

  const getDisplayName = () => {
    if (profile?.nombre) {
      return profile.nombre
    }
    return 'Estudiante'
  }

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Evitar que se propague
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Overlay con efecto de desenfoque */}
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-500 ${
          showContent ? 'bg-opacity-60' : 'bg-opacity-0'
        }`}
        style={{ backdropFilter: 'blur(8px)' }}
      />
      
      {/* Modal Content */}
      <div 
        className={`relative w-full max-w-4xl h-[80vh] bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-3xl shadow-2xl transform transition-all duration-700 ${
          showContent ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Botón X para cerrar - VISIBLE y destacado */}
        <button
          onClick={handleCloseClick}
          className={`absolute top-6 right-6 z-10 bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 transform hover:scale-110 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ 
            animationDelay: '0.8s',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}
        >
          <X size={24} className="text-white drop-shadow-lg" />
        </button>

        {/* Efectos de fondo animados */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {/* Círculos flotantes */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-white bg-opacity-10 rounded-full animate-pulse" />
          <div className="absolute top-32 right-20 w-16 h-16 bg-yellow-300 bg-opacity-20 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-pink-300 bg-opacity-15 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-32 right-16 w-12 h-12 bg-blue-300 bg-opacity-20 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }} />
          
          {/* Estrellas brillantes */}
          <div className="absolute top-20 left-1/4 text-yellow-300 animate-pulse">
            <Star size={16} fill="currentColor" />
          </div>
          <div className="absolute top-40 right-1/3 text-white animate-pulse" style={{ animationDelay: '0.7s' }}>
            <Sparkles size={20} />
          </div>
          <div className="absolute bottom-40 left-1/3 text-pink-300 animate-pulse" style={{ animationDelay: '1.2s' }}>
            <Heart size={18} fill="currentColor" />
          </div>
          <div className="absolute bottom-24 right-1/4 text-blue-300 animate-pulse" style={{ animationDelay: '0.3s' }}>
            <Star size={14} fill="currentColor" />
          </div>
        </div>

        {/* Contenido principal */}
        <div className="relative h-full flex flex-col items-center justify-center text-center px-8 py-12 pointer-events-none">
          {/* Emoji de saludo animado */}
          <div className="mb-8 text-8xl animate-bounce">
            👋
          </div>

          {/* Mensaje principal */}
          <div className="space-y-6 max-w-2xl">
            <h1 
              className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight transform transition-all duration-1000 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ 
                fontFamily: 'Fredoka',
                textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                animationDelay: '0.2s'
              }}
            >
              ¡Hola, {getDisplayName()}!
            </h1>

            <div 
              className={`text-xl md:text-2xl lg:text-3xl text-white text-opacity-95 leading-relaxed transform transition-all duration-1000 ${
                showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
              }`}
              style={{ 
                fontFamily: 'Comic Neue',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                animationDelay: '0.4s'
              }}
            >
              Bienvenido a <span className="font-bold text-yellow-300">Mind Goal</span>. 
              <br />
              <span className="text-lg md:text-xl lg:text-2xl text-yellow-200 font-semibold animate-pulse">
                Para continuar haz clic en la X
              </span>
            </div>
          </div>

          {/* Elementos decorativos adicionales */}
          <div className="mt-12 flex justify-center space-x-8">
            <div className="animate-pulse">
              <div className="w-4 h-4 bg-yellow-300 rounded-full" />
            </div>
            <div className="animate-pulse" style={{ animationDelay: '0.2s' }}>
              <div className="w-4 h-4 bg-pink-300 rounded-full" />
            </div>
            <div className="animate-pulse" style={{ animationDelay: '0.4s' }}>
              <div className="w-4 h-4 bg-blue-300 rounded-full" />
            </div>
            <div className="animate-pulse" style={{ animationDelay: '0.6s' }}>
              <div className="w-4 h-4 bg-green-300 rounded-full" />
            </div>
            <div className="animate-pulse" style={{ animationDelay: '0.8s' }}>
              <div className="w-4 h-4 bg-purple-300 rounded-full" />
            </div>
          </div>

          {/* Mensaje adicional sutil */}
          <div 
            className={`mt-8 text-white text-opacity-80 text-sm md:text-base transform transition-all duration-1000 ${
              showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
            style={{ 
              fontFamily: 'Comic Neue',
              animationDelay: '0.6s'
            }}
          >
            ✨ Explora actividades increíbles diseñadas especialmente para ti ✨
          </div>

          {/* Flecha apuntando hacia la X */}
          <div 
            className={`absolute top-8 right-20 text-white text-opacity-80 transform transition-all duration-1000 animate-bounce ${
              showContent ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
            }`}
            style={{ 
              fontFamily: 'Comic Neue',
              animationDelay: '1.2s'
            }}
          >
            <div className="flex flex-col items-center">
              <span className="text-2xl">👆</span>
              <span className="text-xs mt-1 font-semibold">¡Aquí!</span>
            </div>
          </div>
        </div>

        {/* Efecto de brillo en los bordes */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white to-transparent opacity-10 transform -skew-x-12 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default WelcomeModal