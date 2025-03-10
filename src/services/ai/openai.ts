import OpenAI from 'openai'
import { SYSTEM_INSTRUCTIONS } from './system-instructions.js'

import type { MessageData } from 'database/interfaces/MessageData.js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function getChatGPTResponse(message: string, history: MessageData[]) {
  const formattedHistory = history.map((msg) => ({
    role: 'user' as const,
    content: `${msg.user}: ${msg.content}`,
  }))

  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: SYSTEM_INSTRUCTIONS },
      ...formattedHistory,
      { role: 'user', content: message },
    ],
    model: 'gpt-3.5-turbo',
    max_tokens: 1024,
    temperature: 1,
  })

  return completion.choices[0]?.message?.content || null
}
