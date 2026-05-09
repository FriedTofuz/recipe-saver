'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function upsertMealPlanSlot(
  weekStart: string,
  dayOfWeek: number,
  mealType: 'breakfast' | 'lunch' | 'dinner',
  recipeId: string | null
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  if (recipeId === null) {
    await supabase
      .from('meal_plan_slots')
      .delete()
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .eq('day_of_week', dayOfWeek)
      .eq('meal_type', mealType)
  } else {
    await supabase.from('meal_plan_slots').upsert(
      {
        user_id: user.id,
        week_start: weekStart,
        day_of_week: dayOfWeek,
        meal_type: mealType,
        recipe_id: recipeId,
      },
      { onConflict: 'user_id,week_start,day_of_week,meal_type' }
    )
  }

  revalidatePath('/meal-plan')
}

export async function getMealPlanForWeek(weekStart: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('meal_plan_slots')
    .select('*, recipe:recipes(id, title, cover_image, servings, calories)')
    .eq('week_start', weekStart)
    .order('day_of_week')
    .order('meal_type')

  return data ?? []
}
