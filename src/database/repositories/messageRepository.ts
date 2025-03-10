import { db } from '#database'

import type { MessageData } from 'database/interfaces/MessageData.js'

// Save a message to a channel
export async function saveMessage(channelId: string, user: string, content: string) {
  const message: MessageData = {
    channelId,
    user,
    content,
    timestamp: Date.now(),
  }

  await db.messages.push(`history_${channelId}`, message)
}

// Get the most recent messages from a channel
export async function getRecentMessages(channelId: string, limit = 10) {
  const messages: MessageData[] = (await db.messages.get(`history_${channelId}`)) || []
  return messages.slice(-limit)
}
