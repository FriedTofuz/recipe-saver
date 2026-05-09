import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateJSON } from '@/lib/gemini'

export const maxDuration = 60

interface MergedItem {
  name: string
  quantity: string
  unit: string | null
  aisle: string
  source_recipes: string[]
}

const CHUNK_SIZE = 50

export async function POST(request: NextRequest) {
  try {
    const { recipeIds } = await request.json()
    if (!recipeIds?.length) {
      return NextResponse.json({ error: 'recipeIds required' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: recipes } = await supabase
      .from('recipes')
      .select('id, title, ingredients(*)')
      .in('id', recipeIds)

    if (!recipes?.length) {
      return NextResponse.json({ items: [] })
    }

    // Build flat ingredient list for Gemini
    const allIngredients = recipes.flatMap((recipe) =>
      (recipe.ingredients ?? []).map((ing: any) => ({
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        recipe: recipe.title,
      }))
    )

    // Chunk if too many ingredients
    const chunks: typeof allIngredients[] = []
    for (let i = 0; i < allIngredients.length; i += CHUNK_SIZE) {
      chunks.push(allIngredients.slice(i, i + CHUNK_SIZE))
    }

    const prompt = (ingredients: typeof allIngredients) => `
You are a grocery list organizer. Combine and categorize ingredients from multiple recipes.

Tasks:
1. COMBINE duplicates (sum quantities when units match).
2. Convert to human-readable quantity strings ("2 1/2 cups", "300g").
3. CATEGORIZE into exactly one of: produce | dairy | meat | seafood | pantry | frozen | bakery | beverages | spices | other

Input JSON:
${JSON.stringify(ingredients)}

Return ONLY a valid JSON array (no markdown):
[{ "name": "string", "quantity": "string", "unit": null, "aisle": "string", "source_recipes": ["string"] }]

Rules: pantry = canned goods, oils, pasta, rice, flour, sugar. spices = herbs, salt, pepper. Sort by aisle then name.
`.trim()

    const results = await Promise.all(
      chunks.map((chunk) => generateJSON<MergedItem[]>(prompt(chunk)))
    )

    const merged = results.flat()

    // Format for addItemsToGroceryList
    const items = merged.map((item, idx) => ({
      name: item.name,
      quantity: item.quantity || null,
      unit: item.unit || null,
      aisle: item.aisle,
      source_recipe: item.source_recipes?.[0] ?? null,
      sort_order: idx,
    }))

    return NextResponse.json({ items })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Merge failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
