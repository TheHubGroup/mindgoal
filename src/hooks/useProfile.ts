import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Profile } from '../types/profile'

export const useProfile = () => {
  const { user, bypassUser } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (bypassUser) {
      // Usar perfil del usuario bypass
      const bypassProfile: Profile = {
        id: bypassUser.id,
        email: bypassUser.email,
        nombre: bypassUser.profile.nombre,
        apellido: bypassUser.profile.apellido,
        grado: bypassUser.profile.grado,
        nombre_colegio: bypassUser.profile.nombre_colegio,
        ciudad: bypassUser.profile.ciudad,
        pais: bypassUser.profile.pais,
        edad: bypassUser.profile.edad,
        sexo: bypassUser.profile.sexo,
        avatar_url: bypassUser.profile.avatar_url || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setProfile(bypassProfile)
      setLoading(false)
      return
    }

    if (user && supabase) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [user, bypassUser])

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
    if (bypassUser) {
      // Actualizar perfil bypass en localStorage
      const updatedBypassUser = {
        ...bypassUser,
        profile: {
          ...bypassUser.profile,
          nombre: updates.nombre || bypassUser.profile.nombre,
          apellido: updates.apellido || bypassUser.profile.apellido,
          grado: updates.grado || bypassUser.profile.grado,
          nombre_colegio: updates.nombre_colegio || bypassUser.profile.nombre_colegio,
          ciudad: updates.ciudad || bypassUser.profile.ciudad,
          pais: updates.pais || bypassUser.profile.pais,
          edad: updates.edad || bypassUser.profile.edad,
          sexo: updates.sexo || bypassUser.profile.sexo,
          avatar_url: updates.avatar_url || bypassUser.profile.avatar_url
        }
      }

      localStorage.setItem('bypassUser', JSON.stringify(updatedBypassUser))
      
      // Actualizar perfil local
      const updatedProfile: Profile = {
        id: bypassUser.id,
        email: bypassUser.email,
        nombre: updatedBypassUser.profile.nombre,
        apellido: updatedBypassUser.profile.apellido,
        grado: updatedBypassUser.profile.grado,
        nombre_colegio: updatedBypassUser.profile.nombre_colegio,
        ciudad: updatedBypassUser.profile.ciudad,
        pais: updatedBypassUser.profile.pais,
        edad: updatedBypassUser.profile.edad,
        sexo: updatedBypassUser.profile.sexo,
        avatar_url: updatedBypassUser.profile.avatar_url || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setProfile(updatedProfile)
      return true
    }

    if (!user || !supabase) return false

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
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
    if (bypassUser) {
      // Para bypass, simular upload creando un URL local
      const localUrl = URL.createObjectURL(file)
      return localUrl
    }

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