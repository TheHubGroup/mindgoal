// Interface que coincide exactamente con los datos del dashboard
interface UserAnalysisData {
  user_id: string
  email: string
  nombre: string
  apellido: string
  grado: string
  nombre_colegio: string
  ciudad: string
  pais: string
  edad: number
  sexo: string
  avatar_url: string
  timeline_notes?: Array<{
    id: string
    text: string
    emoji: string
    color: string
    shape: string
    font: string
    section: string
    position_x: number
    position_y: number
    created_at: string
  }>
  user_responses?: Array<{
    id: string
    question: string
    response: string
    activity_type: string
    created_at: string
  }>
  letters?: Array<{
    id: string
    title: string
    content: string
    created_at: string
  }>
  meditation_sessions?: Array<{
    id: string
    video_id: string
    video_title: string
    watch_duration: number
    completion_percentage: number
    reflection_text: string | null
    completed_at: string | null
    created_at: string
  }>
  emotion_matches?: Array<{
    id: string
    emotion_name: string
    is_correct: boolean
    explanation_shown: boolean
    created_at: string
  }>
  emotion_logs?: Array<{
    id: string
    emotion_name: string
    felt_at: string
    intensity: number | null
    notes: string | null
    created_at: string
  }>
  anger_management_sessions?: Array<{
    id: string
    video_id: string
    video_title: string
    watch_duration: number
    completion_percentage: number
    reflection_text: string | null
    techniques_applied: string[] | null
    completed_at: string | null
    created_at: string
  }>
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

const SYSTEM_PROMPT = `Prompt maestro para IA socioemocional (Mind Goal)

Rol: Analista socioemocional experto en infancia y adolescencia (6 a 17 años)

Asume el rol de un profesional especializado en desarrollo socioemocional infantil y adolescente. Tu función es analizar datos auto-reportados por usuarios de entre 6 y 17 años dentro de la plataforma Mind Goal. Estos datos provienen de cuestionarios, encuestas, observaciones o autorreflexiones escritas.

Tu misión es generar un informe claro, preciso y empático para ser leído por un adulto responsable del proceso educativo o de acompañamiento del niño o adolescente. Este puede ser un docente, psicólogo escolar, psicopedagogo u orientador, o en algunos casos, un padre o madre de familia.

El análisis debe enfocarse en detectar estados emocionales relevantes, rasgos observables, posibles desafíos y oportunidades de desarrollo, sin emitir juicios, diagnósticos clínicos, ni utilizar lenguaje técnico innecesario.

El informe debe incluir:
1. Resumen general del estado socioemocional actual
Breve diagnóstico descriptivo (no clínico) basado en los datos proporcionados. Describe el tono emocional predominante, posibles tensiones internas o fortalezas emocionales.
2. Rasgos o características observables de personalidad emocional
Ej. sensibilidad, autoexigencia, retraimiento, impulsividad, liderazgo, necesidad de validación, empatía, etc.
3. Temas a considerar o factores contextuales relevantes
Ej. baja tolerancia a la frustración, búsqueda de aprobación, dificultad para expresar emociones, conflicto con figuras de autoridad, presión social, dificultad para vincularse, etc.
4. Conductas observables o patrones emocionales/comportamentales
Qué comportamientos podrían observarse en casa o en el aula como reflejo del estado emocional o perfil del usuario.
5. Oportunidades para potenciar habilidades socioemocionales
Ámbitos clave para el trabajo emocional: autorregulación, autoestima, comunicación asertiva, empatía, toma de decisiones, resiliencia, etc.
6. Sugerencias prácticas de acompañamiento
Estrategias recomendadas para padres, docentes o especialistas que deseen apoyar el desarrollo socioemocional del usuario. Estas deben ser realistas, adaptadas a su edad, y centradas en el refuerzo positivo y el acompañamiento respetuoso.

Criterios:
• Usa un lenguaje accesible para adultos sin formación psicológica, sin perder profundidad.
• No uses etiquetas clínicas ni menciones a trastornos. Habla en términos descriptivos y evolutivos.
• Sé empático, observador y constructivo. Siempre enfócate en el potencial de desarrollo del usuario.
• Si hay señales de alerta, menciona que sería recomendable ampliar el acompañamiento con un profesional en contexto real.

Nunca te diriges directamente al niño o adolescente. Siempre te expresas en tercera persona.
Ejemplo: "Se observa que tiende a…" / "Podría beneficiarse de…" / "Sería recomendable acompañar con…"

No te identifiques con nombre propio. Eres una herramienta de análisis de Mind Goal diseñada para apoyar el bienestar integral de los estudiantes.`

export const openaiService = {
  async analyzeUserBehavior(userData: UserAnalysisData, customQuestion?: string): Promise<string> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      // Preparar el contexto del usuario
      const userContext = this.prepareUserContext(userData)
      
      // Preparar el mensaje del usuario
      const userMessage = customQuestion || 
        "Por favor, realiza un análisis socioemocional completo de este usuario basado en todos los datos disponibles."

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-2024-07-18', // Modelo actualizado más eficiente
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT
            },
            {
              role: 'user',
              content: `${userContext}\n\nPregunta específica: ${userMessage}`
            }
          ],
          max_tokens: 2000,
          temperature: 0.7,
          top_p: 0.9
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || 'No se pudo generar el análisis.'
    } catch (error) {
      console.error('Error calling OpenAI API:', error)
      throw error
    }
  },

  prepareUserContext(userData: UserAnalysisData): string {
    let context = `DATOS DEL USUARIO:

INFORMACIÓN PERSONAL:
- Nombre: ${userData.nombre} ${userData.apellido}
- Edad: ${userData.edad} años
- Sexo: ${userData.sexo}
- Grado: ${userData.grado}
- Colegio: ${userData.nombre_colegio}
- Ubicación: ${userData.ciudad}, ${userData.pais}

`

    // Agregar datos de línea de tiempo
    if (userData.timeline_notes && userData.timeline_notes.length > 0) {
      context += `LÍNEA DEL TIEMPO (${userData.timeline_notes.length} notas):
`
      userData.timeline_notes.forEach((note, index) => {
        context += `${index + 1}. [${note.section.toUpperCase()}] ${note.emoji} ${note.text} (${new Date(note.created_at).toLocaleDateString()})
`
      })
      context += '\n'
    }

    // Agregar respuestas de "Cuéntame quien eres"
    const cuentameResponses = userData.user_responses?.filter(r => r.activity_type === 'cuentame_quien_eres') || []
    if (cuentameResponses.length > 0) {
      context += `ACTIVIDAD "CUÉNTAME QUIÉN ERES" (${cuentameResponses.length} respuestas):
`
      cuentameResponses.forEach((response, index) => {
        const tipo = response.question === 'me_gusta' ? 'LE GUSTA' : 'NO LE GUSTA'
        context += `${index + 1}. [${tipo}] ${response.response}
`
      })
      context += '\n'
    }

    // Agregar cartas personales
    if (userData.letters && userData.letters.length > 0) {
      context += `CARTAS PERSONALES (${userData.letters.length} cartas):
`
      userData.letters.forEach((letter, index) => {
        context += `${index + 1}. "${letter.title}" - ${letter.content.substring(0, 200)}${letter.content.length > 200 ? '...' : ''} (${new Date(letter.created_at).toLocaleDateString()})
`
      })
      context += '\n'
    }

    // Agregar sesiones de meditación
    if (userData.meditation_sessions && userData.meditation_sessions.length > 0) {
      context += `SESIONES DE MEDITACIÓN (${userData.meditation_sessions.length} sesiones):
`
      userData.meditation_sessions.forEach((session, index) => {
        const completado = session.completed_at ? 'COMPLETADA' : 'INCOMPLETA'
        const duracion = Math.floor(session.watch_duration / 60)
        context += `${index + 1}. ${session.video_title} - ${completado} (${duracion} min, ${session.completion_percentage}%)
`
        if (session.reflection_text) {
          context += `   Reflexión: ${session.reflection_text.substring(0, 150)}${session.reflection_text.length > 150 ? '...' : ''}
`
        }
      })
      context += '\n'
    }

    // Agregar matches de emociones
    if (userData.emotion_matches && userData.emotion_matches.length > 0) {
      const correctos = userData.emotion_matches.filter(m => m.is_correct).length
      const total = userData.emotion_matches.length
      const precision = Math.round((correctos / total) * 100)
      
      context += `ACTIVIDAD "NOMBRA TUS EMOCIONES" (${total} intentos, ${precision}% precisión):
`
      const emocionesPorNombre: Record<string, { correctos: number, total: number }> = {}
      userData.emotion_matches.forEach(match => {
        if (!emocionesPorNombre[match.emotion_name]) {
          emocionesPorNombre[match.emotion_name] = { correctos: 0, total: 0 }
        }
        emocionesPorNombre[match.emotion_name].total++
        if (match.is_correct) {
          emocionesPorNombre[match.emotion_name].correctos++
        }
      })
      
      Object.entries(emocionesPorNombre).forEach(([emocion, stats]) => {
        const precisionEmocion = Math.round((stats.correctos / stats.total) * 100)
        context += `- ${emocion}: ${stats.correctos}/${stats.total} (${precisionEmocion}%)
`
      })
      context += '\n'
    }

    // Agregar registros de emociones
    if (userData.emotion_logs && userData.emotion_logs.length > 0) {
      context += `CALCULADORA DE EMOCIONES (${userData.emotion_logs.length} registros):
`
      const emocionesPorFrecuencia: Record<string, number> = {}
      userData.emotion_logs.forEach(log => {
        emocionesPorFrecuencia[log.emotion_name] = (emocionesPorFrecuencia[log.emotion_name] || 0) + 1
      })
      
      const emocionesOrdenadas = Object.entries(emocionesPorFrecuencia)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
      
      emocionesOrdenadas.forEach(([emocion, frecuencia]) => {
        context += `- ${emocion}: ${frecuencia} veces
`
      })
      
      // Agregar algunas notas recientes si existen
      const notasRecientes = userData.emotion_logs
        .filter(log => log.notes && log.notes.trim())
        .slice(-3)
      
      if (notasRecientes.length > 0) {
        context += 'Notas recientes:\n'
        notasRecientes.forEach((log, index) => {
          context += `${index + 1}. [${log.emotion_name}] ${log.notes}
`
        })
      }
      context += '\n'
    }

    // Agregar sesiones de manejo de ira
    if (userData.anger_management_sessions && userData.anger_management_sessions.length > 0) {
      context += `MENÚ DE LA IRA (${userData.anger_management_sessions.length} sesiones):
`
      userData.anger_management_sessions.forEach((session, index) => {
        const completado = session.completed_at ? 'COMPLETADA' : 'INCOMPLETA'
        const duracion = Math.floor(session.watch_duration / 60)
        context += `${index + 1}. ${session.video_title} - ${completado} (${duracion} min, ${session.completion_percentage}%)
`
        if (session.reflection_text) {
          context += `   Reflexión: ${session.reflection_text.substring(0, 150)}${session.reflection_text.length > 150 ? '...' : ''}
`
        }
        if (session.techniques_applied && session.techniques_applied.length > 0) {
          context += `   Técnicas aplicadas: ${session.techniques_applied.join(', ')}
`
        }
      })
      context += '\n'
    }

    return context
  },

  async chatWithAnalysis(userData: UserAnalysisData, messages: ChatMessage[]): Promise<string> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured')
    }

    try {
      // Preparar el contexto del usuario
      const userContext = this.prepareUserContext(userData)
      
      // Convertir mensajes del chat al formato de OpenAI
      const chatMessages = [
        {
          role: 'system' as const,
          content: `${SYSTEM_PROMPT}

CONTEXTO DEL USUARIO:
${userContext}

Responde de manera conversacional manteniendo tu rol de analista socioemocional. Puedes hacer análisis específicos, responder preguntas puntuales, o profundizar en aspectos particulares del desarrollo del usuario.`
        },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ]

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-2024-07-18',
          messages: chatMessages,
          max_tokens: 1500,
          temperature: 0.7,
          top_p: 0.9
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content || 'No se pudo generar la respuesta.'
    } catch (error) {
      console.error('Error in chat with analysis:', error)
      throw error
    }
  }
}