import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import ProfileForm from '../components/ProfileForm'
import { ProfileFormData } from '../types/profile'
import { ArrowLeft, User, Sparkles } from 'lucide-react'

const ProfilePage = () => {
  const navigate = useNavigate()
  const { profile, loading, updateProfile, uploadAvatar } = useProfile()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async (formData: ProfileFormData, avatarFile?: File) => {
    setIsSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      let avatarUrl = profile?.avatar_url

      // Upload avatar if provided
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile)
      }

      // Update profile
      await updateProfile({
        ...formData,
        avatar_url: avatarUrl
      })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error: any) {
      setError(error.message || 'Error al guardar el perfil')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600" style={{ fontFamily: 'Comic Neue' }}>
            Cargando perfil...
          </p>
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
              onClick={() => navigate('/')}
              className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <User size={32} className="text-blue-500" />
              <Sparkles size={32} className="text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Fredoka' }}>
                Mi Perfil
              </h1>
              <p className="text-gray-600" style={{ fontFamily: 'Comic Neue' }}>
                Completa tu información personal
              </p>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
              ¡Perfil actualizado correctamente! 🎉
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Profile Form */}
          <ProfileForm
            profile={profile}
            onSubmit={handleSave}
            isLoading={isSubmitting}
          />
        </div>

        {/* Fun Elements */}
        <div className="text-center">
          <div className="flex justify-center gap-4 text-4xl">
            <span className="animate-pulse">👤</span>
            <span className="animate-pulse" style={{ animationDelay: '0.1s' }}>✨</span>
            <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>🎯</span>
            <span className="animate-pulse" style={{ animationDelay: '0.3s' }}>🌟</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage