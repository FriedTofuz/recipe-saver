import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RecipeForm } from '@/components/recipe/RecipeForm'
import type { Recipe } from '@/types'

interface EditRecipePageProps {
  params: { id: string }
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const supabase = createClient()
  const { data: recipe } = await supabase
    .from('recipes')
    .select('*, ingredients(*), steps(*)')
    .eq('id', params.id)
    .order('sort_order', { foreignTable: 'ingredients', ascending: true })
    .order('step_number', { foreignTable: 'steps', ascending: true })
    .single()

  if (!recipe) notFound()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Recipe</h1>
      <RecipeForm recipe={recipe as Recipe} />
    </div>
  )
}
