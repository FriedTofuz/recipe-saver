'use client'

import { useFieldArray, useFormContext } from 'react-hook-form'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import type { RecipeFormValues } from '@/types'

function SortableStep({
  id,
  index,
  onRemove,
}: {
  id: string
  index: number
  onRemove: () => void
}) {
  const { register } = useFormContext<RecipeFormValues>()
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex gap-2 items-start">
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="mt-2 text-muted-foreground cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="mt-2 text-sm font-medium text-muted-foreground w-6 shrink-0">
        {index + 1}.
      </span>
      <Textarea
        {...register(`steps.${index}.instruction`)}
        placeholder={`Step ${index + 1}`}
        rows={2}
        className="flex-1 resize-none"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="mt-1 shrink-0 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function StepList() {
  const { control } = useFormContext<RecipeFormValues>()
  const { fields, append, remove, move } = useFieldArray({ control, name: 'steps' })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)
      move(oldIndex, newIndex)
    }
  }

  return (
    <div className="space-y-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          {fields.map((field, index) => (
            <SortableStep
              key={field.id}
              id={field.id}
              index={index}
              onRemove={() => remove(index)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ instruction: '' })}
      >
        <Plus className="h-4 w-4 mr-1" />
        Add step
      </Button>
    </div>
  )
}
