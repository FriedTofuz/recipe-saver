import { GroceryItem } from './GroceryItem'
import type { GroceryItem as GroceryItemType } from '@/types'

interface RecipeViewProps {
  items: GroceryItemType[]
}

export function RecipeView({ items }: RecipeViewProps) {
  const grouped: Record<string, GroceryItemType[]> = {}
  for (const item of items) {
    const key = item.source_recipe ?? 'Other'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(item)
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([recipe, recipeItems]) => (
        <div key={recipe}>
          <h3 className="font-semibold text-sm mb-2">{recipe}</h3>
          <ul className="divide-y">
            {recipeItems.map((item) => (
              <GroceryItem key={item.id} item={item} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
