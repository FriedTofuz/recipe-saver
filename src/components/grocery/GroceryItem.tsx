'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { toggleGroceryItem } from '@/actions/grocery'
import { cn } from '@/lib/utils'
import type { GroceryItem as GroceryItemType } from '@/types'

interface GroceryItemProps {
  item: GroceryItemType
}

export function GroceryItem({ item }: GroceryItemProps) {
  const [checked, setChecked] = useState(item.checked)

  async function handleToggle() {
    const next = !checked
    setChecked(next)
    await toggleGroceryItem(item.id, next)
  }

  return (
    <li className="flex items-center gap-3 py-1.5">
      <Checkbox checked={checked} onCheckedChange={handleToggle} />
      <span
        className={cn(
          'text-sm flex gap-1.5 flex-1',
          checked && 'line-through text-muted-foreground'
        )}
      >
        {(item.quantity || item.unit) && (
          <span className="font-medium shrink-0">
            {item.quantity} {item.unit}
          </span>
        )}
        <span>{item.name}</span>
      </span>
      {item.source_recipe && (
        <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
          {item.source_recipe}
        </span>
      )}
    </li>
  )
}
