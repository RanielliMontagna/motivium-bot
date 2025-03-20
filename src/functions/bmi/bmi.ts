import { BMICategory, BMIOptions, Result } from './bmi.types.js'

export function calculateBMI({ height, unit, weight }: BMIOptions): Result {
  if (weight <= 0 || height <= 0) {
    throw new Error('Weight and height must be greater than zero')
  }

  const heightInMeters = unit === 'metric' ? height / 100 : height * 0.0254 // Convert inches to meters
  const weightInKg = unit === 'metric' ? weight : weight * 0.453592 // Convert pounds to kg

  const bmi = weightInKg / (heightInMeters * heightInMeters)

  let category: BMICategory

  if (bmi < 18.5) {
    category = BMICategory.Underweight
  } else if (bmi < 24.9) {
    category = BMICategory.NormalWeight
  } else if (bmi < 29.9) {
    category = BMICategory.Overweight
  } else if (bmi < 34.9) {
    category = BMICategory.ObesityClassI
  } else if (bmi < 39.9) {
    category = BMICategory.ObesityClassII
  } else {
    category = BMICategory.ObesityClassIII
  }

  return {
    category,
    bmi: parseFloat(bmi.toFixed(2)), // Round to 2 decimal places
  }
}
