import { NextRequest, NextResponse } from 'next/server'
import { parseRecipeFromText } from '@/lib/recipe-parser'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    const trimmed = text.trim().slice(0, 12000)
    const parsed = await parseRecipeFromText(trimmed)
    return NextResponse.json(parsed)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Parsing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
