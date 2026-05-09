'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createCookbook(name: string, description?: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('cookbooks')
    .insert({ user_id: user.id, name, description: description || null })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/cookbooks')
  return data
}

export async function updateCookbook(id: string, name: string, description?: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase
    .from('cookbooks')
    .update({ name, description: description || null })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath(`/cookbooks/${id}`)
  revalidatePath('/cookbooks')
}

export async function deleteCookbook(id: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('cookbooks').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/cookbooks')
}

export async function addRecipeToCookbook(recipeId: string, cookbookId: string) {
  const supabase = createClient()
  await supabase
    .from('recipe_cookbooks')
    .upsert({ recipe_id: recipeId, cookbook_id: cookbookId })

  revalidatePath(`/cookbooks/${cookbookId}`)
  revalidatePath(`/recipes/${recipeId}`)
}

export async function removeRecipeFromCookbook(recipeId: string, cookbookId: string) {
  const supabase = createClient()
  await supabase
    .from('recipe_cookbooks')
    .delete()
    .eq('recipe_id', recipeId)
    .eq('cookbook_id', cookbookId)

  revalidatePath(`/cookbooks/${cookbookId}`)
  revalidatePath(`/recipes/${recipeId}`)
}

export async function setRecipeCookbooks(recipeId: string, cookbookIds: string[]) {
  const supabase = createClient()
  await supabase.from('recipe_cookbooks').delete().eq('recipe_id', recipeId)

  if (cookbookIds.length > 0) {
    await supabase.from('recipe_cookbooks').insert(
      cookbookIds.map((id) => ({ recipe_id: recipeId, cookbook_id: id }))
    )
  }

  revalidatePath(`/recipes/${recipeId}`)
}
