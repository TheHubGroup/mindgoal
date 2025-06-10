import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Profile } from '../types/profile'

export const useProfile = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && supabase) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user || !supabase) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        setError(error.message)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar el perfil')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !supabase) return false

    try {
      // Ensure we're updating the correct user's profile
      const profileData = {
        ...updates,
        id: user.id, // Ensure the ID matches the authenticated user
        email: user.email // Preserve the email from auth
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'id' })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating profile:', error)
        setError(error.message)
        return false
      }

      await fetchProfile()
      return true
    } catch (err) {
      console.error('Error:', err)
      setError('Error al actualizar el perfil')
      return false
    }
  }

  const uploadAvatar = async (file: File) => {
    if (!user || !supabase) return null

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError)
        setError(uploadError.message)
        return null
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (err) {
      console.error('Error:', err)
      setError('Error al subir la imagen')
      return null
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile
  }
}
