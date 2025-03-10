import { prisma } from '#database'
import { Prisma } from '@prisma/client'

// Save a message to a channel
export async function saveMessage(channelId: string, user: string, content: string) {
  const message: Prisma.MessageCreateInput = { channelId, user, content, timestamp: new Date() }

  await prisma.message.create({ data: message })
}

// Get the most recent messages from a channel
export async function getRecentMessages(channelId: string, limit = 10) {
  const messages = await prisma.message.findMany({
    where: { channelId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  })

  return messages
}
