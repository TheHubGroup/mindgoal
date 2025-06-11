import React from 'react'
import { useNavigate } from 'react-router-dom'
import { User, LogIn, UserPlus, Sparkles } from 'lucide-react'

interface LoginUserBarProps {
  className?: string
}

const LoginUserBar: React.FC<LoginUserBarProps> = ({ className = '' }) => {
  const navigate = useNavigate()

  const handleLogin = () => {
    navigate('/login')
  }

  const handleRegister = () => {
    navigate('/register')
  }

  return (
    <div className={`h-16 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-between px-4 ${className}`}>
      {/* Logo/Brand Section */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
          <Sparkles size={20} className="text-white" />
        </div>
        <div className="text-white">
          <div className="font-bold text-lg leading-tight" style={{ fontFamily: 'Fredoka' }}>
            Plataforma Educativa
          </div>
          <div className="text-xs opacity-80" style={{ fontFamily: 'Comic Neue' }}>
            ¡Aprende y diviértete!
          </div>
        </div>
      </div>

      {/* Login Actions Section */}
      <div className="flex items-center gap-3">
        {/* Mensaje de bienvenida */}
        <div className="text-white text-center mr-4 hidden sm:block">
          <div className="text-sm font-medium" style={{ fontFamily: 'Fredoka' }}>
            ¡Bienvenido!
          </div>
          <div className="text-xs opacity-80" style={{ fontFamily: 'Comic Neue' }}>
            Inicia sesión para continuar
          </div>
        </div>

        {/* Botón Iniciar Sesión */}
        <button
          onClick={handleLogin}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 transition-all transform hover:scale-105 border border-white border-opacity-30"
        >
          <LogIn size={18} className="text-white" />
          <span className="text-white font-medium text-sm" style={{ fontFamily: 'Fredoka' }}>
            Iniciar Sesión
          </span>
        </button>

        {/* Botón Registrarse */}
        <button
          onClick={handleRegister}
          className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 rounded-full px-4 py-2 flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg"
        >
          <UserPlus size={18} className="text-white" />
          <span className="text-white font-bold text-sm" style={{ fontFamily: 'Fredoka' }}>
            Registrarse
          </span>
        </button>
      </div>
    </div>
  )
}

export default LoginUserBar