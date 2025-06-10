import React from 'react'
import { useProfile } from '../hooks/useProfile'
import { User, MapPin, GraduationCap, School, Calendar, Users } from 'lucide-react'

const ProfileCard = () => {
  const { profile, loading } = useProfile()

  if (loading) {
    return (
      <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white bg-opacity-30 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-white bg-opacity-30 rounded mb-2"></div>
            <div className="h-3 bg-white bg-opacity-20 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const getDisplayName = () => {
    if (profile.nombre && profile.apellido) {
      return `${profile.nombre} ${profile.apellido}`
    }
    if (profile.nombre) {
      return profile.nombre
    }
    return profile.email
  }

  const getLocation = () => {
    if (profile.ciudad && profile.pais) {
      return `${profile.ciudad}, ${profile.pais}`
    }
    if (profile.ciudad) {
      return profile.ciudad
    }
    if (profile.pais) {
      return profile.pais
    }
    return null
  }

  return (
    <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 text-white">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full overflow-hidden bg-white bg-opacity-30 flex-shrink-0">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold truncate" style={{ fontFamily: 'Fredoka' }}>
            {getDisplayName()}
          </h3>
          
          <div className="space-y-1 text-sm opacity-90" style={{ fontFamily: 'Comic Neue' }}>
            {profile.grado && (
              <div className="flex items-center gap-2">
                <GraduationCap size={14} />
                <span>{profile.grado}</span>
              </div>
            )}
            
            {profile.nombre_colegio && (
              <div className="flex items-center gap-2">
                <School size={14} />
                <span className="truncate">{profile.nombre_colegio}</span>
              </div>
            )}
            
            {getLocation() && (
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span>{getLocation()}</span>
              </div>
            )}
            
            {profile.edad && (
              <div className="flex items-center gap-2">
                <Users size={14} />
                <span>{profile.edad} años</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              <span>Desde {new Date(profile.created_at).toLocaleDateString('es-ES', { 
                month: 'long', 
                year: 'numeric' 
              })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileCard
