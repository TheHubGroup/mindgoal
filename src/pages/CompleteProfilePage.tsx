import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { ProfileFormData } from '../types/profile'
import AvatarUpload from '../components/AvatarUpload'
import { Clock, Sparkles, Save, ArrowLeft } from 'lucide-react'

const CompleteProfilePage = () => {
  const { user } = useAuth()
  const { profile, updateProfile, uploadAvatar, loading: profileLoading } = useProfile()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState<ProfileFormData>({
    nombre: '',
    apellido: '',
    grado: '',
    nombre_colegio: '',
    ciudad: '',
    pais: 'Colombia',
    edad: '',
    sexo: ''
  })
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (profile) {
      setFormData({
        nombre: profile.nombre || '',
        apellido: profile.apellido || '',
        grado: profile.grado || '',
        nombre_colegio: profile.nombre_colegio || '',
        ciudad: profile.ciudad || '',
        pais: profile.pais || 'Colombia',
        edad: profile.edad || '',
        sexo: profile.sexo || ''
      })
    }
  }, [profile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'edad' ? (value === '' ? '' : parseInt(value)) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      let avatarUrl = profile?.avatar_url

      // Upload avatar if selected
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile)
        if (uploadedUrl) {
          avatarUrl = uploadedUrl
        }
      }

      // Update profile
      const success = await updateProfile({
        ...formData,
        edad: formData.edad === '' ? undefined : formData.edad as number,
        avatar_url: avatarUrl
      })

      if (success) {
        navigate('/home')
      } else {
        setError('Error al guardar el perfil')
      }
    } catch (error: any) {
      setError(error.message || 'Error al guardar el perfil')
    } finally {
      setIsLoading(false)
    }
  }

  const grados = [
    'Preescolar', 'Primero', 'Segundo', 'Tercero', 'Cuarto', 'Quinto',
    'Sexto', 'Séptimo', 'Octavo', 'Noveno', 'Décimo', 'Once',
    'Universidad', 'Otro'
  ]

  const paises = [
    'Colombia', 'Argentina', 'Brasil', 'Chile', 'Ecuador', 'México',
    'Perú', 'Uruguay', 'Venezuela', 'España', 'Estados Unidos', 'Otro'
  ]

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate('/home')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <Sparkles size={32} className="text-blue-500" />
              <Clock size={32} className="text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Fredoka' }}>
                Completa tu Perfil
              </h1>
              <p className="text-gray-600" style={{ fontFamily: 'Comic Neue' }}>
                Cuéntanos más sobre ti
              </p>
            </div>
          </div>

          {/* Avatar Upload */}
          <div className="flex justify-center mb-8">
            <AvatarUpload
              currentAvatar={profile?.avatar_url}
              onAvatarChange={setAvatarFile}
              loading={isLoading}
            />
          </div>
        </div>

        {/* Profile Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            {/* Name fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido *
                </label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tu apellido"
                />
              </div>
            </div>

            {/* Grade and School */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grado *
                </label>
                <select
                  name="grado"
                  value={formData.grado}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona tu grado</option>
                  {grados.map(grado => (
                    <option key={grado} value={grado}>{grado}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Colegio *
                </label>
                <input
                  type="text"
                  name="nombre_colegio"
                  value={formData.nombre_colegio}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre de tu colegio"
                />
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad *
                </label>
                <input
                  type="text"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tu ciudad"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País *
                </label>
                <select
                  name="pais"
                  value={formData.pais}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {paises.map(pais => (
                    <option key={pais} value={pais}>{pais}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Age and Gender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edad *
                </label>
                <input
                  type="number"
                  name="edad"
                  value={formData.edad}
                  onChange={handleInputChange}
                  required
                  min="0"
                  max="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tu edad"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sexo *
                </label>
                <select
                  name="sexo"
                  value={formData.sexo}
                  onChange={handleInputChange}
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

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ fontFamily: 'Fredoka' }}
            >
              <Save size={20} />
              {isLoading ? 'Guardando...' : 'Guardar Perfil'}
            </button>
          </form>

          {/* Fun Elements */}
          <div className="mt-8 text-center">
            <div className="flex justify-center gap-4 text-4xl">
              <span className="animate-pulse">🎓</span>
              <span className="animate-pulse" style={{ animationDelay: '0.1s' }}>📚</span>
              <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>✨</span>
              <span className="animate-pulse" style={{ animationDelay: '0.3s' }}>🌟</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompleteProfilePage
