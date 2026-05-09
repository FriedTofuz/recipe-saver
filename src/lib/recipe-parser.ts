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
cuisine (string like "Italian" or null)
tags (array of up to 5 lowercase strings)
cover_image_url (string or null)
ingredients (array of objects with keys: name, quantity, unit, notes)
steps (array of objects with key: instruction)

Rules:
- Split "2 cups flour" → quantity: 2, unit: "cup", name: "flour"
- Split compound instructions into separate steps
- If the text is not a recipe, return {"error": "not a recipe"}
- Do not invent information not present in the source

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

  return result as unknown as ParsedRecipe
}
