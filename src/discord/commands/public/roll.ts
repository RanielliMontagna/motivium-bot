import { createCommand } from '#base'
import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js'

createCommand({
  name: 'roll',
  description: 'Roll a dice 🎲',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'dice',
      description: 'Type of dice to roll',
      required: true,
      choices: [
        { name: 'd4', value: 'd4' },
        { name: 'd6', value: 'd6' },
        { name: 'd8', value: 'd8' },
        { name: 'd10', value: 'd10' },
        { name: 'd12', value: 'd12' },
        { name: 'd20', value: 'd20' },
      ],
      type: ApplicationCommandOptionType.String,
    },
  ],
  async run(interaction) {
    const diceType = interaction.options.getString('dice')!
    const dice = parseInt(diceType.slice(1))
    const roll = Math.floor(Math.random() * dice) + 1

    await interaction.reply(`🎲 Você rolou um **${diceType}** e obteve: **${roll}**`)
  },
})
