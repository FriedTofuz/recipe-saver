'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { GroceryAisle, GroceryItem } from '@/types'

const DEFAULT_AISLES = [
  'Produce',
  'Meat & seafood',
  'Dairy & eggs',
  'Pantry & spices',
  'Other',
]

async function requireUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return { supabase, user }
}

/**
 * Returns the user's aisles, seeding defaults the first time.
 */
export async function getOrSeedAisles(): Promise<GroceryAisle[]> {
  const { supabase, user } = await requireUser()

  const { data: existing } = await supabase
    .from('grocery_aisles')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  if (existing && existing.length > 0) {
    return existing as GroceryAisle[]
  }

  const seed = DEFAULT_AISLES.map((name, i) => ({
    user_id: user.id,
    name,
    sort_order: i,
  }))
  const { data: inserted } = await supabase
    .from('grocery_aisles')
    .insert(seed)
    .select()
  return (inserted ?? []) as GroceryAisle[]
}

export async function addAisle(name: string): Promise<GroceryAisle> {
  const { supabase, user } = await requireUser()
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Aisle name required')

  const { data: existing } = await supabase
    .from('grocery_aisles')
    .select('sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: false })
    .limit(1)
  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('grocery_aisles')
    .insert({ user_id: user.id, name: trimmed, sort_order: nextOrder })
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/grocery')
  return data as GroceryAisle
}

export async function renameAisle(aisleId: string, name: string) {
  const { supabase, user } = await requireUser()
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Aisle name required')
  await supabase
    .from('grocery_aisles')
    .update({ name: trimmed })
    .eq('id', aisleId)
    .eq('user_id', user.id)
  revalidatePath('/grocery')
}

/**
 * Deletes an aisle. Items in it are kept (aisle_id becomes null = "Uncategorized").
 */
export async function deleteAisle(aisleId: string) {
  const { supabase, user } = await requireUser()
  await supabase
    .from('grocery_aisles')
    .delete()
    .eq('id', aisleId)
    .eq('user_id', user.id)
  revalidatePath('/grocery')
}

export async function reorderAisles(aisleIds: string[]) {
  const { supabase, user } = await requireUser()
  await Promise.all(
    aisleIds.map((id, idx) =>
      supabase
        .from('grocery_aisles')
        .update({ sort_order: idx })
        .eq('id', id)
        .eq('user_id', user.id)
    )
  )
  revalidatePath('/grocery')
}

export async function addItem(input: {
  aisle_id: string | null
  name: string
  quantity?: string | null
  unit?: string | null
  source_recipe?: string | null
}): Promise<GroceryItem> {
  const { supabase, user } = await requireUser()
  const name = input.name.trim()
  if (!name) throw new Error('Item name required')

  const { data: existing } = await supabase
    .from('grocery_items')
    .select('sort_order')
    .eq('user_id', user.id)
    .eq('aisle_id', input.aisle_id)
    .order('sort_order', { ascending: false })
    .limit(1)
  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('grocery_items')
    .insert({
      user_id: user.id,
      aisle_id: input.aisle_id,
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
  return data as GroceryItem
}

export async function updateItem(
  itemId: string,
  patch: Partial<{
    name: string
    quantity: string | null
    unit: string | null
    aisle_id: string | null
    checked: boolean
    sort_order: number
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

export async function clearAisle(aisleId: string | null) {
  const { supabase, user } = await requireUser()
  let q = supabase.from('grocery_items').delete().eq('user_id', user.id)
  q = aisleId === null ? q.is('aisle_id', null) : q.eq('aisle_id', aisleId)
  await q
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
