import { calculateBMI } from './bmi.js'
import { BMICategory, BMIOptions, Result } from './bmi.types.js'

describe('calculateBMI', () => {
  it('should correctly calculate BMI in metric units', () => {
    const options: BMIOptions = { height: 175, weight: 70, unit: 'metric' }
    const result: Result = calculateBMI(options)

    expect(result.bmi).toBeCloseTo(22.86, 2)
    expect(result.category).toBe(BMICategory.NormalWeight)
  })

  it('should correctly calculate BMI in imperial units', () => {
    const options: BMIOptions = { height: 69, weight: 154, unit: 'imperial' }
    const result: Result = calculateBMI(options)

    expect(result.bmi).toBeCloseTo(22.73, 1)
    expect(result.category).toBe(BMICategory.NormalWeight)
  })

  it('should classify underweight correctly', () => {
    const options: BMIOptions = { height: 175, weight: 50, unit: 'metric' }
    const result: Result = calculateBMI(options)

    expect(result.category).toBe(BMICategory.Underweight)
  })

  it('should classify overweight correctly', () => {
    const options: BMIOptions = { height: 175, weight: 80, unit: 'metric' }
    const result: Result = calculateBMI(options)

    expect(result.category).toBe(BMICategory.Overweight)
  })

  it('should classify obesity class I correctly', () => {
    const options: BMIOptions = { height: 175, weight: 95, unit: 'metric' }
    const result: Result = calculateBMI(options)

    expect(result.category).toBe(BMICategory.ObesityClassI)
  })

  it('should classify obesity class II correctly', () => {
    const options: BMIOptions = { height: 175, weight: 110, unit: 'metric' }
    const result: Result = calculateBMI(options)

    expect(result.category).toBe(BMICategory.ObesityClassII)
  })

  it('should classify obesity class III correctly', () => {
    const options: BMIOptions = { height: 175, weight: 130, unit: 'metric' }
    const result: Result = calculateBMI(options)

    expect(result.category).toBe(BMICategory.ObesityClassIII)
  })

  it('should throw an error for non-positive weight', () => {
    const options: BMIOptions = { height: 175, weight: 0, unit: 'metric' }

    expect(() => calculateBMI(options)).toThrow('Weight and height must be greater than zero')
  })

  it('should throw an error for non-positive height', () => {
    const options: BMIOptions = { height: 0, weight: 70, unit: 'metric' }

    expect(() => calculateBMI(options)).toThrow('Weight and height must be greater than zero')
  })
})
