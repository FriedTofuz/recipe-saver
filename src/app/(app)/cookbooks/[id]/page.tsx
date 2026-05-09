import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RecipeGrid } from '@/components/recipe/RecipeGrid'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Recipe } from '@/types'

interface CookbookPageProps {
  params: { id: string }
}

export default async function CookbookPage({ params }: CookbookPageProps) {
  const supabase = createClient()

  const [{ data: cookbook }, { data: recipeLinks }] = await Promise.all([
    supabase.from('cookbooks').select('*').eq('id', params.id).single(),
    supabase
      .from('recipe_cookbooks')
      .select('recipe_id')
      .eq('cookbook_id', params.id),
  ])

  if (!cookbook) notFound()

  const recipeIds = (recipeLinks ?? []).map((rl) => rl.recipe_id)
  let recipes: Recipe[] = []

  if (recipeIds.length > 0) {
    const { data } = await supabase
      .from('recipes')
      .select('*')
      .in('id', recipeIds)
      .order('created_at', { ascending: false })
    recipes = (data as Recipe[]) ?? []
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/cookbooks">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Cookbooks
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold">{cookbook.name}</h1>
        {cookbook.description && (
          <p className="text-muted-foreground mt-1">{cookbook.description}</p>
        )}
      </div>
      <RecipeGrid recipes={recipes} />
    </div>
  )
}
