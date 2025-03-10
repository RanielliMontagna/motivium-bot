import { GoogleGenerativeAI } from '@google/generative-ai'
import { SYSTEM_INSTRUCTIONS } from './system-instructions.js'

import type { MessageData } from 'database/interfaces/MessageData.js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function getGeminiResponse(message: string, history: MessageData[]) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 1,
    },
  })

  const historyContext = history.map((msg) => `(${msg.user}): ${msg.content}`).join('\n')

  const fullPrompt = `${SYSTEM_INSTRUCTIONS}\n\nHistórico da conversa:\n${historyContext}\n\nMensagem do usuário: ${message}`

  const result = await model.generateContent(fullPrompt)
  return result.response.text() || null
}
