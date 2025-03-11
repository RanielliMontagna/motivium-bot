import { ChannelType } from 'discord.js'

import { logger } from '#settings'
import { createEvent } from '#base'
import { repositories } from '#database'
import { getAIResponse } from '#services'

const { saveMessage, getRecentMessages } = repositories.messageRepository

createEvent({
  name: 'AI Chatbot',
  event: 'messageCreate',
  async run(message) {
    if (!isValidMessage(message)) return

    try {
      await message.channel.sendTyping()

      // Recover the last 10 messages from the channel
      const history = await getRecentMessages(message.channelId, 10)

      // Get the AI response
      const result = await getAIResponse(message.content, history)

      if (result.success) {
        await message.reply(result.response)

        // Save the bot message to the channel history
        await saveMessage(message.channelId, 'bot', result.response)
      } else {
        await message.reply(
          result.message || 'Desculpe, ocorreu um erro ao processar sua mensagem.',
        )
      }

      // Save the user message to the channel history
      await saveMessage(message.channelId, message.author.username, message.content)
    } catch (error) {
      logger.error('Unexpected error processing message:', error)
      await message.reply('Desculpe, ocorreu um erro inesperado ao processar sua mensagem.')
    }
  },
})

function isValidMessage(message: any) {
  if (message.author.bot) return false // Evita loops com bots

  const chatbotChannelsIds = process.env.AI_CHANNELS_IDS?.split(',')

  if (!chatbotChannelsIds?.length || !chatbotChannelsIds.includes(message.channelId)) return false

  if (message.channel.type !== ChannelType.GuildText) {
    logger.warn(`Channel ${message.channelId} is not a text channel`)
    return false
  }

  return true
}
