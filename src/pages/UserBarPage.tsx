import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trophy, Target, Award, Star } from 'lucide-react'
import UserBar from '../components/UserBar'

const UserBarPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400">
      {/* Header */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white hover:text-opacity-80 transition-colors"
            >
              <ArrowLeft size={24} />
              <span className="font-bold">Volver al Inicio</span>
            </button>
            <div className="flex items-center gap-3">
              <Trophy size={32} className="text-white" />
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                Mi Perfil de Usuario
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* User Bar Demo */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
            Tu Barra de Usuario
          </h2>
          <p className="text-xl text-white text-opacity-90 max-w-2xl mx-auto mb-8" style={{ fontFamily: 'Comic Neue' }}>
            Esta es tu barra personal que muestra tu progreso y te permite gestionar tu cuenta.
          </p>
          
          {/* User Bar Component */}
          <div className="flex justify-center mb-8">
            <UserBar className="max-w-md" />
          </div>
        </div>

        {/* Features Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy size={32} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Fredoka' }}>
              Score Dinámico
            </h3>
            <p className="text-white text-opacity-80 text-sm" style={{ fontFamily: 'Comic Neue' }}>
              Tu puntuación se calcula automáticamente basada en todos los caracteres que has escrito en las actividades.
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target size={32} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Fredoka' }}>
              Niveles de Progreso
            </h3>
            <p className="text-white text-opacity-80 text-sm" style={{ fontFamily: 'Comic Neue' }}>
              Avanza desde Principiante hasta Experto según tu participación en las actividades.
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={32} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Fredoka' }}>
              Gestión de Perfil
            </h3>
            <p className="text-white text-opacity-80 text-sm" style={{ fontFamily: 'Comic Neue' }}>
              Edita tu información personal, cambia tu foto y personaliza tu experiencia.
            </p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star size={32} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'Fredoka' }}>
              Acceso Rápido
            </h3>
            <p className="text-white text-opacity-80 text-sm" style={{ fontFamily: 'Comic Neue' }}>
              Accede rápidamente a todas las funciones importantes desde cualquier página.
            </p>
          </div>
        </div>

        {/* Score Levels Info */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6">
          <h3 className="text-2xl font-bold text-white mb-6 text-center" style={{ fontFamily: 'Fredoka' }}>
            Niveles de Progreso
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-300 mb-2">0-199</div>
              <div className="text-white font-medium">Principiante</div>
              <div className="text-white text-opacity-70 text-sm mt-1">¡Empezando la aventura!</div>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-300 mb-2">200-499</div>
              <div className="text-white font-medium">Intermedio</div>
              <div className="text-white text-opacity-70 text-sm mt-1">¡Buen progreso!</div>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-300 mb-2">500-999</div>
              <div className="text-white font-medium">Avanzado</div>
              <div className="text-white text-opacity-70 text-sm mt-1">¡Excelente trabajo!</div>
            </div>
            
            <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-300 mb-2">1000+</div>
              <div className="text-white font-medium">Experto</div>
              <div className="text-white text-opacity-70 text-sm mt-1">¡Eres increíble!</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
              ¿Cómo usar tu barra de usuario? 
            </h3>
            
            {/* Iframe Demo */}
            <div className="mb-6">
              <h4 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'Fredoka' }}>
                🖼️ Versión para Iframe
              </h4>
              <div className="bg-white bg-opacity-20 rounded-lg p-4 mb-4">
                <iframe
                  src="/standalone-user-bar"
                  className="w-full h-16 border-0 rounded-lg"
                  title="Barra de Usuario Standalone"
                />
              </div>
              <p className="text-white text-opacity-80 text-sm mb-4" style={{ fontFamily: 'Comic Neue' }}>
                Esta es la versión independiente que puedes incrustar en cualquier lugar usando:
              </p>
              <div className="bg-black bg-opacity-30 rounded-lg p-3 text-left">
                <code className="text-green-300 text-sm">
                  &lt;iframe src="/standalone-user-bar" width="100%" height="64px"&gt;&lt;/iframe&gt;
                </code>
              </div>
            </div>
            
            <div className="text-white text-opacity-90 space-y-2" style={{ fontFamily: 'Comic Neue' }}>
              <p>• Haz clic en el ícono de configuración para ver el menú</p>
              <p>• Tu score se actualiza automáticamente cuando participas en actividades</p>
              <p>• Puedes editar tu perfil en cualquier momento</p>
              <p>• El nivel cambia según tu progreso total</p>
              <p>• La versión iframe es perfecta para incrustar en otras páginas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserBarPage