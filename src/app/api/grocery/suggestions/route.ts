import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { dedupeSuggestions, formatQty } from '@/lib/grocery-suggestions'
import type { GrocerySuggestion } from '@/types'

/**
 * GET /api/grocery/suggestions?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Returns ingredients from recipes scheduled in the meal plan between
 * `start` and `end` (inclusive), with any items already on the user's
 * list filtered out.
 */
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  if (!start || !end) {
    return NextResponse.json({ error: 'start and end required' }, { status: 400 })
  }

  // Meal plan stores week_start (Monday) + day_of_week (1-7). Map to actual dates.
  const startDate = new Date(start + 'T00:00:00')
  const endDate = new Date(end + 'T00:00:00')

  // Pull every slot in the user's plan whose week_start is within the relevant
  // range (we widen by one week on each side then filter exact dates).
  const widenedStart = new Date(startDate)
  widenedStart.setDate(widenedStart.getDate() - 7)
  const { data: slots } = await supabase
    .from('meal_plan_slots')
    .select(
      'week_start, day_of_week, recipe:recipes(id, title, ingredients(id, name, quantity, unit, sort_order))'
    )
    .gte('week_start', widenedStart.toISOString().slice(0, 10))
    .lte('week_start', endDate.toISOString().slice(0, 10))
    .not('recipe_id', 'is', null)

  type Slot = {
    week_start: string
    day_of_week: number
    recipe: {
      id: string
      title: string
      ingredients: Array<{
        id: string
        name: string
        quantity: number | null
        unit: string | null
        sort_order: number
      }>
    } | null
  }

  // Group slots by recipe and collect dates within range.
  const byRecipe = new Map<
    string,
    { title: string; dates: Set<string>; ingredients: Slot['recipe'] extends infer R ? R extends { ingredients: infer I } ? I : never : never }
  >()
  for (const slot of (slots as Slot[] | null) ?? []) {
    if (!slot.recipe) continue
    const ws = new Date(slot.week_start + 'T00:00:00')
    const slotDate = new Date(ws)
    slotDate.setDate(ws.getDate() + (slot.day_of_week - 1))
    if (slotDate < startDate || slotDate > endDate) continue

    const iso = slotDate.toISOString().slice(0, 10)
    const existing = byRecipe.get(slot.recipe.id)
    if (existing) {
      existing.dates.add(iso)
    } else {
      byRecipe.set(slot.recipe.id, {
        title: slot.recipe.title,
        dates: new Set([iso]),
        ingredients: slot.recipe.ingredients ?? [],
      })
    }
  }

  const suggestions: GrocerySuggestion[] = []
  Array.from(byRecipe.entries()).forEach(([recipeId, info]) => {
    const sortedIngredients = [...info.ingredients].sort(
      (a, b) => a.sort_order - b.sort_order
    )
    const sortedDates: string[] = Array.from(info.dates).sort()
    for (const ing of sortedIngredients) {
      const fmt = formatQty(ing.quantity, ing.unit)
      suggestions.push({
        key: `${recipeId}-${ing.id}`,
        recipe_id: recipeId,
        recipe_title: info.title,
        scheduled_dates: sortedDates,
        name: ing.name,
        quantity: fmt.quantity,
        unit: fmt.unit,
      })
    }
  })

  // Dedupe against existing list items.
  const { data: existingItems } = await supabase
    .from('grocery_items')
    .select('name')
    .eq('user_id', user.id)

  const filtered = dedupeSuggestions(suggestions, existingItems ?? [])

  return NextResponse.json({ suggestions: filtered })
}
