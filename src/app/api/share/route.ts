import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateShareToken } from '@/lib/share-token'

export async function POST(request: NextRequest) {
  try {
    const { recipeId } = await request.json()
    if (!recipeId) {
      return NextResponse.json({ error: 'recipeId required' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if token already exists
    const { data: existing } = await supabase
      .from('recipes')
      .select('share_token')
      .eq('id', recipeId)
      .eq('user_id', user.id)
      .single()

    if (existing?.share_token) {
      return NextResponse.json({ token: existing.share_token })
    }

    const token = generateShareToken()
    await supabase
      .from('recipes')
      .update({ share_token: token })
      .eq('id', recipeId)
      .eq('user_id', user.id)

    return NextResponse.json({ token })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate share link' }, { status: 500 })
  }
}
