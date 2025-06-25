import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Clock, Sparkles, Eye, EyeOff, UserPlus, Camera, User, School, MapPin, Calendar, Users, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const RegisterPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Profile data fields
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [grado, setGrado] = useState('')
  const [nombreColegio, setNombreColegio] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [pais, setPais] = useState('Venezuela')
  const [edad, setEdad] = useState<number | ''>('')
  const [sexo, setSexo] = useState('')
  
  // Avatar upload
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen debe ser menor a 5MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen')
        return
      }

      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    // Validate required profile fields
    if (!nombre.trim()) {
      setError('El nombre es requerido')
      return
    }

    if (!apellido.trim()) {
      setError('El apellido es requerido')
      return
    }

    if (!grado) {
      setError('El grado es requerido')
      return
    }

    if (!nombreColegio.trim()) {
      setError('El nombre del colegio es requerido')
      return
    }

    if (!ciudad.trim()) {
      setError('La ciudad es requerida')
      return
    }

    if (!pais) {
      setError('El país es requerido')
      return
    }

    if (!edad || edad < 5 || edad > 25) {
      setError('La edad debe estar entre 5 y 25 años')
      return
    }

    if (!sexo) {
      setError('El sexo es requerido')
      return
    }

    setIsLoading(true)

    try {
      console.log('🎯 Iniciando proceso de registro...')
      
      // Prepare profile data
      const profileData = {
        first_name: nombre.trim(),
        last_name: apellido.trim(),
        grade: grado,
        school_name: nombreColegio.trim(),
        city: ciudad.trim(),
        country: pais,
        age: Number(edad),
        gender: sexo
      }

      console.log('📋 Datos del perfil:', profileData)

      // Sign up with simplified approach
      const { error: signUpError } = await signUp(
        email.trim().toLowerCase(), 
        password, 
        profileData
      )

      if (signUpError) {
        console.error('❌ Error en registro:', signUpError)
        
        // Mensajes de error más específicos
        if (signUpError.message?.includes('User already registered')) {
          setError('Este email ya está registrado. Intenta iniciar sesión.')
        } else if (signUpError.message?.includes('Invalid email')) {
          setError('El formato del email no es válido')
        } else if (signUpError.message?.includes('Password')) {
          setError('La contraseña no cumple con los requisitos')
        } else {
          setError(signUpError.message || 'Error al crear la cuenta')
        }
        return
      }

      console.log('✅ Registro exitoso, redirigiendo...')
      
      // Success - redirect to home
      navigate('/')
      
    } catch (error: any) {
      console.error('❌ Error inesperado:', error)
      setError('Error inesperado. Por favor intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles size={40} className="text-blue-500" />
            <Clock size={40} className="text-purple-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Fredoka' }}>
            ¡Únete a Nosotros!
          </h1>
          <p className="text-gray-600" style={{ fontFamily: 'Comic Neue' }}>
            Completa tu información para comenzar a aprender
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              <div className="font-semibold mb-2 flex items-center gap-2">
                <AlertTriangle size={16} />
                Error de Registro:
              </div>
              <div className="text-sm">{error}</div>
            </div>
          )}

          {/* Avatar Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-white" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all transform hover:scale-110"
              >
                <Camera size={16} className="text-gray-600" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <p className="text-sm text-gray-600 text-center">
              Haz clic en la cámara para subir tu foto (opcional)
            </p>
          </div>

          {/* Email and Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                📧 Correo Electrónico *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                🔒 Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="Mínimo 6 caracteres"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                🔒 Confirmar Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                  placeholder="Repite tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-2" />
                Nombre *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="inline mr-2" />
                Apellido *
              </label>
              <input
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tu apellido"
              />
            </div>
          </div>

          {/* Academic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <School size={16} className="inline mr-2" />
                Grado *
              </label>
              <select
                value={grado}
                onChange={(e) => setGrado(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona tu grado</option>
                <option value="1°">1° Primaria</option>
                <option value="2°">2° Primaria</option>
                <option value="3°">3° Primaria</option>
                <option value="4°">4° Primaria</option>
                <option value="5°">5° Primaria</option>
                <option value="6°">6° Secundaria</option>
                <option value="7°">7° Secundaria</option>
                <option value="8°">8° Secundaria</option>
                <option value="9°">9° Secundaria</option>
                <option value="10°">10° Secundaria</option>
                <option value="11°">11° Secundaria</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <School size={16} className="inline mr-2" />
                Nombre del Colegio *
              </label>
              <input
                type="text"
                value={nombreColegio}
                onChange={(e) => setNombreColegio(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre de tu colegio"
              />
            </div>
          </div>

          {/* Location Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-2" />
                Ciudad *
              </label>
              <input
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tu ciudad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-2" />
                País *
              </label>
              <select
                value={pais}
                onChange={(e) => setPais(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Colombia">Colombia</option>
                <option value="México">México</option>
                <option value="Argentina">Argentina</option>
                <option value="Chile">Chile</option>
                <option value="Perú">Perú</option>
                <option value="Ecuador">Ecuador</option>
                <option value="Venezuela">Venezuela</option>
                <option value="España">España</option>
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          {/* Personal Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Edad *
              </label>
              <input
                type="number"
                value={edad}
                onChange={(e) => setEdad(e.target.value === '' ? '' : parseInt(e.target.value))}
                required
                min="5"
                max="25"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tu edad"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users size={16} className="inline mr-2" />
                Sexo *
              </label>
              <select
                value={sexo}
                onChange={(e) => setSexo(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona una opción</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
                <option value="Prefiero no decir">Prefiero no decir</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ fontFamily: 'Fredoka' }}
          >
            <UserPlus size={20} />
            {isLoading ? 'Creando Cuenta...' : 'Crear Cuenta'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600" style={{ fontFamily: 'Comic Neue' }}>
            ¿Ya tienes cuenta?{' '}
            <Link 
              to="/login" 
              className="text-blue-600 hover:text-blue-800 font-semibold"
            >
              Inicia sesión aquí
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

export default RegisterPage