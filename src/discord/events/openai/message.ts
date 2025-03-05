import { ChannelType } from 'discord.js'

import { createEvent } from '#base'
import { logger } from '#settings'
import { getAIResponse } from '#services'

createEvent({
  name: 'OpenAI message handler',
  event: 'messageCreate',
  async run(message) {
    if (!isValidMessage(message)) return

    try {
      await message.channel.sendTyping()

      const result = await getAIResponse(message.content)

      if (result.success) {
        await message.reply(result.response)
      } else {
        await message.reply(
          result.message || 'Desculpe, ocorreu um erro ao processar sua mensagem.',
        )
      }
    } catch (error) {
      logger.error('Unexpected error processing message:', error)
      await message.reply('Desculpe, ocorreu um erro inesperado ao processar sua mensagem.')
    }
  },
})

function isValidMessage(message: any) {
  // Ignore messages from bots to prevent potential loops
  if (message.author.bot) return false

  const openaiChannelsIds = process.env.AI_CHANNELS_IDS?.split(',')

  // Check if channels are configured and message is from a configured channel
  if (!openaiChannelsIds?.length) return false
  if (!openaiChannelsIds.includes(message.channelId)) return false

  // Ensure the channel is text-based
  if (message.channel.type !== ChannelType.GuildText) {
    logger.warn(`Channel ${message.channelId} is not a text channel`)
    return false
  }

  return true
}
