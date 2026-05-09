import { generateJSON } from './gemini'
import type { ParsedRecipe } from '@/types'

const PARSE_PROMPT = (sourceText: string) => `
You are a recipe data extraction engine. Extract a structured recipe from the text below.

Return ONLY a valid JSON object — no markdown, no explanation:

{
  "title": "string",
  "description": "string (1-3 sentence summary, empty string if none)",
  "servings": 4,
  "prep_time_mins": null,
  "cook_time_mins": null,
  "cuisine": null,
  "tags": [],
  "cover_image_url": null,
  "ingredients": [
    { "name": "string", "quantity": null, "unit": null, "notes": null }
  ],
  "steps": [
    { "instruction": "string" }
  ]
}

Rules:
- Split "2 cups flour" → quantity: 2, unit: "cup", name: "flour"
- Split compound instructions into separate steps
- Tags: up to 5, lowercase descriptive terms (e.g. ["vegetarian", "quick", "italian"])
- cuisine: standardized string like "Italian", "Mexican", null if unclear
- If text is not a recipe, return { "error": "not a recipe" }
- Do not invent information not in the source

Source text:
---
${sourceText}
---
`.trim()

interface ParseError {
  error: string
}

export async function parseRecipeFromText(text: string): Promise<ParsedRecipe> {
  const result = await generateJSON<ParsedRecipe | ParseError>(PARSE_PROMPT(text))

  if ('error' in result) {
    throw new Error(result.error)
  }

  return result
}
