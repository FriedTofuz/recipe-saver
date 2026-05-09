import type { GroceryItem, GrocerySuggestion } from '@/types'

/** Lowercase + collapse whitespace + drop trailing 's' for naive plural fold. */
export function normalizeIngredient(name: string): string {
  const trimmed = name.toLowerCase().trim().replace(/\s+/g, ' ')
  if (trimmed.length > 3 && trimmed.endsWith('s')) return trimmed.slice(0, -1)
  return trimmed
}

/**
 * Hide suggestions that already exist on the list (by normalized name match).
 */
export function dedupeSuggestions(
  suggestions: GrocerySuggestion[],
  existingItems: Pick<GroceryItem, 'name'>[]
): GrocerySuggestion[] {
  const have = new Set(existingItems.map((i) => normalizeIngredient(i.name)))
  return suggestions.filter((s) => !have.has(normalizeIngredient(s.name)))
}

/**
 * Format a numeric+unit ingredient into a human-readable qty.
 * Mirrors the simple shape used elsewhere in the app.
 */
export function formatQty(quantity: number | null, unit: string | null): {
  quantity: string | null
  unit: string | null
} {
  if (quantity === null || quantity === undefined) {
    return { quantity: null, unit: unit ?? null }
  }
  // Prefer fractions for common values
  const map: Record<string, string> = {
    '0.25': '1/4',
    '0.33': '1/3',
    '0.333': '1/3',
    '0.5': '1/2',
    '0.66': '2/3',
    '0.666': '2/3',
    '0.75': '3/4',
  }
  const whole = Math.floor(quantity)
  const frac = quantity - whole
  let qStr: string
  if (frac === 0) {
    qStr = String(whole)
  } else {
    const fracStr = map[frac.toFixed(3)] ?? map[frac.toFixed(2)]
    qStr = fracStr ? (whole > 0 ? `${whole} ${fracStr}` : fracStr) : quantity.toString()
  }
  return { quantity: qStr, unit: unit ?? null }
}
