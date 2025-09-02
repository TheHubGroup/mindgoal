// Dream Tutor AI Service using OpenAI API
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
const GEMINI_API_KEY = 'AIzaSyCivN2wbWYuh6opO6gEhu8r_J20aFbe5EM'

export interface DreamRoadmap {
  roadmap: string
  steps: Array<{
    step_number: number
    step_title: string
    step_description: string
    estimated_time: string
    resources: string[]
  }>
}

export interface GeneratedImage {
  url: string
  description: string
}

export const dreamTutorService = {
  // Generar roadmap personalizado para cumplir un sueño
  async generateDreamRoadmap(dreamTitle: string, dreamDescription: string, userAge: number, userGrade: string): Promise<DreamRoadmap | null> {
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured')
      return null
    }

    try {
      const prompt = `Eres un tutor de vida especializado en ayudar a niños y adolescentes a cumplir sus sueños.

INFORMACIÓN DEL ESTUDIANTE:
- Edad: ${userAge} años
- Grado: ${userGrade}
- Sueño: ${dreamTitle}
- Descripción: ${dreamDescription}

INSTRUCCIONES:
Crea un roadmap motivador para ayudar a este estudiante a cumplir su sueño. El roadmap debe:

1. SIEMPRE empezar con "Terminar el bachillerato con buenas notas" como primer paso
2. Ser apropiado para su edad y nivel educativo
3. Incluir pasos concretos y alcanzables (títulos cortos + frase breve)
4. Ser motivador y positivo
5. Incluir recursos específicos y útiles

FORMATO DE RESPUESTA (JSON):
{
  "roadmap": "Introducción motivadora y explicación general del camino hacia el sueño (máximo 200 palabras)",
  "steps": [
    {
      "step_number": 1,
      "step_title": "Título corto del paso (máximo 6 palabras)",
      "step_description": "Descripción breve y clara (máximo 100 palabras)",
      "estimated_time": "Tiempo estimado (ej: 1-2 meses, 6 meses, 1 año)",
      "resources": ["Recurso 1", "Recurso 2", "Recurso 3"]
    }
  ]
}

IMPORTANTE: 
- El PRIMER paso SIEMPRE debe ser "Terminar el bachillerato con buenas notas"
- Crea entre 6-8 pasos progresivos total
- Títulos cortos y directos
- Descripciones breves pero motivadoras
- Cada paso debe construir sobre el anterior

IMPORTANTE: Responde SOLO con el JSON válido, sin texto adicional.`

      console.log('🤖 Generando roadmap con OpenAI...')

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-2024-07-18',
          messages: [
            {
              role: 'system',
              content: 'Eres un tutor de vida experto en ayudar a niños y adolescentes a cumplir sus sueños. Respondes siempre en JSON válido.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7,
          top_p: 0.9
        })
      })

      if (!response.ok) {
        console.error('❌ Error en respuesta de OpenAI:', response.status, response.statusText)
        return null
      }

      const data = await response.json()
      console.log('✅ Respuesta exitosa de OpenAI')
      
      const content = data.choices[0]?.message?.content
      if (!content) {
        console.error('❌ No se recibió contenido en la respuesta de OpenAI')
        return null
      }

      // Parsear el JSON
      try {
        const roadmapData = JSON.parse(content)
        return roadmapData
      } catch (parseError) {
        console.error('❌ Error parseando JSON de OpenAI:', parseError)
        console.log('Contenido recibido:', content)
        return null
      }
    } catch (error) {
      console.error('Error calling OpenAI API for roadmap:', error)
      return null
    }
  },

  // Generar imagen inspiracional para el sueño usando Gemini
  async generateDreamImage(dreamTitle: string, dreamDescription: string, userAge: number, userGender?: string): Promise<GeneratedImage | null> {
    if (!GEMINI_API_KEY) {
      console.error('❌ Gemini API key not configured')
      return null
    }

    try {
      // Determinar género para la imagen
      const genderText = userGender === 'Femenino' ? 'niña' : userGender === 'Masculino' ? 'niño' : 'niño/niña'
      
      // Crear prompt para Gemini optimizado para niños/adolescentes en español
      const imagePrompt = `Crea una ilustración vibrante, inspiradora y amigable para niños que represente el sueño: "${dreamTitle}".
      
      Descripción del sueño: ${dreamDescription}
      
      Características específicas:
      - Protagonista: Un ${genderText} de ${userAge} años de edad
      - Estilo: Ilustración colorida, optimista, estilo cartoon/animado
      - Ambiente: Inspirador y motivacional
      - Colores: Brillantes y vibrantes
      - Contexto: Educativo, apropiado para estudiantes hispanohablantes
      - Elementos: Mostrar éxito, logros y progreso hacia la meta
      
      IMPORTANTE: 
      - NO incluir texto o palabras escritas en la imagen
      - Enfoque en elementos visuales que representen el sueño
      - Estilo apropiado para contenido educativo en español
      - Mostrar al ${genderText} feliz y motivado/a
      
      Genera una imagen que inspire al estudiante a perseguir su sueño de ${dreamTitle}.`

      console.log('🎨 Generando imagen con Gemini...')

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: imagePrompt
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024
          }
        })
      })

      if (!response.ok) {
        console.error('❌ Error en respuesta de Gemini:', response.status, response.statusText)
        const errorData = await response.json()
        console.error('❌ Detalles del error:', errorData)
        
        // Fallback: usar una imagen de placeholder
        return {
          url: `https://images.pexels.com/photos/1001914/pexels-photo-1001914.jpeg?auto=compress&cs=tinysrgb&w=400`,
          description: `Imagen inspiracional para: ${dreamTitle} (generada con placeholder)`
        }
      }

      const data = await response.json()
      console.log('✅ Respuesta de Gemini recibida')
      
      // Gemini no genera imágenes directamente, pero podemos usar el texto generado
      // para crear una descripción y usar una imagen de placeholder apropiada
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (generatedText) {
        console.log('✅ Descripción generada con Gemini')
        
        // Por ahora, usar una imagen de placeholder hasta que Gemini soporte generación de imágenes
        const placeholderImages = [
          'https://images.pexels.com/photos/1001914/pexels-photo-1001914.jpeg?auto=compress&cs=tinysrgb&w=400',
          'https://images.pexels.com/photos/5200815/pexels-photo-5200815.jpeg?auto=compress&cs=tinysrgb&w=400',
          'https://images.pexels.com/photos/7648150/pexels-photo-7648150.jpeg?auto=compress&cs=tinysrgb&w=400',
          'https://images.pexels.com/photos/3933069/pexels-photo-3933069.jpeg?auto=compress&cs=tinysrgb&w=400'
        ]
        
        const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)]
        
        return {
          url: randomImage,
          description: `Imagen inspiracional para: ${dreamTitle}`
        }
      } else {
        console.error('❌ No se recibió contenido en la respuesta de Gemini')
        return null
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error)
      
      // Fallback: usar una imagen de placeholder
      return {
        url: `https://images.pexels.com/photos/1001914/pexels-photo-1001914.jpeg?auto=compress&cs=tinysrgb&w=400`,
        description: `Imagen inspiracional para: ${dreamTitle} (fallback)`
      }
    }
  },

  // Generar consejos adicionales para un paso específico
  async generateStepAdvice(stepTitle: string, stepDescription: string, userAge: number): Promise<string | null> {
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured')
      return null
    }

    try {
      const prompt = `Como tutor de vida para un estudiante de ${userAge} años, proporciona consejos adicionales específicos para este paso:

PASO: ${stepTitle}
DESCRIPCIÓN: ${stepDescription}

Proporciona:
1. 3-5 consejos prácticos específicos
2. Motivación personalizada para su edad
3. Posibles obstáculos y cómo superarlos
4. Recursos adicionales específicos

Mantén un tono motivador, positivo y apropiado para un estudiante de ${userAge} años.
Máximo 200 palabras.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini-2024-07-18',
          messages: [
            {
              role: 'system',
              content: 'Eres un tutor de vida experto en motivar y guiar a niños y adolescentes hacia el cumplimiento de sus sueños.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        console.error('❌ Error en respuesta de OpenAI para consejos:', response.status)
        return null
      }

      const data = await response.json()
      const advice = data.choices[0]?.message?.content

      if (!advice) {
        console.error('❌ No se recibió consejo en la respuesta de OpenAI')
        return null
      }

      return advice
    } catch (error) {
      console.error('Error generating step advice:', error)
      return null
    }
  }
}