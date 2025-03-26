import { getCep } from '#services'
import { createCommand } from '#base'

import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  Colors,
  EmbedBuilder,
} from 'discord.js'

createCommand({
  name: 'cep',
  description: 'Get information about a CEP code',
  descriptionLocalizations: {
    'en-US': 'Get information about a CEP code',
    'pt-BR': 'Obtenha informações sobre um CEP',
  },
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'cep',
      description: 'The CEP code to search',
      descriptionLocalizations: {
        'en-US': 'The CEP code to search',
        'pt-BR': 'O CEP a ser pesquisado',
      },
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  async run(interaction) {
    const cep = interaction.options.getString('cep', true)
    const cepRegex = /^[0-9]{8}$/
    const cepFormatted = cep.replace(/\D/g, '')

    const isValidCep = cepRegex.test(cepFormatted)

    if (!isValidCep) {
      return interaction.reply({ content: '❌ CEP inválido!', ephemeral: true })
    }

    try {
      const cepData = await getCep(cepFormatted)

      if (!cepData) {
        return interaction.reply({ content: '❌ CEP não encontrado!', ephemeral: true })
      }

      // Criação do embed
      const embed = new EmbedBuilder()
        .setTitle(`📍 Informações do CEP ${cepData.cep}`)
        .setColor(Colors.Blue)
        .setFooter({ text: 'Dados obtidos via ViaCEP' })
        .setTimestamp()

      // Adiciona campos somente se existirem
      if (cepData.logradouro)
        embed.addFields({ name: '🏠 Logradouro', value: cepData.logradouro, inline: true })
      if (cepData.complemento)
        embed.addFields({ name: '➕ Complemento', value: cepData.complemento, inline: true })
      if (cepData.bairro)
        embed.addFields({ name: '🏘️ Bairro', value: cepData.bairro, inline: true })
      if (cepData.localidade)
        embed.addFields({ name: '🏙️ Cidade', value: cepData.localidade, inline: true })
      if (cepData.uf) embed.addFields({ name: '🗺️ Estado', value: cepData.uf, inline: true })

      return interaction.reply({ embeds: [embed] })
    } catch (error) {
      return interaction.reply({ content: `Error fetching CEP: ${error}` })
    }
  },
})
