import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import { ProfileFormData } from '../types/profile'
import ProfileForm from '../components/ProfileForm'
import { Sparkles, Clock, UserCheck } from 'lucide-react'

const ProfileSetupPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const { updateProfile, uploadAvatar } = useProfile()
  const navigate = useNavigate()

  const handleProfileSubmit = async (data: ProfileFormData, avatarFile?: File) => {
    if (!user) return

    setIsLoading(true)
    setError('')

    try {
      let avatarUrl = null

      // Upload avatar if provided
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile)
        if (!avatarUrl) {
          setError('Error al subir la foto de perfil')
          setIsLoading(false)
          return
        }
      }

      // Update profile with all data
      const profileData = {
        ...data,
        ...(avatarUrl && { avatar_url: avatarUrl })
      }

      const success = await updateProfile(profileData)
      
      if (success) {
        navigate('/home')
      } else {
        setError('Error al guardar el perfil')
      }
    } catch (error: any) {
      setError(error.message || 'Error al configurar el perfil')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <UserCheck size={40} className="text-green-500" />
            <Sparkles size={40} className="text-blue-500" />
            <Clock size={40} className="text-purple-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Fredoka' }}>
            ¡Completa tu Perfil!
          </h1>
          <p className="text-gray-600" style={{ fontFamily: 'Comic Neue' }}>
            Cuéntanos más sobre ti para personalizar tu experiencia
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Profile Form */}
        <ProfileForm
          profile={{ 
            id: user?.id || '', 
            email: user?.email || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }}
          onSubmit={handleProfileSubmit}
          isLoading={isLoading}
        />

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

export default ProfileSetupPage
