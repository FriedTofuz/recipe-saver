'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createGroceryList(name: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('grocery_lists')
    .insert({ user_id: user.id, name })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/grocery-lists')
  return data
}

export async function deleteGroceryList(id: string) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('grocery_lists').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/grocery-lists')
}

export async function toggleGroceryItem(itemId: string, checked: boolean) {
  const supabase = createClient()
  await supabase.from('grocery_items').update({ checked }).eq('id', itemId)
}

export async function addItemsToGroceryList(
  listId: string,
  items: Array<{
    name: string
    quantity: string | null
    unit: string | null
    aisle: string
    source_recipe: string | null
    sort_order: number
  }>
) {
  const supabase = createClient()
  await supabase.from('grocery_items').insert(
    items.map((item) => ({ ...item, grocery_list_id: listId, checked: false }))
  )
  revalidatePath(`/grocery-lists/${listId}`)
}

export async function clearCheckedItems(listId: string) {
  const supabase = createClient()
  await supabase
    .from('grocery_items')
    .delete()
    .eq('grocery_list_id', listId)
    .eq('checked', true)
  revalidatePath(`/grocery-lists/${listId}`)
}
