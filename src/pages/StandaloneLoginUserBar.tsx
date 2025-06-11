import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, LogIn } from 'lucide-react'

const StandaloneLoginUserBar = () => {
  const { user, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Optimizar para iframe
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.overflow = 'hidden'
    document.body.style.backgroundColor = 'transparent'

    return () => {
      document.body.style.overflow = 'auto'
      document.body.style.backgroundColor = ''
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError('Email o contraseña incorrectos')
      } else {
        // Notificar al padre que el login fue exitoso
        window.parent.postMessage({ type: 'LOGIN_SUCCESS' }, '*')
      }
    } catch (error) {
      setError('Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  // Si el usuario ya está autenticado, redirigir
  if (user) {
    window.parent.postMessage({ type: 'USER_ALREADY_LOGGED_IN' }, '*')
    return (
      <div className="h-16 bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center px-4">
        <span className="text-white font-medium" style={{ fontFamily: 'Fredoka' }}>
          ¡Ya estás conectado!
        </span>
      </div>
    )
  }

  return (
    <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center px-4">
      <form onSubmit={handleLogin} className="flex items-center gap-3 w-full max-w-md">
        {/* Campo Email */}
        <div className="flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full px-3 py-2 rounded-lg border-0 bg-white bg-opacity-90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:bg-opacity-100 text-sm"
          />
        </div>

        {/* Campo Contraseña */}
        <div className="flex-1 relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            className="w-full px-3 py-2 pr-10 rounded-lg border-0 bg-white bg-opacity-90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:bg-opacity-100 text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Botón Login */}
        <button
          type="submit"
          disabled={isLoading || !email || !password}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white border-opacity-30"
        >
          <LogIn size={16} className="text-white" />
          <span className="text-white font-medium text-sm" style={{ fontFamily: 'Fredoka' }}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </span>
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-4 right-4 mt-1 bg-red-500 bg-opacity-90 text-white text-xs px-3 py-1 rounded">
          {error}
        </div>
      )}
    </div>
  )
}

export default StandaloneLoginUserBar