import { createCommand } from '#base'
import { getCachedAvailableCotations, getExchangeRate } from '#services'
import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js'

async function setupCurrencyCommand() {
  const availableCotations = await getCachedAvailableCotations()
  const availableCotationsArray = Object.entries(availableCotations)
    .slice(0, 25)
    .map(([key, value]) => ({ name: value, value: key }))

  createCommand({
    name: 'currency',
    description: 'Get the current exchange rate between two currencies',
    type: ApplicationCommandType.ChatInput,
    options: [
      {
        name: 'currency',
        description: 'The currency you want to convert from and to (e.g. Bitcoin/Dólar Americano)',
        required: true,
        type: ApplicationCommandOptionType.String,
        choices: availableCotationsArray,
      },
    ],
    async run(interaction) {
      const currency = interaction.options.getString('currency')
      const [from, to] = currency!.split('-')

      try {
        const exchangeRate = await getExchangeRate(from, to)
        const code = `${from}${to}`

        if (exchangeRate[code]) {
          const formattedBid = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: exchangeRate[code].codein,
            maximumFractionDigits: 8,
            minimumFractionDigits: 2,
          }).format(Number(exchangeRate[code].bid))

          return interaction.reply(
            `💸 A cotação atual de **${exchangeRate[code].name}** é de **${formattedBid}**`,
          )
        }

        throw new Error('Failed to fetch exchange rate')
      } catch (error) {
        return interaction.reply('Erro ao buscar a cotação')
      }
    },
  })
}

setupCurrencyCommand()
