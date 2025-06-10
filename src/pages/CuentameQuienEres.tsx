import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import UserMenu from '../components/UserMenu'
import ProfileDisplayCard from '../components/ProfileDisplayCard'
import ProfileSetupModal from '../components/ProfileSetupModal'
import { useProfile } from '../hooks/useProfile'
import { userResponsesService, UserResponse } from '../lib/userResponsesService'
import { 
  Heart, 
  ArrowLeft, 
  Sparkles, 
  Save,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  User
} from 'lucide-react'

interface Question {
  id: string
  text: string
  placeholder: string
  category: 'personal' | 'preferences' | 'dreams'
}

const questions: Question[] = [
  {
    id: 'favorite_color',
    text: '¿Cuál es tu color favorito y por qué?',
    placeholder: 'Mi color favorito es... porque...',
    category: 'preferences'
  },
  {
    id: 'favorite_food',
    text: '¿Cuál es tu comida favorita?',
    placeholder: 'Me encanta comer...',
    category: 'preferences'
  },
  {
    id: 'hobby',
    text: '¿Qué te gusta hacer en tu tiempo libre?',
    placeholder: 'En mi tiempo libre me gusta...',
    category: 'personal'
  },
  {
    id: 'dream_job',
    text: '¿Qué quieres ser cuando seas grande?',
    placeholder: 'Cuando sea grande quiero ser...',
    category: 'dreams'
  },
  {
    id: 'favorite_subject',
    text: '¿Cuál es tu materia favorita en el colegio?',
    placeholder: 'Mi materia favorita es... porque...',
    category: 'personal'
  },
  {
    id: 'pet',
    text: '¿Tienes mascotas o te gustaría tener alguna?',
    placeholder: 'Tengo/Me gustaría tener...',
    category: 'preferences'
  },
  {
    id: 'superpower',
    text: 'Si pudieras tener un superpoder, ¿cuál sería?',
    placeholder: 'Mi superpoder sería... para...',
    category: 'dreams'
  },
  {
    id: 'family',
    text: '¿Cómo es tu familia?',
    placeholder: 'Mi familia está compuesta por...',
    category: 'personal'
  }
]

const CuentameQuienEres = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, loading: profileLoading } = useProfile()
  const [responses, setResponses] = useState<{ [key: string]: string }>({})
  const [savedResponses, setSavedResponses] = useState<UserResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    if (user) {
      loadResponses()
    }
  }, [user])

  // Mostrar modal de perfil automáticamente si no está completo
  useEffect(() => {
    if (!profileLoading && profile) {
      const isProfileIncomplete = !profile.nombre || !profile.apellido || !profile.grado || !profile.nombre_colegio
      if (isProfileIncomplete) {
        setShowProfileModal(true)
      }
    }
  }, [profile, profileLoading])

  const loadResponses = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const userResponses = await userResponsesService.getResponses(user.id, 'cuentame_quien_eres')
      setSavedResponses(userResponses)
      
      // Convertir respuestas guardadas a formato del formulario
      const responseMap: { [key: string]: string } = {}
      userResponses.forEach(response => {
        responseMap[response.question] = response.response
      })
      setResponses(responseMap)
    } catch (error) {
      console.error('Error loading responses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }))
    setHasUnsavedChanges(true)
  }

  const handleSaveResponses = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      // Preparar respuestas para guardar
      const responsesToSave = Object.entries(responses)
        .filter(([_, response]) => response.trim() !== '')
        .map(([questionId, response]) => ({
          user_id: user.id,
          question: questionId,
          response: response.trim(),
          activity_type: 'cuentame_quien_eres'
        }))

      if (responsesToSave.length === 0) {
        setSaveMessage('No hay respuestas para guardar')
        setTimeout(() => setSaveMessage(''), 3000)
        return
      }

      // Eliminar respuestas anteriores del usuario para esta actividad
      for (const savedResponse of savedResponses) {
        if (savedResponse.id) {
          await userResponsesService.deleteResponse(savedResponse.id)
        }
      }

      // Guardar nuevas respuestas
      const success = await userResponsesService.saveMultipleResponses(responsesToSave)
      
      if (success) {
        setSaveMessage(`¡${responsesToSave.length} respuestas guardadas correctamente!`)
        setHasUnsavedChanges(false)
        await loadResponses() // Recargar para obtener los IDs
      } else {
        setSaveMessage('Error al guardar las respuestas')
      }
      
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving responses:', error)
      setSaveMessage('Error al guardar las respuestas')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const getCompletedCount = () => {
    return Object.values(responses).filter(response => response.trim() !== '').length
  }

  if (profileLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-purple-400 flex items-center justify-center">
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-3xl p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
            Cargando...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-purple-400">
      {/* Header */}
      <div className="bg-white bg-opacity-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white hover:text-opacity-80 transition-colors"
            >
              <ArrowLeft size={24} />
              <span className="font-bold">Volver</span>
            </button>
            <div className="flex items-center gap-3">
              <Heart size={32} className="text-white" />
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                Cuéntame quien eres
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveResponses}
              disabled={isSaving || !hasUnsavedChanges}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${
                hasUnsavedChanges 
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white animate-pulse' 
                  : 'bg-green-500 text-white'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save size={20} />
              {isSaving ? 'Guardando...' : hasUnsavedChanges ? 'Guardar Respuestas' : 'Todo Guardado'}
            </button>
            <UserMenu />
          </div>
        </div>
      </div>

      {/* Mensaje de estado */}
      {saveMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-white rounded-lg shadow-lg p-4 border-l-4 border-green-500">
          <CheckCircle size={20} className="text-green-500" />
          <span className="font-medium text-gray-800">{saveMessage}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Perfil del Usuario - SIEMPRE VISIBLE */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 text-center" style={{ fontFamily: 'Fredoka' }}>
            Tu Perfil
          </h2>
          <div className="max-w-md mx-auto">
            <ProfileDisplayCard 
              showEditButton={true}
              onEdit={() => setShowProfileModal(true)}
            />
          </div>
        </div>

        {/* Instrucciones */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka' }}>
            ¡Comparte tu historia! 💫
          </h2>
          <p className="text-xl text-white text-opacity-90 max-w-3xl mx-auto mb-4" style={{ fontFamily: 'Comic Neue' }}>
            Responde estas preguntas para que todos puedan conocerte mejor. ¡Sé creativo y diviértete!
          </p>
          
          {/* Progreso */}
          <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-4 max-w-md mx-auto">
            <div className="flex items-center gap-3 text-white">
              <MessageCircle size={24} />
              <div>
                <div className="text-lg font-bold">{getCompletedCount()} de {questions.length}</div>
                <div className="text-sm opacity-80">preguntas respondidas</div>
              </div>
            </div>
            <div className="w-full bg-white bg-opacity-30 rounded-full h-2 mt-3">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${(getCompletedCount() / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Preguntas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-6 hover:bg-opacity-20 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-white bg-opacity-30 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'Fredoka' }}>
                    {question.text}
                  </h3>
                  <textarea
                    value={responses[question.id] || ''}
                    onChange={(e) => handleResponseChange(question.id, e.target.value)}
                    placeholder={question.placeholder}
                    className="w-full p-3 rounded-xl border-none outline-none text-gray-800 font-medium resize-none h-24 focus:ring-2 focus:ring-white focus:ring-opacity-50"
                    style={{ fontFamily: 'Comic Neue' }}
                  />
                  {responses[question.id] && responses[question.id].trim() !== '' && (
                    <div className="flex items-center gap-2 mt-2 text-green-300">
                      <CheckCircle size={16} />
                      <span className="text-sm">¡Respondida!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Estadísticas finales */}
        <div className="mt-12 text-center">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 justify-center mb-3">
              <Sparkles size={24} className="text-yellow-300" />
              <h4 className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
                ¡Excelente trabajo!
              </h4>
            </div>
            <p className="text-white text-opacity-90" style={{ fontFamily: 'Comic Neue' }}>
              Has completado {getCompletedCount()} de {questions.length} preguntas. 
              {getCompletedCount() === questions.length 
                ? ' ¡Felicitaciones, has terminado todas las preguntas!' 
                : ' ¡Sigue así para completar tu perfil!'
              }
            </p>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 justify-center mt-3 text-yellow-300">
                <AlertCircle size={16} />
                <span className="text-sm">Tienes cambios sin guardar</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Perfil */}
      <ProfileSetupModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onComplete={() => {
          setShowProfileModal(false)
          // Recargar la página para mostrar el perfil actualizado
          window.location.reload()
        }}
      />
    </div>
  )
}

export default CuentameQuienEres