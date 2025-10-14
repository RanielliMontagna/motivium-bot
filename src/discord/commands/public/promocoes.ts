import { createCommand } from '#base'
import { TelegramService, TelegramError, TelegramAuthError } from '#services'
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  Colors,
  EmbedBuilder,
} from 'discord.js'

createCommand({
  name: 'promocoes-manual',
  description: 'Busca manual de promoções nos canais do Telegram',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'canal',
      description: 'Nome do canal do Telegram (opcional)',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],
  async run(interaction) {
    await interaction.deferReply()

    try {
      const channelName = interaction.options.getString('canal')
      const telegramChannels = process.env.TELEGRAM_PROMOTIONS_CHANNELS?.split(',') || []

      if (!telegramChannels.length) {
        await interaction.editReply({
          content: '❌ Nenhum canal do Telegram está configurado para promoções.',
        })
        return
      }

      const channelsToSearch = channelName ? [channelName] : telegramChannels

      const telegramService = TelegramService.getInstance({
        apiId: Number(process.env.TELEGRAM_API_ID),
        apiHash: process.env.TELEGRAM_API_HASH!,
        phoneNumber: process.env.TELEGRAM_PHONE_NUMBER,
        password: process.env.TELEGRAM_PASSWORD,
        sessionString: process.env.TELEGRAM_SESSION_STRING,
      })

      const initPromise = telegramService.initialize()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout waiting for Telegram code')), 5000)
      })

      await Promise.race([initPromise, timeoutPromise])

      const promotions = await telegramService.searchPromotions({
        channels: channelsToSearch,
        keywords: ['promoção', 'desconto', '% off', 'oferta', 'cupom', 'sale'],
        limit: 10,
      })

      await telegramService.disconnect()

      if (!promotions.length) {
        await interaction.editReply({
          content: '🔍 Nenhuma promoção encontrada nos canais configurados.',
        })
        return
      }

      const embed = new EmbedBuilder()
        .setTitle('🛍️ Promoções Encontradas')
        .setColor(Colors.Green)
        .setTimestamp()
        .setFooter({
          text: `Encontradas ${promotions.length} promoções`,
        })

      // Show up to 3 promotions
      const promotionsToShow = promotions.slice(0, 3)

      promotionsToShow.forEach((promotion) => {
        const message =
          promotion.message.length > 200
            ? `${promotion.message.substring(0, 200)}...`
            : promotion.message

        embed.addFields({
          name: `📢 ${promotion.channel.replace('@', '')}`,
          value: `${message}\n\n*${new Date(promotion.date * 1000).toLocaleString('pt-BR')}*`,
          inline: false,
        })
      })

      if (promotions.length > 3) {
        embed.addFields({
          name: '📊 Mais promoções',
          value: `E mais ${promotions.length - 3} promoções encontradas...`,
          inline: false,
        })
      }

      await interaction.editReply({
        embeds: [embed],
      })
    } catch (error) {
      console.error('Error fetching promotions:', error)

      let embed: EmbedBuilder

      if (
        error instanceof TelegramAuthError ||
        (error instanceof Error && error.message.includes('Timeout waiting for Telegram code'))
      ) {
        embed = new EmbedBuilder()
          .setColor(Colors.Orange)
          .setTitle('📱 Autenticação Necessária')
          .setDescription('É necessário inserir o código Telegram.')
          .addFields(
            {
              name: '📨 Código Telegram Solicitado',
              value:
                '1. Verifique seu celular - você deve ter recebido um código no Telegram\n2. Use o comando `/telegramcode <codigo>`\n3. Execute `/promocoes` novamente após inserir o código',
              inline: false,
            },
            {
              name: '📞 Exemplo',
              value: 'Se recebeu o código `12345`: `/telegramcode 12345`',
              inline: false,
            },
          )
          .setFooter({ text: 'O código Telegram expira em alguns minutos' })
      } else if (error instanceof TelegramError) {
        embed = new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('❌ Erro de Conexão')
          .setDescription('Não foi possível conectar ao Telegram.')
          .addFields({
            name: '🔧 Possíveis soluções',
            value:
              '• Verifique sua conexão com internet\n• Tente novamente em alguns minutos\n• Verifique as configurações no `.env`',
            inline: false,
          })
      } else {
        embed = new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('❌ Erro Inesperado')
          .setDescription('Ocorreu um erro ao buscar as promoções.')
          .addFields({
            name: '🐛 Detalhes do erro',
            value: error instanceof Error ? error.message : 'Erro desconhecido',
            inline: false,
          })
      }

      await interaction.editReply({ embeds: [embed] })
    }
  },
})
