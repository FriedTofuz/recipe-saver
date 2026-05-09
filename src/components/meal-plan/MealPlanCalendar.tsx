'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import { WeekNav } from './WeekNav'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, X } from 'lucide-react'
import { upsertMealPlanSlot } from '@/actions/meal-plan'
import { createGroceryList } from '@/actions/grocery'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Recipe, MealPlanSlot } from '@/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEALS: Array<'breakfast' | 'lunch' | 'dinner'> = ['breakfast', 'lunch', 'dinner']

function getISOMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

function DraggableRecipe({ recipe }: { recipe: Recipe }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: recipe.id,
    data: { recipe },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'p-2 rounded border bg-card text-xs cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-50'
      )}
    >
      {recipe.title}
    </div>
  )
}

function MealSlot({
  day,
  meal,
  weekStart,
  slot,
  onRemove,
}: {
  day: number
  meal: 'breakfast' | 'lunch' | 'dinner'
  weekStart: string
  slot?: MealPlanSlot
  onRemove: () => void
}) {
  const droppableId = `${weekStart}-${day}-${meal}`
  const { setNodeRef, isOver } = useDroppable({ id: droppableId })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-12 rounded border border-dashed p-1 transition-colors',
        isOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/20'
      )}
    >
      {slot?.recipe ? (
        <div className="flex items-start gap-1 text-xs">
          <span className="flex-1 leading-tight">{slot.recipe.title}</span>
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}
    </div>
  )
}

interface MealPlanCalendarProps {
  initialSlots: MealPlanSlot[]
  recipes: Recipe[]
}

export function MealPlanCalendar({ initialSlots, recipes }: MealPlanCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => getISOMonday(new Date()))
  const [slots, setSlots] = useState<MealPlanSlot[]>(initialSlots)
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null)

  const weekStartStr = toDateStr(weekStart)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function getSlot(day: number, meal: string) {
    return slots.find(
      (s) => s.week_start === weekStartStr && s.day_of_week === day && s.meal_type === meal
    )
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveRecipe(null)
    if (!over) return

    const [ws, dayStr, meal] = (over.id as string).split('-')
    const recipeId = active.id as string
    const day = parseInt(dayStr)

    setSlots((prev) => {
      const filtered = prev.filter(
        (s) => !(s.week_start === ws && s.day_of_week === day && s.meal_type === meal)
      )
      const recipe = recipes.find((r) => r.id === recipeId)
      return [
        ...filtered,
        {
          id: `${ws}-${day}-${meal}`,
          user_id: '',
          week_start: ws,
          day_of_week: day,
          meal_type: meal as 'breakfast' | 'lunch' | 'dinner',
          recipe_id: recipeId,
          recipe,
        },
      ]
    })

    await upsertMealPlanSlot(ws, day, meal as 'breakfast' | 'lunch' | 'dinner', recipeId)
  }

  async function removeSlot(day: number, meal: 'breakfast' | 'lunch' | 'dinner') {
    setSlots((prev) =>
      prev.filter(
        (s) => !(s.week_start === weekStartStr && s.day_of_week === day && s.meal_type === meal)
      )
    )
    await upsertMealPlanSlot(weekStartStr, day, meal, null)
  }

  function prevWeek() {
    setWeekStart((d) => {
      const nd = new Date(d)
      nd.setDate(nd.getDate() - 7)
      return nd
    })
  }

  function nextWeek() {
    setWeekStart((d) => {
      const nd = new Date(d)
      nd.setDate(nd.getDate() + 7)
      return nd
    })
  }

  async function generateGroceryList() {
    const weekSlots = slots.filter((s) => s.week_start === weekStartStr && s.recipe_id)
    if (weekSlots.length === 0) {
      toast.error('No recipes in this week')
      return
    }
    const recipeIds = Array.from(new Set(weekSlots.map((s) => s.recipe_id).filter((id): id is string => id !== null)))
    // Navigate to grocery list creation with selected recipes
    const params = new URLSearchParams()
    recipeIds.forEach((id) => id && params.append('recipe', id))
    window.location.href = `/grocery-lists/new?${params.toString()}`
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveRecipe(recipes.find((r) => r.id === e.active.id) ?? null)}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <WeekNav weekStart={weekStart} onPrev={prevWeek} onNext={nextWeek} />
          <Button variant="outline" size="sm" onClick={generateGroceryList}>
            <ShoppingCart className="h-4 w-4 mr-1" />
            Generate grocery list
          </Button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2">
          {/* Calendar grid */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>
            {MEALS.map((meal) => (
              <div key={meal} className="grid grid-cols-7 gap-1 mb-1">
                {DAYS.map((_, di) => {
                  const day = di + 1
                  const slot = getSlot(day, meal)
                  return (
                    <MealSlot
                      key={`${day}-${meal}`}
                      day={day}
                      meal={meal}
                      weekStart={weekStartStr}
                      slot={slot}
                      onRemove={() => removeSlot(day, meal)}
                    />
                  )
                })}
              </div>
            ))}
            <div className="grid grid-cols-7 gap-1">
              {MEALS.map((m) => (
                <div key={m} className="text-[10px] text-muted-foreground capitalize pl-1">
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* Recipe sidebar */}
          <div className="w-48 shrink-0">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
              Recipes
            </p>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {recipes.map((r) => (
                <DraggableRecipe key={r.id} recipe={r} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeRecipe && (
          <div className="p-2 rounded border bg-card shadow-lg text-xs opacity-90">
            {activeRecipe.title}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
