'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getNutrition } from '@/lib/edamam'
import type { RecipeFormValues } from '@/types'

function cleanTags(tags: string[], cuisine: string): string[] {
  const cuisineNorm = cuisine.trim().toLowerCase()
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of tags) {
    const t = raw.trim().toLowerCase()
    if (!t) continue
    if (cuisineNorm && t === cuisineNorm) continue
    if (seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

export async function createRecipe(
  values: RecipeFormValues,
  sourceType: 'url' | 'paste' | 'manual' = 'manual',
  sourceUrl?: string
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: recipe, error } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      title: values.title,
      description: values.description || null,
      source_url: sourceUrl || values.source_url || null,
      source_type: sourceType,
      cover_image: values.cover_image || null,
      servings: values.servings,
      prep_time_mins: values.prep_time_mins,
      cook_time_mins: values.cook_time_mins,
      cuisine: values.cuisine || null,
      tags: cleanTags(values.tags, values.cuisine),
    })
    .select()
    .single()

  if (error || !recipe) throw new Error(error?.message ?? 'Failed to create recipe')

  if (values.ingredients.length > 0) {
    await supabase.from('ingredients').insert(
      values.ingredients.map((ing, idx) => ({
        recipe_id: recipe.id,
        sort_order: idx,
        name: ing.name,
        quantity: ing.quantity ? parseFloat(ing.quantity) : null,
        unit: ing.unit || null,
        notes: ing.notes || null,
      }))
    )
  }

  if (values.steps.length > 0) {
    await supabase.from('steps').insert(
      values.steps.map((step, idx) => ({
        recipe_id: recipe.id,
        step_number: idx + 1,
        instruction: step.instruction,
      }))
    )
  }

  // Fire nutrition fetch non-blocking
  fetchAndStoreNutrition(recipe.id, values)

  revalidatePath('/dashboard')
  redirect(`/recipes/${recipe.id}`)
}

async function fetchAndStoreNutrition(recipeId: string, values: RecipeFormValues) {
  try {
    const supabase = createClient()
    const ingredientObjs = values.ingredients.map((ing, idx) => ({
      id: '',
      recipe_id: recipeId,
      sort_order: idx,
      name: ing.name,
      quantity: ing.quantity ? parseFloat(ing.quantity) : null,
      unit: ing.unit || null,
      notes: ing.notes || null,
    }))
    const nutrition = await getNutrition(ingredientObjs, values.servings, values.title)
    if (nutrition) {
      await supabase
        .from('recipes')
        .update({
          calories: nutrition.calories,
          protein_g: nutrition.protein_g,
          carbs_g: nutrition.carbs_g,
          fat_g: nutrition.fat_g,
        })
        .eq('id', recipeId)
    }
  } catch {
    // Nutrition fetch is best-effort
  }
}

export async function updateRecipe(id: string, values: RecipeFormValues) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { error } = await supabase
    .from('recipes')
    .update({
      title: values.title,
      description: values.description || null,
      cover_image: values.cover_image || null,
      servings: values.servings,
      prep_time_mins: values.prep_time_mins,
      cook_time_mins: values.cook_time_mins,
      cuisine: values.cuisine || null,
      tags: cleanTags(values.tags, values.cuisine),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  // Replace ingredients and steps
  await supabase.from('ingredients').delete().eq('recipe_id', id)
  await supabase.from('steps').delete().eq('recipe_id', id)

  if (values.ingredients.length > 0) {
    await supabase.from('ingredients').insert(
      values.ingredients.map((ing, idx) => ({
        recipe_id: id,
        sort_order: idx,
        name: ing.name,
        quantity: ing.quantity ? parseFloat(ing.quantity) : null,
        unit: ing.unit || null,
        notes: ing.notes || null,
      }))
    )
  }

  if (values.steps.length > 0) {
    await supabase.from('steps').insert(
      values.steps.map((step, idx) => ({
        recipe_id: id,
        step_number: idx + 1,
        instruction: step.instruction,
      }))
    )
  }

  fetchAndStoreNutrition(id, values)

  revalidatePath(`/recipes/${id}`)
  revalidatePath('/dashboard')
  redirect(`/recipes/${id}`)
}

export async function deleteRecipe(id: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('recipes').delete().eq('id', id).eq('user_id', user.id)

  revalidatePath('/dashboard')
  redirect('/dashboard')
}
