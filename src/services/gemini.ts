import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function getGeminiResponse(message: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' })
  const result = await model.generateContent(message)
  return result.response.text() || null
}
