import { NextRequest, NextResponse } from 'next/server'
import { getNutrition } from '@/lib/edamam'
import type { Ingredient } from '@/types'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const { ingredients, servings, title } = await request.json()
    if (!ingredients || !servings) {
      return NextResponse.json({ error: 'ingredients and servings are required' }, { status: 400 })
    }

    const nutrition = await getNutrition(ingredients as Ingredient[], servings, title ?? 'Recipe')
    return NextResponse.json(nutrition ?? { calories: null, protein_g: null, carbs_g: null, fat_g: null })
  } catch (err) {
    return NextResponse.json({ error: 'Nutrition fetch failed' }, { status: 500 })
  }
}
