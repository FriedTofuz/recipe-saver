import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RecipeDetail } from '@/components/recipe/RecipeDetail'
import type { Recipe, Cookbook } from '@/types'

interface RecipePageProps {
  params: { id: string }
}

export default async function RecipePage({ params }: RecipePageProps) {
  const supabase = createClient()

  const [{ data: recipe }, { data: cookbooks }, { data: recipeCookbooks }] = await Promise.all([
    supabase
      .from('recipes')
      .select('*, ingredients(*), steps(*)')
      .eq('id', params.id)
      .order('sort_order', { foreignTable: 'ingredients', ascending: true })
      .order('step_number', { foreignTable: 'steps', ascending: true })
      .single(),
    supabase.from('cookbooks').select('*').order('name'),
    supabase.from('recipe_cookbooks').select('cookbook_id').eq('recipe_id', params.id),
  ])

  if (!recipe) notFound()

  const selectedCookbookIds = (recipeCookbooks ?? []).map((rc) => rc.cookbook_id)

  return (
    <RecipeDetail
      recipe={recipe as Recipe}
      cookbooks={(cookbooks as Cookbook[]) ?? []}
      cookbookIds={selectedCookbookIds}
    />
  )
}
