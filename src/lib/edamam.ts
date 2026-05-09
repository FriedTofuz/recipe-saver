import { generateJSON } from './gemini'
import type { NutritionData, Ingredient } from '@/types'

export async function getNutrition(
  ingredients: Ingredient[],
  servings: number,
  recipeTitle: string
): Promise<NutritionData | null> {
  try {
    return await fetchFromEdamam(ingredients, servings, recipeTitle)
  } catch {
    try {
      return await estimateWithGemini(ingredients, servings)
    } catch {
      return null
    }
  }
}

async function fetchFromEdamam(
  ingredients: Ingredient[],
  servings: number,
  title: string
): Promise<NutritionData> {
  const ingr = ingredients.map((i) => {
    const parts = [i.quantity, i.unit, i.name, i.notes].filter(Boolean)
    return parts.join(' ')
  })

  const url = new URL('https://api.edamam.com/api/nutrition-details')
  url.searchParams.set('app_id', process.env.EDAMAM_APP_ID!)
  url.searchParams.set('app_key', process.env.EDAMAM_APP_KEY!)

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, ingr }),
  })

  if (!res.ok) {
    throw new Error(`Edamam error: ${res.status}`)
  }

  const data = await res.json()
  const totalCalories: number = data.calories ?? 0
  const nutrients = data.totalNutrients ?? {}

  return {
    calories: Math.round(totalCalories / servings),
    protein_g: parseFloat(((nutrients.PROCNT?.quantity ?? 0) / servings).toFixed(1)),
    carbs_g: parseFloat(((nutrients.CHOCDF?.quantity ?? 0) / servings).toFixed(1)),
    fat_g: parseFloat(((nutrients.FAT?.quantity ?? 0) / servings).toFixed(1)),
  }
}

async function estimateWithGemini(
  ingredients: Ingredient[],
  servings: number
): Promise<NutritionData> {
  const ingredientText = ingredients
    .map((i) => [i.quantity, i.unit, i.name].filter(Boolean).join(' '))
    .join('\n')

  const prompt = `
Estimate per-serving nutrition for a recipe serving ${servings} people.

Ingredients:
${ingredientText}

Return ONLY valid JSON (no markdown):
{ "calories": 0, "protein_g": 0.0, "carbs_g": 0.0, "fat_g": 0.0 }

Base on standard USDA values. Use 0 for all fields if you cannot estimate reliably.
`.trim()

  return generateJSON<NutritionData>(prompt)
}
