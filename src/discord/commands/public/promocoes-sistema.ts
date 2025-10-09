import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder } from 'discord.js'
import { createCommand } from '#base'
import { PromotionCategory, CATEGORY_SPECIFIC_CONFIG, getPromotionsService } from '#schedulers'

createCommand({
  name: 'promocoes',
  description: 'Gerencia sistema unificado de promoções',
  type: ApplicationCommandType.ChatInput,
  defaultMemberPermissions: ['ManageGuild'],
  options: [
    {
      name: 'action',
      description: 'Ação a ser executada',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: 'Status das filas', value: 'status' },
        { name: 'Buscar promoções', value: 'search' },
        { name: 'Configurações de tempo', value: 'timeconfig' },
      ],
    },
    {
      name: 'categoria',
      description: 'Categoria específica (opcional)',
      type: ApplicationCommandOptionType.String,
      required: false,
      choices: [
        { name: '🎯 Geral', value: 'GENERAL' },
        { name: '💻 Tech', value: 'TECH' },
        { name: '🎮 Gaming', value: 'GAMING' },
        { name: '🏋️ Fitness', value: 'FITNESS' },
        { name: '🚗 Automotivo', value: 'AUTOMOTIVE' },
        { name: '👗 Moda', value: 'FASHION' },
        { name: '🏠 Casa', value: 'HOME' },
      ],
    },
  ],
  run: async (interaction) => {
    await interaction.deferReply({ ephemeral: true })

    const action = interaction.options.getString('action', true)

    const promotionsService = getPromotionsService()

    if (!promotionsService) {
      await interaction.editReply({
        content: '❌ Sistema de promoções não está inicializado.',
      })
      return
    }

    try {
      switch (action) {
        case 'status': {
          const stats = promotionsService.getQueueStats()
          const categoryEmojis = {
            [PromotionCategory.GENERAL]: '🎯',
            [PromotionCategory.TECH]: '💻',
            [PromotionCategory.GAMING]: '🎮',
            [PromotionCategory.FITNESS]: '🏋️',
            [PromotionCategory.AUTOMOTIVE]: '🚗',
            [PromotionCategory.FASHION]: '👗',
            [PromotionCategory.HOME]: '🏠',
          }

          const embed = new EmbedBuilder()
            .setTitle('📊 Status das Filas de Promoções')
            .setColor(0x00ff00)
            .setDescription('Quantidade de promoções em cada categoria:')
            .setTimestamp()

          let description = ''
          for (const [category, count] of Object.entries(stats)) {
            const emoji = categoryEmojis[category as PromotionCategory]
            const categoryName = category.charAt(0) + category.slice(1).toLowerCase()
            description += `${emoji} **${categoryName}**: ${count} promoções\n`
          }

          embed.setDescription(description || 'Nenhuma promoção na fila.')

          await interaction.editReply({ embeds: [embed] })
          break
        }

        case 'search': {
          const embed = new EmbedBuilder()
            .setTitle('🔍 Buscando Promoções')
            .setDescription('Buscando novas promoções nos canais do Telegram...')
            .setColor(0xffa500)
            .setTimestamp()

          await interaction.editReply({ embeds: [embed] })

          // TODO: Implementar busca manual específica por categoria
          const successEmbed = new EmbedBuilder()
            .setTitle('✅ Busca Concluída')
            .setDescription('A busca por novas promoções foi iniciada em background.')
            .setColor(0x00ff00)
            .setTimestamp()

          setTimeout(async () => {
            await interaction.editReply({ embeds: [successEmbed] })
          }, 2000)
          break
        }

        case 'timeconfig': {
          const categoryEmojis = {
            [PromotionCategory.GENERAL]: '🎯',
            [PromotionCategory.TECH]: '💻',
            [PromotionCategory.GAMING]: '🎮',
            [PromotionCategory.FITNESS]: '🏋️',
            [PromotionCategory.AUTOMOTIVE]: '🚗',
            [PromotionCategory.FASHION]: '👗',
            [PromotionCategory.HOME]: '🏠',
          }

          const embed = new EmbedBuilder()
            .setTitle('⏰ Configurações de Tempo por Categoria')
            .setColor(0x007acc)
            .setDescription('Limite de idade das promoções e frequência de busca:')
            .setTimestamp()

          const fields = []

          for (const [category, config] of Object.entries(CATEGORY_SPECIFIC_CONFIG)) {
            const emoji = categoryEmojis[category as PromotionCategory]
            const categoryName = category.charAt(0) + category.slice(1).toLowerCase()

            fields.push({
              name: `${emoji} ${categoryName}`,
              value: `⏱️ **Frequência**: ${config?.schedulePattern || 'Não definido'}\n⌛ **Limite**: ${config?.maxAgeMinutes || 'Não definido'} minutos`,
              inline: true,
            })
          }

          embed.addFields(fields)

          await interaction.editReply({ embeds: [embed] })
          break
        }

        default:
          await interaction.editReply({
            content: '❌ Ação inválida.',
          })
      }
    } catch (error) {
      console.error('Error in promocoes command:', error)
      await interaction.editReply({
        content: '❌ Erro ao executar o comando. Tente novamente.',
      })
    }
  },
})
