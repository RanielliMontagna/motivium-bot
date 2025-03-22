import {
  celsiusToFahrenheit,
  celsiusToKelvin,
  fahrenheitToCelsius,
  fahrenheitToKelvin,
  kelvinToCelsius,
  kelvinToFahrenheit,
} from './temperature.js'

describe('Temperature Conversion Functions', () => {
  test('Celsius to Fahrenheit', () => {
    expect(celsiusToFahrenheit(0)).toBe(32)
    expect(celsiusToFahrenheit(100)).toBe(212)
  })

  test('Fahrenheit to Celsius', () => {
    expect(fahrenheitToCelsius(32)).toBe(0)
    expect(fahrenheitToCelsius(212)).toBe(100)
  })

  test('Celsius to Kelvin', () => {
    expect(celsiusToKelvin(0)).toBe(273.15)
    expect(celsiusToKelvin(100)).toBe(373.15)
  })

  test('Kelvin to Celsius', () => {
    expect(kelvinToCelsius(273.15)).toBe(0)
    expect(kelvinToCelsius(373.15)).toBe(100)
  })

  test('Fahrenheit to Kelvin', () => {
    expect(fahrenheitToKelvin(32)).toBe(273.15)
    expect(fahrenheitToKelvin(212)).toBe(373.15)
  })

  test('Kelvin to Fahrenheit', () => {
    expect(kelvinToFahrenheit(273.15)).toBe(32)
    expect(kelvinToFahrenheit(373.15)).toBe(212)
  })
})
