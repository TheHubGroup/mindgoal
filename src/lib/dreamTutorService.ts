// Dream Tutor AI Service using OpenAI API
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY
import { supabase } from './supabase'

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

  // Generar imagen inspiracional para el sueño usando DALL-E
  async generateDreamImage(dreamTitle: string, dreamDescription: string, userAge: number, userGender?: string): Promise<GeneratedImage | null> {
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured')
      return null
    }

    try {
      // Determinar género para la imagen
      const genderText = userGender === 'Femenino' ? 'niña' : userGender === 'Masculino' ? 'niño' : 'niño/niña'
      
      // Crear prompt para DALL-E optimizado para niños/adolescentes
      const imagePrompt = `Una ilustración vibrante, inspiradora y amigable para niños latinoamericanos que represente el sueño: "${dreamTitle}".
      
      Estilo: Ilustración colorida, optimista, estilo cartoon adecuada para un ${genderText} latinoamericano/a de ${userAge} años con características físicas latinas.
      
      Contenido: ${dreamDescription}
      
      La imagen debe ser:
      - Brillante y colorida
      - Inspiradora y motivacional
      - Apropiada para un ${genderText} de ${userAge} años
      - Con características físicas latinoamericanas (piel morena/trigueña, cabello oscuro)
      - Representando la diversidad cultural latina
      - Profesional pero divertida
      - Mostrando éxito y logros
      - Sin texto o palabras en la imagen
      - Con un ${genderText} latinoamericano/a como protagonista
      
      Estilo artístico: Ilustración digital, colores brillantes, ambiente optimista, con influencia cultural latinoamericana, adecuado para contenido educativo en español para niños latinos.`

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

      // Fetch the image data from DALL-E URL
      console.log('📥 Descargando imagen de DALL-E...')
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        console.error('❌ Error descargando imagen de DALL-E:', imageResponse.status)
        return null
      }

      const imageBlob = await imageResponse.blob()
      const fileName = `dream_${Date.now()}_${Math.random().toString(36).substring(7)}.png`

      // Upload to Supabase Storage
      console.log('☁️ Subiendo imagen a Supabase Storage...')
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dream_images')
        .upload(fileName, imageBlob, {
          contentType: 'image/png',
          cacheControl: '3600'
        })

      if (uploadError) {
        console.error('❌ Error subiendo imagen a Supabase:', uploadError)
        return null
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('dream_images')
        .getPublicUrl(fileName)

      const permanentImageUrl = publicUrlData.publicUrl
      console.log('✅ Imagen guardada permanentemente en Supabase Storage')

      return {
        url: permanentImageUrl,
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