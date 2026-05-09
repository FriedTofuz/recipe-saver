import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ShoppingCart, Plus, Trash2 } from 'lucide-react'
import { DeleteGroceryListButton } from '@/components/grocery/DeleteGroceryListButton'
import { NewGroceryListButton } from '@/components/grocery/NewGroceryListButton'
import type { GroceryList, Recipe } from '@/types'

export default async function GroceryListsPage({
  searchParams,
}: {
  searchParams: { recipe?: string | string[] }
}) {
  const supabase = createClient()

  const [{ data: lists }, { data: recipes }] = await Promise.all([
    supabase
      .from('grocery_lists')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('recipes').select('id, title').order('title'),
  ])

  const preselectedRecipes = searchParams.recipe
    ? Array.isArray(searchParams.recipe)
      ? searchParams.recipe
      : [searchParams.recipe]
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Grocery Lists</h1>
        <NewGroceryListButton
          recipes={(recipes as Pick<Recipe, 'id' | 'title'>[]) ?? []}
          preselectedIds={preselectedRecipes}
        />
      </div>

      {(lists ?? []).length === 0 ? (
        <p className="text-muted-foreground text-sm">No grocery lists yet.</p>
      ) : (
        <div className="space-y-2">
          {(lists as GroceryList[]).map((list) => (
            <div key={list.id} className="flex items-center gap-2">
              <Link href={`/grocery-lists/${list.id}`} className="flex-1">
                <Card className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-3 flex items-center gap-3">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{list.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(list.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <DeleteGroceryListButton id={list.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
