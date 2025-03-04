import cron from 'node-cron'
import { Client, TextChannel } from 'discord.js'

import { logger } from '#settings'

interface ScheduleMessageOptions {
  client: Client
  channelId: string
  message: string | (() => Promise<string>)
  cronExpression: string
}

export function scheduleMessage({
  client,
  channelId,
  message,
  cronExpression,
}: ScheduleMessageOptions): void {
  cron.schedule(cronExpression, async () => {
    const channel = client.channels.cache.get(channelId) as TextChannel

    if (channel && channel.isTextBased()) {
      try {
        const finalMessage = typeof message === 'function' ? await message() : message
        await channel.send(finalMessage)
        logger.log(`Message sent to channel ${channelId}`)
      } catch (err) {
        logger.error(`Failed to send message: ${err}`)
      }
    } else {
      logger.error(`Channel ${channelId} not found or is not text-based!`)
    }
  })
}
