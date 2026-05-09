import { NextRequest, NextResponse } from 'next/server'
import { fetchUrlContent, InstagramBlockedError, FetchFailedError } from '@/lib/url-fetcher'
import { parseRecipeFromText } from '@/lib/recipe-parser'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }

    let urlObj: URL
    try {
      urlObj = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const { text, ogImage } = await fetchUrlContent(url)
    const parsed = await parseRecipeFromText(text)

    // Use og:image if Gemini didn't find one
    if (!parsed.cover_image_url && ogImage) {
      parsed.cover_image_url = ogImage
    }

    return NextResponse.json(parsed)
  } catch (err) {
    if (err instanceof InstagramBlockedError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    if (err instanceof FetchFailedError) {
      return NextResponse.json({ error: err.message }, { status: 422 })
    }
    const message = err instanceof Error ? err.message : 'Import failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
