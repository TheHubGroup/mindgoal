import React, { useState, useRef } from 'react'
import { Profile, ProfileFormData } from '../types/profile'
import { Camera, Upload, User, School, MapPin, Calendar, Users } from 'lucide-react'

interface ProfileFormProps {
  profile: Profile | null
  onSubmit: (data: ProfileFormData, avatarFile?: File) => Promise<void>
  isLoading?: boolean
}

const ProfileForm: React.FC<ProfileFormProps> = ({ profile, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<ProfileFormData>({
    nombre: profile?.nombre || '',
    apellido: profile?.apellido || '',
    grado: profile?.grado || '',
    nombre_colegio: profile?.nombre_colegio || '',
    ciudad: profile?.ciudad || '',
    pais: profile?.pais || 'Colombia',
    edad: profile?.edad || '',
    sexo: profile?.sexo || ''
  })
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'edad' ? (value === '' ? '' : parseInt(value)) : value
    }))
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen debe ser menor a 5MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen')
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
    await onSubmit(formData, avatarFile || undefined)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          Haz clic en la cámara para subir tu foto
        </p>
      </div>

      {/* Email (Read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📧 Correo Electrónico
        </label>
        <input
          type="email"
          value={profile?.email || ''}
          disabled
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
        />
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
            <User size={16} className="inline mr-2" />
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

      {/* Academic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <School size={16} className="inline mr-2" />
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
            name="nombre_colegio"
            value={formData.nombre_colegio}
            onChange={handleInputChange}
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
            <MapPin size={16} className="inline mr-2" />
            País *
          </label>
          <select
            name="pais"
            value={formData.pais}
            onChange={handleInputChange}
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
            <Users size={16} className="inline mr-2" />
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

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ fontFamily: 'Fredoka' }}
      >
        <Upload size={20} />
        {isLoading ? 'Guardando...' : 'Guardar Perfil'}
      </button>
    </form>
  )
}

export default ProfileForm