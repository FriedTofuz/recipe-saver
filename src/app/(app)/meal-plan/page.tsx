import { createClient } from '@/lib/supabase/server'
import { MealPlanCalendar } from '@/components/meal-plan/MealPlanCalendar'
import type { Recipe } from '@/types'

export default async function MealPlanPage() {
  const supabase = createClient()

  const [{ data: slots }, { data: recipes }] = await Promise.all([
    supabase
      .from('meal_plan_slots')
      .select('*, recipe:recipes(id, title, cover_image, servings, prep_time_mins, cook_time_mins, cuisine)')
      .order('week_start')
      .order('day_of_week'),
    supabase
      .from('recipes')
      .select('id, title, cover_image, servings, cuisine, tags, prep_time_mins, cook_time_mins')
      .order('title'),
  ])

  return (
    <MealPlanCalendar
      initialSlots={(slots as any[]) ?? []}
      recipes={(recipes as Recipe[]) ?? []}
    />
  )
}
