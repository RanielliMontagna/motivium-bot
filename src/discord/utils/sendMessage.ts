import { Client, ColorResolvable, Colors, EmbedBuilder, TextChannel } from 'discord.js'

import { logger } from '#settings'

interface ScheduleMessageOptions {
  client: Client
  channelId: string
  title?: string
  message: string | (() => Promise<string>)
  footer?: string
  imageUrl?: string | (() => Promise<string | undefined>)
  color?: ColorResolvable
}

export async function sendMessage({
  client,
  channelId,
  title,
  message,
  footer,
  imageUrl,
  color = Colors.Blue,
}: ScheduleMessageOptions): Promise<void> {
  const channel = client.channels.cache.get(channelId) as TextChannel

  if (channel && channel.isTextBased()) {
    try {
      const finalMessage = typeof message === 'function' ? await message() : message
      const finalImageUrl = imageUrl
        ? typeof imageUrl === 'function'
          ? await imageUrl()
          : imageUrl
        : undefined

      const embed = new EmbedBuilder().setDescription(finalMessage).setColor(color)

      if (title) embed.setTitle(title)
      if (finalImageUrl) embed.setImage(finalImageUrl)
      if (footer) embed.setFooter({ text: footer })

      await channel.send({ embeds: [embed] })

      logger.log(`Message sent to channel ${channelId}`)
    } catch (err) {
      logger.error(`Failed to send message: ${err}`)
    }
  } else {
    logger.error(`Channel ${channelId} not found or is not text-based!`)
  }
}
