import { logger } from '#settings'

import { getGeminiResponse } from './gemini.js'
import { getChatGPTResponse } from './openai.js'

async function tryGetChatGPTResponse(message: string) {
  try {
    const response = await getChatGPTResponse(message)
    if (response) {
      return { success: true, response } as const
    }
    return { success: false, error: new Error('No response from ChatGPT') } as const
  } catch (error: any) {
    const isQuotaError = error?.error?.type === 'insufficient_quota' || error?.status === 429
    return { success: false, error, isQuotaError } as const
  }
}

async function tryGetGeminiResponse(message: string) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: new Error('GEMINI_API_KEY not configured') } as const
    }

    const response = await getGeminiResponse(message)
    if (response) {
      return { success: true, response } as const
    }
    return { success: false, error: new Error('No response from Gemini') } as const
  } catch (error) {
    return { success: false, error } as const
  }
}

export async function getAIResponse(message: string) {
  // Using ChatGPT as primary AI
  const chatGPTResult = await tryGetChatGPTResponse(message)

  if (chatGPTResult.success) {
    return { success: true, response: chatGPTResult.response } as const
  }

  logger.error('Error getting ChatGPT response:', chatGPTResult.error)

  logger.warn('ChatGPT failed, trying Gemini API')

  const geminiResult = await tryGetGeminiResponse(message)

  if (geminiResult.success) {
    return { success: true, response: geminiResult.response } as const
  }

  logger.error('Error getting Gemini response:', geminiResult.error)
  return {
    success: false,
    error: geminiResult.error,
    message: 'Desculpe, não consegui encontrar uma resposta para isso 😔',
  } as const
}
