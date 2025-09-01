import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import { 
  ArrowLeft, 
  Candy, 
  Play,
  ChevronRight,
  Heart,
  AlertTriangle,
  Sparkles,
  Star
} from 'lucide-react'

type Scene = 'cover' | 'intro' | 'scene1' | 'scene2a' | 'ending_sad' | 'ending_resilient'

const DulcesMagicos = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentScene, setCurrentScene] = useState<Scene>('cover')
  const [isLoading, setIsLoading] = useState(false)

  const handleSceneTransition = (nextScene: Scene) => {
    setIsLoading(true)
    setTimeout(() => {
      setCurrentScene(nextScene)
      setIsLoading(false)
    }, 300)
  }

  const renderCoverScene = () => (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 flex items-center justify-center p-4">
      <div className="text-center max-w-4xl mx-auto">
        {/* Título principal */}
        <div className="mb-8">
          <h1 className="text-6xl font-black text-white mb-4 tracking-tight" style={{ fontFamily: 'Fredoka' }}>
            🍭 DULCES MÁGICOS 🍭
          </h1>
          <p className="text-2xl text-white text-opacity-90 font-bold" style={{ fontFamily: 'Comic Neue' }}>
            Una aventura interactiva sobre decisiones saludables
          </p>
        </div>

        {/* Contenedor para imagen central */}
        <div className="mb-8">
          <div 
            className="mx-auto bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl border-4 border-white border-opacity-30 shadow-2xl overflow-hidden"
            style={{ 
              width: '944px', 
              height: '500px', 
              maxWidth: '100%', 
              maxHeight: '80vh'
            }}
          >
            <img
              src="/portada.jpg"
              alt="Dulces Mágicos - Portada"
              className="block rounded-2xl"
              style={{
                width: '944px',
                height: '500px',
                maxWidth: '100vw',
                height: 'auto'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.innerHTML = `
                    <div class="text-center text-white">
                      <div style="font-size: 120px; margin-bottom: 16px; opacity: 0.7;">🍭</div>
                      <p class="text-2xl font-bold" style="font-family: Fredoka;">
                        Imagen de Portada
                      </p>
                      <p class="text-lg opacity-80" style="font-family: Comic Neue;">
                        1497px × 793px
                      </p>
                    </div>
                  `
                }
              }}
            />
          </div>
        </div>

        {/* Botón Comenzar */}
        <button
          onClick={() => handleSceneTransition('intro')}
          disabled={isLoading}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-black py-6 px-12 rounded-full text-3xl transition-all transform hover:scale-110 shadow-2xl border-4 border-white border-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4 mx-auto"
          style={{ fontFamily: 'Fredoka' }}
        >
          <Play size={32} />
          {isLoading ? 'Cargando...' : 'COMENZAR'}
        </button>

        {/* Elementos decorativos */}
        <div className="mt-12 flex justify-center gap-8 text-6xl">
          <span className="animate-bounce">🍬</span>
          <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>🍭</span>
          <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>🧙‍♂️</span>
          <span className="animate-bounce" style={{ animationDelay: '0.6s' }}>✨</span>
        </div>
      </div>
    </div>
  )

  const renderIntroScene = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-purple-400 p-4">
      <div className="max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Imagen de Martín */}
          <div className="order-2 lg:order-1">
            <div 
              className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl border-4 border-white border-opacity-30 shadow-2xl overflow-hidden mx-auto"
              style={{ width: 'fit-content', maxWidth: '400px' }}
            >
              <img
                src="/Intro.png"
                alt="Martín - Introducción"
                className="block rounded-2xl"
                style={{
                 width: '400px',
                 height: '400px',
                  maxWidth: '100%',
                  height: 'auto'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = `
                      <div class="text-center text-white p-8">
                        <div style="font-size: 120px; margin-bottom: 16px; opacity: 0.7;">👦</div>
                        <p class="text-2xl font-bold" style="font-family: Fredoka;">
                          Imagen de Martín
                        </p>
                        <p class="text-lg opacity-80" style="font-family: Comic Neue;">
                          1024px × 1024px
                        </p>
                      </div>
                    `
                  }
                }}
              />
            </div>
          </div>

          {/* Texto e instrucciones */}
          <div className="order-1 lg:order-2 text-center lg:text-left">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-8 border-2 border-white border-opacity-20">
              <h2 className="text-4xl font-black text-white mb-6" style={{ fontFamily: 'Fredoka' }}>
                🧙‍♂️ Conoce a Martín
              </h2>
              
              <p className="text-2xl text-white leading-relaxed mb-8" style={{ fontFamily: 'Comic Neue' }}>
                Hoy conoceremos a Martín, que adora los dulces. Pero, ¿qué pasa cuando come más de la cuenta? 
                Tú vas a ayudarlo a tomar decisiones. ¡Prepárate, porque cada elección puede cambiar su historia!
              </p>

              <button
                onClick={() => handleSceneTransition('scene1')}
                disabled={isLoading}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-black py-4 px-8 rounded-full text-2xl transition-all transform hover:scale-105 shadow-xl border-3 border-white border-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto lg:mx-0"
                style={{ fontFamily: 'Fredoka' }}
              >
                <Heart size={24} />
                {isLoading ? 'Cargando...' : '¡ESTOY LISTO!'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderScene1 = () => (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-400 to-pink-400 p-4">
      <div className="max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Imagen de la escena */}
          <div>
            <div 
              className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl border-4 border-white border-opacity-30 shadow-2xl overflow-hidden mx-auto"
              style={{ width: 'fit-content', maxWidth: '400px' }}
            >
              <img
                src="/pregunta_01.png"
                alt="Martín se siente mal"
                className="block rounded-2xl"
                style={{
                  width: '400px',
                  height: '400px',
                  maxWidth: '100%',
                  height: 'auto'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = `
                      <div class="text-center text-white p-8">
                        <div style="font-size: 120px; margin-bottom: 16px; opacity: 0.7;">😵</div>
                        <p class="text-2xl font-bold" style="font-family: Fredoka;">
                          Martín se siente mal
                        </p>
                        <p class="text-lg opacity-80" style="font-family: Comic Neue;">
                          1024px × 1024px
                        </p>
                      </div>
                    `
                  }
                }}
              />
            </div>
          </div>

          {/* Historia y opciones */}
          <div className="text-center lg:text-left">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-8 border-2 border-white border-opacity-20">
              <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'Fredoka' }}>
                <Candy size={32} />
                El Exceso de Dulces
              </h2>
              
              <div className="bg-white bg-opacity-20 rounded-2xl p-6 mb-8">
                <p className="text-xl text-white leading-relaxed" style={{ fontFamily: 'Comic Neue' }}>
                  Martín llega a casa con una bolsa llena de caramelos. Está feliz y empieza a comer sin parar.
                  <br /><br />
                  <span className="font-bold text-yellow-300">De repente, le duele la barriga.</span>
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
                  ¿Qué debería hacer Martín?
                </h3>
                
                {/* Opción A */}
                <button
                  onClick={() => handleSceneTransition('scene2a')}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-all transform hover:scale-105 shadow-lg border-2 border-white border-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Fredoka' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black">A</span>
                    <span className="flex-1 text-center">Seguir comiendo porque "son muy ricos"</span>
                    <ChevronRight size={24} />
                  </div>
                </button>

                {/* Opción B */}
                <button
                  onClick={() => handleSceneTransition('scene2b')}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-all transform hover:scale-105 shadow-lg border-2 border-white border-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Fredoka' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black">B</span>
                    <span className="flex-1 text-center">Guardar los dulces y tomar un vaso de agua</span>
                    <ChevronRight size={24} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderScene2A = () => (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 p-4">
      <div className="max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Imagen de la escena */}
          <div>
            <div 
              className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl border-4 border-white border-opacity-30 shadow-2xl flex items-center justify-center"
              style={{ width: '1024px', height: '1024px', maxWidth: '90vw', maxHeight: '70vh' }}
            >
              <div className="text-center text-white">
                <div className="text-8xl mb-4">😵</div>
                <p className="text-2xl font-bold" style={{ fontFamily: 'Fredoka' }}>
                  Martín se siente mal
                </p>
                <p className="text-lg opacity-80" style={{ fontFamily: 'Comic Neue' }}>
                  1024px × 1024px
                </p>
              </div>
            </div>
          </div>

          {/* Historia y opciones */}
          <div className="text-center lg:text-left">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-8 border-2 border-white border-opacity-20">
              <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'Fredoka' }}>
                <AlertTriangle size={32} className="text-yellow-300" />
                Las Consecuencias
              </h2>
              
              <div className="bg-white bg-opacity-20 rounded-2xl p-6 mb-8">
                <p className="text-xl text-white leading-relaxed" style={{ fontFamily: 'Comic Neue' }}>
                  Martín sigue comiendo… y el dolor de barriga aumenta. Se siente cansado y no puede jugar con sus amigos.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
                  ¿Qué debería hacer ahora?
                </h3>
                
                {/* Opción A1 */}
                <button
                  onClick={() => handleSceneTransition('ending_sad')}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-800 hover:from-gray-700 hover:to-gray-900 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-all transform hover:scale-105 shadow-lg border-2 border-white border-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Fredoka' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black">A1</span>
                    <span className="flex-1 text-center">No contarle a nadie y quedarse solo en su cuarto</span>
                    <ChevronRight size={24} />
                  </div>
                </button>

                {/* Opción A2 */}
                <button
                  onClick={() => handleSceneTransition('ending_resilient')}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-4 px-6 rounded-2xl text-lg transition-all transform hover:scale-105 shadow-lg border-2 border-white border-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontFamily: 'Fredoka' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black">A2</span>
                    <span className="flex-1 text-center">Hablar con su mamá y decirle cómo se siente</span>
                    <ChevronRight size={24} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderEndingSad = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 p-4">
      <div className="max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Imagen del final triste */}
          <div>
            <div 
              className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl border-4 border-white border-opacity-30 shadow-2xl flex items-center justify-center"
              style={{ width: 'fit-content', maxWidth: '500px' }}
            >
              <img
                src="/Decision_A_02.png"
                alt="Final: Aprendiendo la Lección"
                className="block rounded-2xl"
                style={{
                  width: '500px',
                  height: '500px',
                  maxWidth: '100%',
                  height: 'auto'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = `
                      <div class="text-center text-white p-8">
                        <div style="font-size: 120px; margin-bottom: 16px; opacity: 0.7;">😢</div>
                        <p class="text-2xl font-bold" style="font-family: Fredoka;">
                          Final: Aprendiendo la Lección
                        </p>
                        <p class="text-lg opacity-80" style="font-family: Comic Neue;">
                          1024px × 1024px
                        </p>
                      </div>
                    `
                  }
                }}
              />
            </div>
          </div>

          {/* Mensaje del final */}
          <div className="text-center lg:text-left">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-8 border-2 border-white border-opacity-20">
              <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'Fredoka' }}>
                <AlertTriangle size={32} className="text-red-400" />
                Final: Aprendiendo la Lección
              </h2>
              
              <div className="bg-red-900 bg-opacity-30 rounded-2xl p-6 mb-8 border-l-4 border-red-400">
                <p className="text-xl text-white leading-relaxed" style={{ fontFamily: 'Comic Neue' }}>
                  Martín se queda triste y solo, aprende que ocultar el problema no lo ayuda.
                </p>
              </div>

              <div className="bg-white bg-opacity-20 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Fredoka' }}>
                  💡 Reflexión
                </h3>
                <p className="text-white text-opacity-90" style={{ fontFamily: 'Comic Neue' }}>
                  A veces, cuando tenemos problemas, es mejor hablar con alguien de confianza que quedarnos solos. 
                  Pedir ayuda no es de débiles, ¡es de valientes!
                </p>
              </div>

              <button
                onClick={() => handleSceneTransition('cover')}
                className="mt-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold py-3 px-6 rounded-full transition-all transform hover:scale-105 flex items-center gap-2 mx-auto lg:mx-0"
                style={{ fontFamily: 'Fredoka' }}
              >
                <ChevronRight size={20} />
                Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderEndingResilient = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-emerald-400 to-teal-400 p-4">
      <div className="max-w-7xl mx-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Imagen del final resiliente */}
          <div>
            <div 
              className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl border-4 border-white border-opacity-30 shadow-2xl flex items-center justify-center"
              style={{ width: 'fit-content', maxWidth: '500px' }}
            >
              <img
                src="/Decision_A_03.png"
                alt="Final: ¡Buena Decisión!"
                className="block rounded-2xl"
                style={{
                  width: '500px',
                  height: '500px',
                  maxWidth: '100%',
                  height: 'auto'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = `
                      <div class="text-center text-white p-8">
                        <div style="font-size: 120px; margin-bottom: 16px; opacity: 0.7;">🤗</div>
                        <p class="text-2xl font-bold" style="font-family: Fredoka;">
                          Final: ¡Buena Decisión!
                        </p>
                        <p class="text-lg opacity-80" style="font-family: Comic Neue;">
                          1024px × 1024px
                        </p>
                      </div>
                    `
                  }
                }}
              />
            </div>
          </div>

          {/* Mensaje del final */}
          <div className="text-center lg:text-left">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-8 border-2 border-white border-opacity-20">
              <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3" style={{ fontFamily: 'Fredoka' }}>
                <Heart size={32} className="text-green-300" />
                Final: ¡Buena Decisión!
              </h2>
              
              <div className="bg-green-900 bg-opacity-30 rounded-2xl p-6 mb-8 border-l-4 border-green-400">
                <p className="text-xl text-white leading-relaxed" style={{ fontFamily: 'Comic Neue' }}>
                  Su mamá lo ayuda a descansar y le explica la importancia de cuidar lo que come.
                </p>
              </div>

              <div className="bg-white bg-opacity-20 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: 'Fredoka' }}>
                  🌟 ¡Excelente Elección!
                </h3>
                <p className="text-white text-opacity-90" style={{ fontFamily: 'Comic Neue' }}>
                  Martín aprendió que hablar con alguien de confianza cuando tenemos problemas nos ayuda a sentirnos mejor. 
                  ¡Pedir ayuda es muy inteligente!
                </p>
              </div>

              <button
                onClick={() => handleSceneTransition('cover')}
                className="mt-6 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-full transition-all transform hover:scale-105 flex items-center gap-2 mx-auto lg:mx-0"
                style={{ fontFamily: 'Fredoka' }}
              >
                <Star size={20} />
                Volver al Inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderCurrentScene = () => {
    switch (currentScene) {
      case 'cover':
        return renderCoverScene()
      case 'intro':
        return renderIntroScene()
      case 'scene1':
        return renderScene1()
      case 'scene2a':
        return renderScene2A()
      case 'ending_sad':
        return renderEndingSad()
      case 'ending_resilient':
        return renderEndingResilient()
      default:
        return renderCoverScene()
    }
  }

  return (
    <div className="relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              Cargando siguiente escena...
            </p>
          </div>
        </div>
      )}

      {/* Scene Content */}
      {renderCurrentScene()}

      {/* Header moved to bottom */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <Candy size={32} className="text-white" />
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              Dulces Mágicos
            </h1>
          </div>
          <UserMenu />
        </div>
      </div>
    </div>
  )
}

export default DulcesMagicos