import { generateJSON } from './gemini'
import type { ParsedRecipe } from '@/types'

const PARSE_PROMPT = (sourceText: string) => `
You are a recipe data extraction engine. Extract a structured recipe from the text below.

Return a flat JSON object with EXACTLY these top-level keys — do not nest under any wrapper key:

title (string, required)
description (string, 1-3 sentence summary or empty string)
servings (number, default 4)
prep_time_mins (number or null)
cook_time_mins (number or null)
cuisine (string like "Italian" or null) — the regional cuisine ONLY, never an ingredient
tags (array of up to 5 lowercase strings) — describe ingredients, dietary attributes, or
  technique (e.g. "pasta", "vegetarian", "one-pot"). DO NOT include the cuisine here;
  the cuisine field already covers that.
cover_image_url (string or null)
ingredients (array of objects with keys: name, quantity, unit, notes)
steps (array of objects with key: instruction)

Rules:
- Split "2 cups flour" → quantity: 2, unit: "cup", name: "flour"
- Split compound instructions into separate steps
- If the text is not a recipe, return {"error": "not a recipe"}
- Do not invent information not present in the source
- Tags must be distinct from the cuisine. Never repeat the cuisine string inside tags.

Source text:
---
${sourceText}
---
`.trim()

interface ParseError {
  error: string
}

export async function parseRecipeFromText(text: string): Promise<ParsedRecipe> {
  const raw = await generateJSON<Record<string, unknown>>(PARSE_PROMPT(text))

  // Unwrap if the model nested the recipe under a container key (e.g. {"recipe": {...}})
  const result: Record<string, unknown> =
    raw.title != null ? raw :
    (raw.recipe != null && typeof raw.recipe === 'object') ? raw.recipe as Record<string, unknown> :
    raw

  if ('error' in result) {
    throw new Error(result.error as string)
  }

  if (!result.title) {
    throw new Error('Could not extract a recipe from this page. Try the "Paste Text" tab instead.')
  }

  // Safety net: strip the cuisine word out of tags + de-dupe.
  const cuisine = typeof result.cuisine === 'string' ? result.cuisine.trim() : ''
  if (Array.isArray(result.tags)) {
    const cuisineNorm = cuisine.toLowerCase()
    const seen = new Set<string>()
    result.tags = (result.tags as unknown[])
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => {
        if (!t) return false
        if (cuisineNorm && t === cuisineNorm) return false
        if (seen.has(t)) return false
        seen.add(t)
        return true
      })
  }

  return result as unknown as ParsedRecipe
}
