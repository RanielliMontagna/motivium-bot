import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js'
import { createCommand } from '#base'

import { type ForecastDayData, getCurrentWeather, getForecast } from '#services'

createCommand({
  name: 'weather',
  description: 'Get current weather and forecast for a location',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'location',
      description: 'The location to get weather for',
      required: true,
      type: ApplicationCommandOptionType.String,
    },
    {
      name: 'forecast',
      description: 'Get forecast for the next days (default: 3)',
      required: false,
      type: ApplicationCommandOptionType.Integer,
      minValue: 1,
      maxValue: 7,
    },
  ],
  async run(interaction) {
    try {
      const location = interaction.options.getString('location', true)
      const forecastDays = interaction.options.getInteger('forecast') ?? 3

      const current = await getCurrentWeather(location)
      const forecast = await getForecast(location, forecastDays)

      const currentWeatherMessage = `
        **Current Weather in ${location}**
        🌡️ Temperature: ${current.temp_c}°C
        🌤️ Condition: ${current.condition.text}
        💧 Humidity: ${current.humidity}%
        `

      let forecastMessage = '\n**Forecast**'
      forecast.forecastday.forEach((day: ForecastDayData) => {
        forecastMessage += `
            📅 ${new Date(day.date).toLocaleDateString()}
            🌡️ High: ${day.day.maxtemp_c}°C
            🌡️ Low: ${day.day.mintemp_c}°C
            🌤️ Condition: ${day.day.condition.text}
            💧 Chance of Rain: ${day.day.daily_chance_of_rain}%
        `
      })

      await interaction.reply(currentWeatherMessage + forecastMessage)
    } catch (error) {
      await interaction.reply(
        'Failed to fetch weather data. Please check the location and try again.',
      )
    }
  },
})
