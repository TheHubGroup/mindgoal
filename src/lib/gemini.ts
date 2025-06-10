// Gemini AI Integration for Timeline Notes
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

export interface GeminiSuggestion {
  text: string
  emoji: string
  color: string
  shape: string
  font: string
}

export const generateNoteSuggestions = async (
  section: 'pasado' | 'presente' | 'futuro',
  existingNotes: string[] = []
): Promise<GeminiSuggestion[]> => {
  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key not configured')
    return getDefaultSuggestions(section)
  }

  try {
    const prompt = createPrompt(section, existingNotes)
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (generatedText) {
      return parseGeminiResponse(generatedText)
    }
  } catch (error) {
    console.error('Error generating suggestions with Gemini:', error)
  }

  return getDefaultSuggestions(section)
}

const createPrompt = (section: 'pasado' | 'presente' | 'futuro', existingNotes: string[]) => {
  const sectionPrompts = {
    pasado: 'eventos del pasado como primeros días de escuela, cumpleaños, vacaciones familiares, aprender nuevas habilidades',
    presente: 'actividades actuales como estudios, deportes, hobbies, amigos, familia',
    futuro: 'sueños y metas como profesiones futuras, lugares que quieren visitar, logros que desean alcanzar'
  }

  const existingNotesText = existingNotes.length > 0 
    ? `\nNotas existentes a evitar repetir: ${existingNotes.join(', ')}`
    : ''

  return `Genera 3 sugerencias de notas para una línea del tiempo infantil (niños de 10 años) para la sección "${section}".
Cada sugerencia debe incluir ${sectionPrompts[section]}.${existingNotesText}

Responde EXACTAMENTE en este formato JSON:
[
  {
    "text": "texto de la nota (máximo 50 caracteres)",
    "emoji": "emoji apropiado",
    "color": "color hex como #FFE4E1",
    "shape": "rounded-lg, rounded-full, o rounded-3xl",
    "font": "Fredoka, Comic Neue, o Bubblegum Sans"
  }
]

Las notas deben ser apropiadas para niños, positivas y motivadoras.`
}

const parseGeminiResponse = (response: string): GeminiSuggestion[] => {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0])
      return suggestions.filter((s: any) => 
        s.text && s.emoji && s.color && s.shape && s.font
      )
    }
  } catch (error) {
    console.error('Error parsing Gemini response:', error)
  }
  
  return []
}

const getDefaultSuggestions = (section: 'pasado' | 'presente' | 'futuro'): GeminiSuggestion[] => {
  const suggestions = {
    pasado: [
      { text: 'Mi primer día de escuela', emoji: '🎒', color: '#FFE4E1', shape: 'rounded-lg', font: 'Fredoka' },
      { text: 'Aprendí a andar en bicicleta', emoji: '🚲', color: '#FFEAA7', shape: 'rounded-full', font: 'Comic Neue' },
      { text: 'Vacaciones en la playa', emoji: '🏖️', color: '#87CEEB', shape: 'rounded-3xl', font: 'Bubblegum Sans' }
    ],
    presente: [
      { text: 'Estoy en quinto grado', emoji: '📚', color: '#98FB98', shape: 'rounded-lg', font: 'Comic Neue' },
      { text: 'Me gusta jugar fútbol', emoji: '⚽', color: '#DDA0DD', shape: 'rounded-full', font: 'Fredoka' },
      { text: 'Aprendo programación', emoji: '💻', color: '#FFB3BA', shape: 'rounded-3xl', font: 'Bubblegum Sans' }
    ],
    futuro: [
      { text: 'Quiero ser astronauta', emoji: '🚀', color: '#87CEEB', shape: 'rounded-3xl', font: 'Bubblegum Sans' },
      { text: 'Viajar por el mundo', emoji: '🌍', color: '#98FB98', shape: 'rounded-full', font: 'Fredoka' },
      { text: 'Tener una mascota', emoji: '🐕', color: '#FFEAA7', shape: 'rounded-lg', font: 'Comic Neue' }
    ]
  }
  
  return suggestions[section]
}
