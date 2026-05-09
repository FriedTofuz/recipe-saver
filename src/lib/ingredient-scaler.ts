import Fraction from 'fraction.js'

export function scaleQuantity(
  quantity: number | null,
  baseServings: number,
  targetServings: number
): string {
  if (quantity === null || quantity === 0) return ''
  if (baseServings === targetServings) return formatQuantity(quantity)

  const scaled = (quantity * targetServings) / baseServings
  return formatQuantity(scaled)
}

function formatQuantity(value: number): string {
  try {
    const frac = new Fraction(value).simplify(0.05)
    return frac.toFraction(true)
  } catch {
    return value % 1 === 0 ? value.toString() : value.toFixed(2)
  }
}

export const US_TO_METRIC: Record<string, { factor: number; unit: string }> = {
  cup: { factor: 240, unit: 'ml' },
  cups: { factor: 240, unit: 'ml' },
  tbsp: { factor: 15, unit: 'ml' },
  tablespoon: { factor: 15, unit: 'ml' },
  tablespoons: { factor: 15, unit: 'ml' },
  tsp: { factor: 5, unit: 'ml' },
  teaspoon: { factor: 5, unit: 'ml' },
  teaspoons: { factor: 5, unit: 'ml' },
  oz: { factor: 28.35, unit: 'g' },
  ounce: { factor: 28.35, unit: 'g' },
  ounces: { factor: 28.35, unit: 'g' },
  lb: { factor: 453.59, unit: 'g' },
  lbs: { factor: 453.59, unit: 'g' },
  pound: { factor: 453.59, unit: 'g' },
  pounds: { factor: 453.59, unit: 'g' },
  'fl oz': { factor: 29.57, unit: 'ml' },
  quart: { factor: 946, unit: 'ml' },
  quarts: { factor: 946, unit: 'ml' },
  gallon: { factor: 3785, unit: 'ml' },
  gallons: { factor: 3785, unit: 'ml' },
  inch: { factor: 2.54, unit: 'cm' },
  inches: { factor: 2.54, unit: 'cm' },
}

export const METRIC_TO_US: Record<string, { factor: number; unit: string }> = {
  ml: { factor: 1 / 240, unit: 'cup' },
  g: { factor: 1 / 28.35, unit: 'oz' },
  kg: { factor: 2.205, unit: 'lb' },
  l: { factor: 4.227, unit: 'cups' },
  cm: { factor: 1 / 2.54, unit: 'inch' },
}

export function convertUnit(
  quantity: number | null,
  unit: string | null,
  toMetric: boolean
): { quantity: string; unit: string } {
  if (quantity === null || !unit) {
    return { quantity: quantity?.toString() ?? '', unit: unit ?? '' }
  }

  const lookup = toMetric ? US_TO_METRIC : METRIC_TO_US
  const conversion = lookup[unit.toLowerCase()]

  if (!conversion) {
    return { quantity: formatQuantity(quantity), unit }
  }

  const converted = quantity * conversion.factor
  const roundedUnit = conversion.unit

  if (toMetric && (roundedUnit === 'ml' || roundedUnit === 'g')) {
    return { quantity: Math.round(converted).toString(), unit: roundedUnit }
  }

  return { quantity: formatQuantity(converted), unit: roundedUnit }
}
