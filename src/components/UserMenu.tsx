import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'

const UserMenu = () => {
  const { user, signOut, bypassUser } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (bypassUser) {
        setProfile(bypassUser.profile)
        return
      }

      if (user && supabase) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (!error && data) {
            setProfile(data)
          }
        } catch (error) {
          console.error('Error fetching profile:', error)
        }
      }
    }

    fetchProfile()
  }, [user, bypassUser])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (!user) return null

  const displayName = profile 
    ? `${profile.first_name || profile.nombre || ''} ${profile.last_name || profile.apellido || ''}`.trim()
    : user.email?.split('@')[0] || 'Usuario'

  const avatarUrl = profile?.avatar_url

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 hover:bg-white/20 transition-all"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={16} className="text-white" />
          )}
        </div>
        <span className="text-white font-medium hidden sm:block">
          {displayName}
        </span>
        {bypassUser && (
          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">
            BYPASS
          </span>
        )}
        <ChevronDown size={16} className="text-white" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-white" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{displayName}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
                {bypassUser && (
                  <p className="text-xs text-green-600 font-medium">Modo Bypass Activo</p>
                )}
              </div>
            </div>
          </div>

          {profile && (
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Grado:</span> {profile.grade || profile.grado || 'No especificado'}</p>
                <p><span className="font-medium">Colegio:</span> {profile.school_name || profile.nombre_colegio || 'No especificado'}</p>
                <p><span className="font-medium">Ciudad:</span> {profile.city || profile.ciudad || 'No especificada'}</p>
              </div>
            </div>
          )}

          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false)
                // TODO: Implement settings page
              }}
              className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center gap-3"
            >
              <Settings size={16} />
              Configuración
            </button>
            <button
              onClick={() => {
                setIsOpen(false)
                handleSignOut()
              }}
              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-3"
            >
              <LogOut size={16} />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserMenu