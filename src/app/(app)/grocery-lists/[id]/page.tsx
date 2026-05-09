'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { AisleView } from '@/components/grocery/AisleView'
import { RecipeView } from '@/components/grocery/RecipeView'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { clearCheckedItems } from '@/actions/grocery'
import { toast } from 'sonner'
import type { GroceryList } from '@/types'

export default function GroceryListPage() {
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const { data: list, mutate } = useSWR(`grocery-list-${id}`, async () => {
    const { data } = await supabase
      .from('grocery_lists')
      .select('*, items:grocery_items(*)')
      .eq('id', id)
      .order('sort_order', { foreignTable: 'grocery_items' })
      .single()
    return data as GroceryList
  })

  async function handleClearChecked() {
    try {
      await clearCheckedItems(id)
      mutate()
      toast.success('Checked items cleared')
    } catch {
      toast.error('Failed to clear items')
    }
  }

  if (!list) return null

  const items = list.items ?? []
  const checkedCount = items.filter((i) => i.checked).length

  return (
    <div className="space-y-4 max-w-xl">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">{list.name}</h1>
        {checkedCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearChecked}>
            Clear {checkedCount} checked
          </Button>
        )}
      </div>

      <Tabs defaultValue="aisle">
        <TabsList>
          <TabsTrigger value="aisle">By Aisle</TabsTrigger>
          <TabsTrigger value="recipe">By Recipe</TabsTrigger>
        </TabsList>
        <TabsContent value="aisle" className="mt-4">
          <AisleView items={items} />
        </TabsContent>
        <TabsContent value="recipe" className="mt-4">
          <RecipeView items={items} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
