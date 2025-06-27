import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, Sparkles, Eye, EyeOff, LogIn, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const LoginPage = () => {
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!emailOrUsername.trim() || !password) {
      setError('Por favor, completa todos los campos')
      return
    }

    setIsLoading(true)

    try {
      const { error } = await signIn(emailOrUsername.trim(), password)

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Email/usuario o contraseña incorrectos')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Por favor, confirma tu email antes de iniciar sesión')
        } else if (error.message.includes('Usuario no encontrado')) {
          setError('Usuario no encontrado')
        } else {
          setError(error.message || 'Error al iniciar sesión')
        }
        return
      }

      // Redirect to home
      navigate('/')
      
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles size={40} className="text-blue-500" />
            <Clock size={40} className="text-purple-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Fredoka' }}>
            ¡Bienvenido de Vuelta!
          </h1>
          <p className="text-gray-600" style={{ fontFamily: 'Comic Neue' }}>
            Inicia sesión para continuar aprendiendo
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              <div className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle size={16} />
                Error de Inicio de Sesión:
              </div>
              <div className="text-sm">{error}</div>
            </div>
          )}

          <div>
            <label htmlFor="emailOrUsername" className="block text-sm font-medium text-gray-700 mb-2">
              📧 Correo Electrónico o Nombre de Usuario
            </label>
            <input
              type="text"
              id="emailOrUsername"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="tu@email.com o tu nombre de usuario"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              🔒 Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Tu contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ fontFamily: 'Fredoka' }}
          >
            <LogIn size={20} />
            {isLoading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600" style={{ fontFamily: 'Comic Neue' }}>
            ¿No tienes cuenta?{' '}
            <Link 
              to="/register" 
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>

        {/* Fun Elements */}
        <div className="mt-8 text-center">
          <div className="flex justify-center gap-4 text-4xl">
            <span className="animate-pulse">🎯</span>
            <span className="animate-pulse" style={{ animationDelay: '0.1s' }}>🎪</span>
            <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>🎭</span>
            <span className="animate-pulse" style={{ animationDelay: '0.3s' }}>🎨</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage