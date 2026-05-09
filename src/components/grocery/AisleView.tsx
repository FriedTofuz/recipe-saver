import { GroceryItem } from './GroceryItem'
import type { GroceryItem as GroceryItemType, AisleCategory } from '@/types'

const AISLE_ORDER: AisleCategory[] = [
  'produce',
  'meat',
  'seafood',
  'dairy',
  'frozen',
  'bakery',
  'pantry',
  'spices',
  'beverages',
  'other',
]

const AISLE_LABELS: Record<AisleCategory, string> = {
  produce: '🥦 Produce',
  meat: '🥩 Meat',
  seafood: '🐟 Seafood',
  dairy: '🧀 Dairy',
  frozen: '🧊 Frozen',
  bakery: '🍞 Bakery',
  pantry: '🥫 Pantry',
  spices: '🧂 Spices & Herbs',
  beverages: '🥤 Beverages',
  other: '📦 Other',
}

interface AisleViewProps {
  items: GroceryItemType[]
}

export function AisleView({ items }: AisleViewProps) {
  const grouped = AISLE_ORDER.reduce<Record<string, GroceryItemType[]>>((acc, aisle) => {
    const aisleItems = items.filter((i) => i.aisle === aisle)
    if (aisleItems.length > 0) acc[aisle] = aisleItems
    return acc
  }, {})

  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">No items in this list.</p>
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([aisle, aisleItems]) => (
        <div key={aisle}>
          <h3 className="font-semibold text-sm mb-2">
            {AISLE_LABELS[aisle as AisleCategory] ?? aisle}
          </h3>
          <ul className="divide-y">
            {aisleItems.map((item) => (
              <GroceryItem key={item.id} item={item} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
