import axios from 'axios'
import type { CurrentWeather, Forecast } from './weatherService.types.js'

export const weatherApiUrl = 'http://api.weatherapi.com/v1'
export const currentWeather = weatherApiUrl + '/current.json'
export const forecastWeather = weatherApiUrl + '/forecast.json'

export const getCurrentWeather = async (location: string): Promise<CurrentWeather> => {
  try {
    const response = await axios.get(currentWeather, {
      params: {
        key: process.env.WEATHER_API_KEY,
        q: location,
        aqi: 'no',
      },
    })
    return response.data.current
  } catch (error) {
    throw new Error(
      `Failed to fetch current weather: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

export const getForecast = async (location: string, days: number = 3): Promise<Forecast> => {
  try {
    const response = await axios.get(forecastWeather, {
      params: {
        key: process.env.WEATHER_API_KEY,
        q: location,
        days: days,
        aqi: 'no',
        alerts: 'no',
      },
    })
    return response.data.forecast
  } catch (error) {
    throw new Error(
      `Failed to fetch weather forecast: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
