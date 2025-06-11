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

    // Escuchar mensajes del padre
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'USER_LOGGED_OUT') {
        // El usuario se deslogueó desde otra barra, limpiar formulario
        setEmail('')
        setPassword('')
        setError('')
      }
    }

    window.addEventListener('message', handleMessage)

    return () => {
      document.body.style.overflow = 'auto'
      document.body.style.backgroundColor = ''
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  // Efecto para redirigir cuando el usuario se autentica
  useEffect(() => {
    if (user) {
      // Notificar al padre que el usuario se logueó
      window.parent.postMessage({ 
        type: 'USER_LOGGED_IN', 
        user: { 
          id: user.id, 
          email: user.email 
        } 
      }, '*')
      
      // Redirigir a la barra de usuario autenticado
      setTimeout(() => {
        window.location.href = '/standalone-user-bar'
      }, 100)
    }
  }, [user])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const { error } = await signIn(email.trim(), password)
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email o contraseña incorrectos')
        } else {
          setError('Error al iniciar sesión')
        }
      }
      // No necesitamos redirigir manualmente aquí, el useEffect se encarga
    } catch (error) {
      setError('Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center px-4 relative">
      {/* Login Form Centrado */}
      <form onSubmit={handleLogin} className="flex items-center gap-3">
        {/* Campo Email */}
        <div className="min-w-[160px]">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            disabled={isLoading}
            className="w-full px-4 py-2 rounded-lg border-0 bg-white bg-opacity-90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:bg-opacity-100 text-sm disabled:opacity-50 shadow-lg"
          />
        </div>

        {/* Campo Contraseña */}
        <div className="min-w-[140px] relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            disabled={isLoading}
            className="w-full px-4 py-2 pr-10 rounded-lg border-0 bg-white bg-opacity-90 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:bg-opacity-100 text-sm disabled:opacity-50 shadow-lg"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Botón Entrar */}
        <button
          type="submit"
          disabled={isLoading || !email.trim() || !password}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg px-6 py-2 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 min-w-[100px] justify-center"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <LogIn size={16} className="text-white" />
          )}
          <span className="text-white font-bold text-sm" style={{ fontFamily: 'Fredoka' }}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </span>
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-red-500 bg-opacity-95 text-white text-xs px-4 py-2 rounded-lg shadow-lg z-10 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default StandaloneLoginUserBar