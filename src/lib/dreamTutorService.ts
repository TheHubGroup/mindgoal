// Dream Tutor AI Service using OpenAI API
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

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
Crea un roadmap detallado y motivador para ayudar a este estudiante a cumplir su sueño. El roadmap debe:

1. Ser apropiado para su edad y nivel educativo
2. Incluir pasos concretos y alcanzables
3. Ser motivador y positivo
4. Incluir recursos específicos y útiles
5. Tener estimaciones de tiempo realistas

FORMATO DE RESPUESTA (JSON):
{
  "roadmap": "Introducción motivadora y explicación general del camino hacia el sueño (máximo 300 palabras)",
  "steps": [
    {
      "step_number": 1,
      "step_title": "Título del paso",
      "step_description": "Descripción detallada de qué hacer en este paso",
      "estimated_time": "Tiempo estimado (ej: 1-2 meses, 6 meses, 1 año)",
      "resources": ["Recurso 1", "Recurso 2", "Recurso 3"]
    }
  ]
}

Crea entre 5-8 pasos progresivos que lleven desde donde está ahora hasta cumplir su sueño. Cada paso debe construir sobre el anterior.

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

  // Generar imagen inspiracional para el sueño usando DALL-E
  async generateDreamImage(dreamTitle: string, dreamDescription: string, userAge: number): Promise<GeneratedImage | null> {
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured')
      return null
    }

    try {
      // Crear prompt para DALL-E optimizado para niños/adolescentes
      const imagePrompt = `A vibrant, inspiring, and child-friendly illustration representing the dream: "${dreamTitle}". 
      
      Style: Colorful, optimistic, cartoon-like illustration suitable for a ${userAge}-year-old. 
      
      Content: ${dreamDescription}
      
      The image should be:
      - Bright and colorful
      - Inspiring and motivational
      - Age-appropriate for a ${userAge}-year-old
      - Professional but fun
      - Showing success and achievement
      - No text or words in the image
      
      Art style: Digital illustration, bright colors, optimistic mood, suitable for educational content.`

      console.log('🎨 Generando imagen con DALL-E...')

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: imagePrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          style: 'vivid'
        })
      })

      if (!response.ok) {
        console.error('❌ Error en respuesta de DALL-E:', response.status, response.statusText)
        const errorData = await response.json()
        console.error('❌ Detalles del error:', errorData)
        return null
      }

      const data = await response.json()
      console.log('✅ Imagen generada exitosamente con DALL-E')
      
      const imageUrl = data.data[0]?.url
      if (!imageUrl) {
        console.error('❌ No se recibió URL de imagen en la respuesta de DALL-E')
        return null
      }

      return {
        url: imageUrl,
        description: `Imagen inspiracional para: ${dreamTitle}`
      }
    } catch (error) {
      console.error('Error calling DALL-E API:', error)
      return null
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