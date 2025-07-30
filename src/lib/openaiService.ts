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
      console.error('❌ OpenAI API key not configured')
      
      // Modo demostración - generar análisis de ejemplo
      console.log('🎭 Ejecutando en modo demostración')
      return this.generateDemoAnalysis(userData)
    }

    try {
      // Preparar el contexto del usuario
      const userContext = this.prepareUserContext(userData)
      
      // Preparar el mensaje del usuario
      const userMessage = customQuestion || 
        "Por favor, realiza un análisis socioemocional completo de este usuario basado en todos los datos disponibles."

      console.log('🔍 Iniciando análisis con OpenAI...')
      console.log('📊 Contexto del usuario preparado:', userContext.length, 'caracteres')

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
        console.error('❌ Error en respuesta de OpenAI:', response.status, response.statusText)
        const errorData = await response.json()
        console.error('❌ Detalles del error:', errorData)
        
        if (response.status === 401) {
          return 'Error: Clave de API de OpenAI inválida o expirada. Por favor, verifica la configuración.'
        } else if (response.status === 429) {
          return 'Error: Se ha excedido el límite de uso de la API de OpenAI. Por favor, intenta más tarde.'
        } else if (response.status === 400) {
          return 'Error: Solicitud inválida a OpenAI. El contenido puede ser demasiado largo o contener caracteres no válidos.'
        } else {
          return `Error de OpenAI (${response.status}): ${errorData.error?.message || 'Error desconocido'}`
        }
      }

      const data = await response.json()
      console.log('✅ Respuesta exitosa de OpenAI')
      
      const analysis = data.choices[0]?.message?.content
      if (!analysis) {
        console.error('❌ No se recibió contenido en la respuesta de OpenAI:', data)
        return 'Error: OpenAI no devolvió contenido en la respuesta. Por favor, intenta de nuevo.'
      }
      
      return analysis
    } catch (error) {
      console.error('Error calling OpenAI API:', error)
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return 'Error de conexión: No se pudo conectar con OpenAI. Verifica tu conexión a internet.'
      } else if (error instanceof SyntaxError) {
        return 'Error: Respuesta inválida de OpenAI. Por favor, intenta de nuevo.'
      } else {
        return `Error inesperado: ${error.message || 'Error desconocido al comunicarse con OpenAI'}`
      }
    }
  },

  generateDemoAnalysis(userData: UserAnalysisData): string {
    const userName = `${userData.nombre} ${userData.apellido}`.trim()
    const edad = userData.edad
    const grado = userData.grado
    
    // Contar actividades para personalizar el análisis
    const timelineCount = userData.timeline_notes?.length || 0
    const lettersCount = userData.letters?.length || 0
    const responsesCount = userData.user_responses?.length || 0
    const meditationCount = userData.meditation_sessions?.length || 0
    const emotionLogsCount = userData.emotion_logs?.length || 0
    
    return `# ANÁLISIS SOCIOEMOCIONAL - MODO DEMOSTRACIÓN

**Usuario:** ${userName} (${edad} años, ${grado})
**Fecha:** ${new Date().toLocaleDateString('es-ES')}

---

## 1. RESUMEN GENERAL DEL ESTADO SOCIOEMOCIONAL

${userName} muestra un perfil socioemocional en desarrollo típico para su edad. A través de las ${timelineCount + lettersCount + responsesCount + meditationCount + emotionLogsCount} actividades completadas en la plataforma, se observa un estudiante que está explorando activamente su mundo interior y desarrollando habilidades de autoconocimiento.

${timelineCount > 0 ? `La creación de ${timelineCount} notas en su línea del tiempo indica una capacidad reflexiva desarrollada y un interés por organizar sus experiencias temporalmente.` : ''}

${lettersCount > 0 ? `Las ${lettersCount} cartas personales escritas demuestran una habilidad notable para la introspección y la comunicación escrita de emociones.` : ''}

## 2. RASGOS OBSERVABLES DE PERSONALIDAD EMOCIONAL

- **Capacidad reflexiva:** Demuestra interés por el autoconocimiento a través de su participación en actividades introspectivas
- **Expresión emocional:** ${lettersCount > 0 ? 'Muestra facilidad para expresar pensamientos y sentimientos por escrito' : 'Está desarrollando habilidades de expresión emocional'}
- **Organización temporal:** ${timelineCount > 0 ? 'Capacidad para estructurar experiencias en el tiempo' : 'En proceso de desarrollar perspectiva temporal'}
- **Compromiso con el crecimiento:** Su participación activa indica motivación hacia el desarrollo personal

## 3. TEMAS A CONSIDERAR

- **Desarrollo de la identidad:** Como es típico en su grupo etario, está en proceso de construcción de su identidad personal
- **Necesidad de validación:** Puede beneficiarse de reconocimiento positivo por sus esfuerzos de autoconocimiento
- **Equilibrio emocional:** Importante mantener un balance entre introspección y actividades sociales

## 4. CONDUCTAS OBSERVABLES ESPERADAS

En el entorno escolar y familiar, es probable observar:
- Mayor consciencia de sus propias emociones y reacciones
- Interés por actividades que involucren reflexión personal
- Posible tendencia a analizar situaciones antes de reaccionar
- Capacidad creciente para verbalizar sus sentimientos

## 5. OPORTUNIDADES PARA POTENCIAR HABILIDADES

**Áreas de fortalecimiento recomendadas:**
- **Autorregulación emocional:** Continuar desarrollando estrategias de manejo emocional
- **Comunicación asertiva:** Fortalecer la expresión de necesidades y límites
- **Empatía:** Expandir la comprensión de las emociones de otros
- **Resiliencia:** Desarrollar herramientas para enfrentar desafíos

## 6. SUGERENCIAS PRÁCTICAS DE ACOMPAÑAMIENTO

**Para padres y educadores:**

- **Validar su proceso:** Reconocer y valorar sus esfuerzos de autoconocimiento
- **Crear espacios de diálogo:** Establecer momentos regulares para conversaciones emocionales
- **Modelar inteligencia emocional:** Demostrar manejo saludable de emociones propias
- **Fomentar la escritura:** Continuar promoviendo la expresión escrita como herramienta de procesamiento
- **Equilibrar introspección y socialización:** Asegurar tiempo tanto para reflexión personal como para interacción social

**Actividades recomendadas:**
- Journaling o diario emocional regular
- Actividades de mindfulness apropiadas para su edad
- Proyectos creativos que permitan expresión emocional
- Conversaciones familiares sobre emociones y experiencias

---

*Este análisis está basado en las actividades completadas en la plataforma Mind Goal. Para una evaluación más completa, se recomienda observación directa en contextos reales y, si es necesario, consulta con profesionales especializados en desarrollo socioemocional.*

**Nota:** Este es un análisis de demostración generado automáticamente. Para análisis personalizados completos, configure la integración con OpenAI.`
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
      console.error('❌ OpenAI API key not configured for chat')
      
      // Modo demostración para chat
      console.log('🎭 Chat en modo demostración')
      return this.generateDemoChatResponse(userData, messages)
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

      console.log('💬 Enviando mensaje de chat a OpenAI...')

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
        console.error('❌ Error en chat con OpenAI:', response.status, response.statusText)
        const errorData = await response.json()
        console.error('❌ Detalles del error de chat:', errorData)
        
        if (response.status === 401) {
          return 'Error: Clave de API de OpenAI inválida para el chat.'
        } else if (response.status === 429) {
          return 'Error: Límite de uso excedido. Intenta más tarde.'
        } else {
          return `Error de chat (${response.status}): ${errorData.error?.message || 'Error desconocido'}`
        }
      }

      const data = await response.json()
      console.log('✅ Respuesta de chat exitosa')
      
      const chatResponse = data.choices[0]?.message?.content
      if (!chatResponse) {
        console.error('❌ No se recibió contenido en la respuesta de chat:', data)
        return 'Error: No se pudo generar la respuesta del chat.'
      }
      
      return chatResponse
    } catch (error) {
      console.error('Error in chat with analysis:', error)
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        return 'Error de conexión en el chat. Verifica tu conexión a internet.'
      } else {
        return `Error en el chat: ${error.message || 'Error desconocido'}`
      }
    }
  },

  generateDemoChatResponse(userData: UserAnalysisData, messages: ChatMessage[]): string {
    const lastMessage = messages[messages.length - 1]
    const userName = `${userData.nombre} ${userData.apellido}`.trim()
    
    // Respuestas de demostración basadas en palabras clave
    const userQuestion = lastMessage.content.toLowerCase()
    
    if (userQuestion.includes('emocion') || userQuestion.includes('sentimiento')) {
      return `Basándome en las actividades de ${userName}, observo un desarrollo emocional apropiado para su edad. ${userData.emotion_logs?.length ? `Los ${userData.emotion_logs.length} registros emocionales muestran una buena capacidad de autoconocimiento.` : 'Sería beneficioso fomentar más actividades de reconocimiento emocional.'} 

Es importante continuar validando sus emociones y ayudarle a desarrollar un vocabulario emocional más amplio.

*Nota: Esta es una respuesta de demostración. Para análisis personalizados, configure la API de OpenAI.*`
    }
    
    if (userQuestion.includes('recomendacion') || userQuestion.includes('sugerencia')) {
      return `Para ${userName}, recomiendo:

**Estrategias inmediatas:**
- Mantener rutinas de reflexión personal
- Fomentar la expresión creativa
- Crear espacios de diálogo familiar

**A largo plazo:**
- Desarrollar habilidades de autorregulación
- Fortalecer la comunicación asertiva
- Promover la empatía hacia otros

*Nota: Esta es una respuesta de demostración. Para recomendaciones personalizadas detalladas, configure la API de OpenAI.*`
    }
    
    if (userQuestion.includes('comportamiento') || userQuestion.includes('conducta')) {
      return `En cuanto al comportamiento de ${userName}, es probable observar:

**En el aula:**
- Mayor consciencia de sus reacciones emocionales
- Posible tendencia a reflexionar antes de actuar
- Interés por actividades que involucren autoconocimiento

**En casa:**
- Momentos de introspección
- Posible necesidad de validación emocional
- Capacidad creciente para expresar sentimientos

*Nota: Esta es una respuesta de demostración basada en patrones generales.*`
    }
    
    // Respuesta genérica
    return `Gracias por tu pregunta sobre ${userName}. En modo demostración, puedo ofrecer insights generales basados en las actividades completadas.

Para obtener análisis específicos y personalizados que respondan directamente a tu pregunta, es necesario configurar la integración con OpenAI.

**¿Te gustaría que te ayude con:**
- Configuración de la API de OpenAI
- Interpretación de las actividades específicas
- Sugerencias generales de acompañamiento

*Nota: Este es el modo demostración. Para análisis completos y personalizados, configure la variable de entorno VITE_OPENAI_API_KEY.*`
  }
}