import { GoogleGenerativeAI } from '@google/generative-ai'
import { SYSTEM_INSTRUCTIONS } from './system-instructions.js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function getGeminiResponse(message: string) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 1,
    },
  })

  const fullPrompt = `${SYSTEM_INSTRUCTIONS} Mensagem do usuário: ${message}`

  const result = await model.generateContent(fullPrompt)
  return result.response.text() || null
}
