'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Minus, Plus } from 'lucide-react'
import { scaleQuantity, convertUnit } from '@/lib/ingredient-scaler'
import type { Ingredient } from '@/types'

interface ServingScalerProps {
  baseServings: number
  ingredients: Ingredient[]
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
}

export function ServingScaler({
  baseServings,
  ingredients,
  calories,
  protein_g,
  carbs_g,
  fat_g,
}: ServingScalerProps) {
  const [servings, setServings] = useState(baseServings)
  const [isMetric, setIsMetric] = useState(false)

  const multiplier = servings / baseServings

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Servings</span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setServings(Math.max(1, servings - 1))}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center font-semibold">{servings}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setServings(servings + 1)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMetric(!isMetric)}
          className="text-xs"
        >
          {isMetric ? 'US' : 'Metric'}
        </Button>
      </div>

      <ul className="space-y-1.5">
        {ingredients.map((ing) => {
          const scaledQty = scaleQuantity(ing.quantity, baseServings, servings)
          const { quantity: convertedQty, unit: convertedUnit } = convertUnit(
            ing.quantity !== null ? (ing.quantity * servings) / baseServings : null,
            ing.unit,
            isMetric
          )
          const displayQty = isMetric ? convertedQty : scaledQty
          const displayUnit = isMetric ? convertedUnit : ing.unit ?? ''

          return (
            <li key={ing.id} className="flex gap-2 text-sm">
              <span className="font-medium w-14 text-right shrink-0">
                {displayQty || ''}
              </span>
              <span className="text-muted-foreground w-14 shrink-0">{displayUnit}</span>
              <span>
                {ing.name}
                {ing.notes && (
                  <span className="text-muted-foreground">, {ing.notes}</span>
                )}
              </span>
            </li>
          )
        })}
      </ul>

      {(calories || protein_g || carbs_g || fat_g) && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Nutrition per serving
          </p>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: 'Calories', val: calories },
              { label: 'Protein', val: protein_g },
              { label: 'Carbs', val: carbs_g },
              { label: 'Fat', val: fat_g },
            ].map(({ label, val }) => (
              <div key={label}>
                <p className="text-base font-bold">
                  {val !== null ? Math.round(val * multiplier) : '—'}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
