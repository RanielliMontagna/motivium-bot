export enum BMICategory {
  Underweight = 'Underweight',
  NormalWeight = 'Normal weight',
  Overweight = 'Overweight',
  ObesityClassI = 'Obesity class I',
  ObesityClassII = 'Obesity class II',
  ObesityClassIII = 'Obesity class III',
}

type BMIUnit = 'metric' | 'imperial'

export interface BMIOptions {
  weight: number
  height: number
  unit: BMIUnit
}

export interface Result {
  category: BMICategory
  bmi: number
}
