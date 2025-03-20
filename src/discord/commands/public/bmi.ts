import { createCommand } from '#base'
import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js'

import { calculateBMI } from '#functions'

createCommand({
  name: 'bmi',
  description: 'Calculate your BMI (Body Mass Index)',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'height',
      description: 'Your height in cm',
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: 'weight',
      description: 'Your weight in kg',
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ],
  async run(interaction) {
    await interaction.deferReply()

    const height = interaction.options.getNumber('height', true)
    const weight = interaction.options.getNumber('weight', true)

    try {
      const { bmi, category } = calculateBMI({
        height,
        unit: 'metric',
        weight,
      })

      await interaction.editReply(
        `Your BMI is **${bmi}** and you are classified as **${category}**.`,
      )
    } catch (error) {
      if (error instanceof Error) {
        await interaction.editReply(`Error: ${error.message}`)
      } else {
        await interaction.editReply('An unknown error occurred.')
      }
    }

    return true
  },
})
