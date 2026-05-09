import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RecipeGrid } from '@/components/recipe/RecipeGrid'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import type { Recipe } from '@/types'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { q?: string; tag?: string; cuisine?: string }
}) {
  const supabase = createClient()

  let query = supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  if (searchParams.q) {
    query = query.ilike('title', `%${searchParams.q}%`)
  }
  if (searchParams.tag) {
    query = query.contains('tags', [searchParams.tag])
  }
  if (searchParams.cuisine) {
    query = query.ilike('cuisine', searchParams.cuisine)
  }

  const { data: recipes } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Recipes</h1>
        <Button asChild>
          <Link href="/recipes/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Recipe
          </Link>
        </Button>
      </div>
      <RecipeGrid recipes={(recipes as Recipe[]) ?? []} />
    </div>
  )
}
