'use client'

import { useFieldArray, useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import type { RecipeFormValues } from '@/types'

export function IngredientList() {
  const { control, register } = useFormContext<RecipeFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'ingredients' })

  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-center">
          <Input
            {...register(`ingredients.${index}.quantity`)}
            placeholder="Qty"
            className="w-20 shrink-0"
          />
          <Input
            {...register(`ingredients.${index}.unit`)}
            placeholder="Unit"
            className="w-24 shrink-0"
          />
          <Input
            {...register(`ingredients.${index}.name`)}
            placeholder="Ingredient name"
            className="flex-1"
          />
          <Input
            {...register(`ingredients.${index}.notes`)}
            placeholder="Notes"
            className="w-32 shrink-0 hidden sm:block"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ name: '', quantity: '', unit: '', notes: '' })}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add ingredient
      </Button>
    </div>
  )
}
