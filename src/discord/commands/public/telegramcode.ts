import { createCommand } from '#base'
import { TelegramService } from '#services'
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  Colors,
  EmbedBuilder,
} from 'discord.js'

createCommand({
  name: 'telegramcode',
  description: 'Insere o código SMS do Telegram para autenticação',
  descriptionLocalizations: {
    'en-US': 'Insert Telegram SMS code for authentication',
    'pt-BR': 'Insere o código SMS do Telegram para autenticação',
  },
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'codigo',
      description: 'Código SMS de 5 dígitos recebido do Telegram',
      descriptionLocalizations: {
        'en-US': '5-digit SMS code received from Telegram',
        'pt-BR': 'Código SMS de 5 dígitos recebido do Telegram',
      },
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  async run(interaction) {
    await interaction.deferReply({ ephemeral: true })

    try {
      const code = interaction.options.getString('codigo', true)

      // Validação básica do código
      if (!/^\d{5}$/.test(code)) {
        const embed = new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('❌ Código Inválido')
          .setDescription('O código SMS deve ter exatamente 5 dígitos numéricos.')
          .addFields({
            name: '📱 Formato esperado',
            value: 'Exemplo: `12345`',
            inline: false,
          })
          .setFooter({ text: 'Verifique o código recebido no seu celular' })

        await interaction.editReply({ embeds: [embed] })
        return
      }

      // Verifica se há autenticação pendente
      if (!TelegramService.hasPendingAuth()) {
        const embed = new EmbedBuilder()
          .setColor(Colors.Orange)
          .setTitle('⚠️ Nenhuma Autenticação Pendente')
          .setDescription('Não há processo de autenticação aguardando código SMS.')
          .addFields({
            name: '🔄 Como usar',
            value:
              '1. Execute `/promocoes` primeiro\n2. Aguarde a mensagem "SMS code required!"\n3. Use este comando com o código recebido',
            inline: false,
          })

        await interaction.editReply({ embeds: [embed] })
        return
      }

      // Envia o código
      const success = TelegramService.submitSMSCode(code)

      if (success) {
        const embed = new EmbedBuilder()
          .setColor(Colors.Green)
          .setTitle('✅ Código Enviado')
          .setDescription('O código SMS foi enviado com sucesso!')
          .addFields({
            name: '📱 Próximos passos',
            value:
              'Aguarde alguns segundos para a autenticação ser processada.\nVocê pode executar `/promocoes` novamente.',
            inline: false,
          })
          .setTimestamp()

        await interaction.editReply({ embeds: [embed] })
      } else {
        const embed = new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('❌ Erro ao Enviar Código')
          .setDescription('Não foi possível processar o código SMS.')
          .addFields({
            name: '🔄 Tente novamente',
            value:
              'Verifique se o código está correto e tente novamente.\nSe o problema persistir, execute `/promocoes` para reiniciar o processo.',
            inline: false,
          })

        await interaction.editReply({ embeds: [embed] })
      }
    } catch (error) {
      console.error('Error in telegram-code command:', error)

      const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle('❌ Erro Interno')
        .setDescription('Ocorreu um erro ao processar o código.')
        .addFields({
          name: '🐛 Detalhes',
          value: error instanceof Error ? error.message : 'Erro desconhecido',
          inline: false,
        })

      await interaction.editReply({ embeds: [embed] })
    }
  },
})
