import { ApplicationCommandOptionType } from 'discord.js'
import { createCommand } from '#base'

import {
  celsiusToFahrenheit,
  celsiusToKelvin,
  fahrenheitToCelsius,
  fahrenheitToKelvin,
  kelvinToCelsius,
  kelvinToFahrenheit,
} from '#functions'

// Mapping conversion functions to their string representations
const conversionMap: Record<string, (value: number) => number> = {
  'C-F': celsiusToFahrenheit,
  'C-K': celsiusToKelvin,
  'F-C': fahrenheitToCelsius,
  'F-K': fahrenheitToKelvin,
  'K-C': kelvinToCelsius,
  'K-F': kelvinToFahrenheit,
}

createCommand({
  name: 'temperature',
  description: 'Convert temperature between Celsius, Fahrenheit, and Kelvin',
  options: [
    {
      name: 'value',
      description: 'Temperature value to convert',
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: 'from_unit',
      description: 'Unit of the input temperature',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: 'Celsius', value: 'C' },
        { name: 'Fahrenheit', value: 'F' },
        { name: 'Kelvin', value: 'K' },
      ],
    },
    {
      name: 'to_unit',
      description: 'Unit to convert the temperature to',
      type: ApplicationCommandOptionType.String,
      required: true,
      choices: [
        { name: 'Celsius', value: 'C' },
        { name: 'Fahrenheit', value: 'F' },
        { name: 'Kelvin', value: 'K' },
      ],
    },
  ],
  run: async (interaction) => {
    const value = interaction.options.getNumber('value')
    const fromUnit = interaction.options.getString('from_unit')
    const toUnit = interaction.options.getString('to_unit')

    if (value == null || !fromUnit || !toUnit) {
      return interaction.reply('Invalid options provided.')
    }

    // If the input and output units are the same, return the value directly
    if (fromUnit === toUnit) {
      return interaction.reply(
        `The temperature ${value}°${fromUnit} is equal to ${value.toFixed(2)}°${toUnit}`,
      )
    }

    const conversionKey = `${fromUnit}-${toUnit}`
    const conversionFunction = conversionMap[conversionKey]

    if (!conversionFunction) {
      return interaction.reply('Conversion not supported for the provided units.')
    }

    const convertedValue = conversionFunction(value)

    await interaction.reply(
      `The temperature **${value}°${fromUnit}** is equal to **${convertedValue.toFixed(2)}°${toUnit}**`,
    )

    return
  },
})
