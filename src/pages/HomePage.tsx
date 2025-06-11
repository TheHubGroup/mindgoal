import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../hooks/useProfile'
import UserMenu from '../components/UserMenu'
import UserBar from '../components/UserBar'
import { 
  Clock, 
  BookOpen, 
  Calculator, 
  Palette, 
  Globe, 
  Music,
  Sparkles,
  Star,
  Heart
} from 'lucide-react'

const HomePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, loading: profileLoading } = useProfile()

  const activities = [
    {
      id: 'linea-tiempo',
      title: 'Línea del Tiempo',
      description: 'Crea tu propia línea del tiempo con momentos especiales',
      icon: Clock,
      color: 'from-purple-500 to-pink-500',
      available: true,
      route: '/actividad/linea-tiempo'
    },
    {
      id: 'cuentame-quien-eres',
      title: 'Cuéntame quien eres',
      description: 'Comparte tus gustos y preferencias de manera divertida',
      icon: Heart,
      color: 'from-green-500 to-blue-500',
      available: true,
      route: '/actividad/cuentame-quien-eres'
    },
    {
      id: 'lectura',
      title: 'Aventuras de Lectura',
      description: 'Descubre historias increíbles y mejora tu comprensión',
      icon: BookOpen,
      color: 'from-blue-500 to-cyan-500',
      available: false
    },
    {
      id: 'matematicas',
      title: 'Matemáticas Divertidas',
      description: 'Resuelve problemas y juega con números',
      icon: Calculator,
      color: 'from-green-500 to-emerald-500',
      available: false
    },
    {
      id: 'arte',
      title: 'Taller de Arte',
      description: 'Expresa tu creatividad con colores y formas',
      icon: Palette,
      color: 'from-orange-500 to-red-500',
      available: false
    },
    {
      id: 'geografia',
      title: 'Explorador Mundial',
      description: 'Viaja por el mundo y aprende sobre diferentes países',
      icon: Globe,
      color: 'from-indigo-500 to-purple-500',
      available: false
    },
    {
      id: 'musica',
      title: 'Ritmos y Melodías',
      description: 'Crea música y aprende sobre diferentes instrumentos',
      icon: Music,
      color: 'from-pink-500 to-rose-500',
      available: false
    }
  ]

  const handleActivityClick = (activity: any) => {
    if (activity.available) {
      navigate(activity.route)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400">
      {/* Header */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Sparkles size={32} className="text-white" />
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              Plataforma de Actividades
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <UserBar />
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
            ¡Hola, {user?.email?.split('@')[0]}! 👋
          </h2>
          <p className="text-xl text-white text-opacity-90 max-w-2xl mx-auto" style={{ fontFamily: 'Comic Neue' }}>
            Bienvenido a tu plataforma de aprendizaje. Elige una actividad para comenzar tu aventura educativa.
          </p>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activities.map((activity) => {
            const IconComponent = activity.icon
            return (
              <div
                key={activity.id}
                onClick={() => handleActivityClick(activity)}
                className={`
                  relative bg-white rounded-3xl shadow-2xl p-8 transform transition-all duration-300 hover:scale-105 
                  ${activity.available 
                    ? 'cursor-pointer hover:shadow-3xl' 
                    : 'opacity-60 cursor-not-allowed'
                  }
                `}
              >
                {/* Availability Badge */}
                {!activity.available && (
                  <div className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    Próximamente
                  </div>
                )}

                {/* Available Badge */}
                {activity.available && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    <Star size={14} />
                    Disponible
                  </div>
                )}

                {/* Icon */}
                <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${activity.color} flex items-center justify-center mb-6 mx-auto`}>
                  <IconComponent size={40} className="text-white" />
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-800 mb-3" style={{ fontFamily: 'Fredoka' }}>
                    {activity.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed" style={{ fontFamily: 'Comic Neue' }}>
                    {activity.description}
                  </p>
                </div>

                {/* Action Button */}
                {activity.available && (
                  <div className="mt-6 text-center">
                    <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${activity.color} text-white px-6 py-3 rounded-full font-bold transition-all hover:shadow-lg`}>
                      ¡Empezar!
                      <Sparkles size={16} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer Message */}
        <div className="text-center mt-12">
          <p className="text-white text-opacity-80" style={{ fontFamily: 'Comic Neue' }}>
            ¡Más actividades emocionantes llegarán pronto! 🌟
          </p>
        </div>
      </div>

    </div>
  )
}

export default HomePage