'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { normalizeIngredient } from '@/lib/grocery-suggestions'
import type { GroceryItem } from '@/types'

async function requireUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return { supabase, user }
}

function mergeRecipes(existing: string | null, incoming: string | null): string | null {
  if (!incoming) return existing
  if (!existing) return incoming
  const set = new Set(existing.split(',').map((s) => s.trim()).filter(Boolean))
  for (const r of incoming.split(',').map((s) => s.trim()).filter(Boolean)) {
    set.add(r)
  }
  return Array.from(set).join(', ')
}

export async function addItem(input: {
  name: string
  quantity?: string | null
  unit?: string | null
  source_recipe?: string | null
  /** When true, an existing item with the same normalized name is merged
   *  (recipe attribution is appended). Manual adds pass false to allow dupes. */
  mergeOnDuplicate?: boolean
}): Promise<{ item: GroceryItem; merged: boolean }> {
  const { supabase, user } = await requireUser()
  const name = input.name.trim()
  if (!name) throw new Error('Item name required')

  if (input.mergeOnDuplicate) {
    const norm = normalizeIngredient(name)
    const { data: existingItems } = await supabase
      .from('grocery_items')
      .select('*')
      .eq('user_id', user.id)
    const dupe = (existingItems as GroceryItem[] | null)?.find(
      (it) => normalizeIngredient(it.name) === norm
    )
    if (dupe) {
      const nextSource = mergeRecipes(dupe.source_recipe, input.source_recipe ?? null)
      const { data: updated } = await supabase
        .from('grocery_items')
        .update({ source_recipe: nextSource, checked: false })
        .eq('id', dupe.id)
        .select()
        .single()
      revalidatePath('/grocery')
      return { item: updated as GroceryItem, merged: true }
    }
  }

  const { data: tail } = await supabase
    .from('grocery_items')
    .select('sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: false })
    .limit(1)
  const nextOrder = (tail?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('grocery_items')
    .insert({
      user_id: user.id,
      name,
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      source_recipe: input.source_recipe ?? null,
      sort_order: nextOrder,
    })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/grocery')
  return { item: data as GroceryItem, merged: false }
}

export async function updateItem(
  itemId: string,
  patch: Partial<{
    name: string
    quantity: string | null
    unit: string | null
    checked: boolean
    sort_order: number
    source_recipe: string | null
  }>
) {
  const { supabase, user } = await requireUser()
  await supabase
    .from('grocery_items')
    .update(patch)
    .eq('id', itemId)
    .eq('user_id', user.id)
  revalidatePath('/grocery')
}

export async function deleteItem(itemId: string) {
  const { supabase, user } = await requireUser()
  await supabase
    .from('grocery_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id)
  revalidatePath('/grocery')
}

export async function reorderItems(itemIds: string[]) {
  const { supabase, user } = await requireUser()
  await Promise.all(
    itemIds.map((id, idx) =>
      supabase
        .from('grocery_items')
        .update({ sort_order: idx })
        .eq('id', id)
        .eq('user_id', user.id)
    )
  )
  revalidatePath('/grocery')
}

export async function clearAllItems() {
  const { supabase, user } = await requireUser()
  await supabase.from('grocery_items').delete().eq('user_id', user.id)
  revalidatePath('/grocery')
}

export async function clearCheckedItems() {
  const { supabase, user } = await requireUser()
  await supabase
    .from('grocery_items')
    .delete()
    .eq('user_id', user.id)
    .eq('checked', true)
  revalidatePath('/grocery')
}
