import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js'

import { createCommand } from '#base'
import { Coins, getCoinData } from '#services'

createCommand({
  name: 'crypto',
  description: 'Get the current value of a cryptocurrency',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'coin',
      description: 'The cryptocurrency to get the value of',
      required: true,
      type: ApplicationCommandOptionType.String,
      choices: Object.entries(Coins).map(([key, value]) => ({ name: key, value })),
    },
  ],
  async run(interaction) {
    try {
      const coin = interaction.options.getString('coin') as Coins
      const coinData = await getCoinData(coin)

      const name = Object.keys(Coins).find((key) => Coins[key as keyof typeof Coins] === coin)

      await interaction.reply(`The current value of **${name}** is **$${coinData.usd}**`)
    } catch (error) {
      await interaction.reply('Failed to fetch coin data')
    }
  },
})
