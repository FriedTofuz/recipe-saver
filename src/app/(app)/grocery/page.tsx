import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GroceryPage } from '@/components/grocery/GroceryPage'
import { getOrSeedAisles } from '@/actions/grocery'
import type { GroceryItem } from '@/types'

export default async function Grocery() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const aisles = await getOrSeedAisles()

  const { data: items } = await supabase
    .from('grocery_items')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })

  return (
    <GroceryPage
      initialAisles={aisles}
      initialItems={(items as GroceryItem[]) ?? []}
    />
  )
}
