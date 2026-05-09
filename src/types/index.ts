export interface Ingredient {
  id: string
  recipe_id: string
  sort_order: number
  name: string
  quantity: number | null
  unit: string | null
  notes: string | null
}

export interface Step {
  id: string
  recipe_id: string
  step_number: number
  instruction: string
}

export interface Recipe {
  id: string
  user_id: string
  title: string
  description: string | null
  source_url: string | null
  source_type: 'url' | 'paste' | 'manual'
  cover_image: string | null
  servings: number
  prep_time_mins: number | null
  cook_time_mins: number | null
  cuisine: string | null
  tags: string[]
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  share_token: string | null
  created_at: string
  updated_at: string
  ingredients?: Ingredient[]
  steps?: Step[]
  cookbook_ids?: string[]
}

export interface Cookbook {
  id: string
  user_id: string
  name: string
  description: string | null
  cover_image: string | null
  created_at: string
  updated_at: string
}

export interface MealPlanSlot {
  id: string
  user_id: string
  week_start: string
  day_of_week: number
  meal_type: 'breakfast' | 'lunch' | 'dinner'
  recipe_id: string | null
  recipe?: Recipe
}

export interface GroceryList {
  id: string
  user_id: string
  name: string
  created_at: string
  updated_at: string
  items?: GroceryItem[]
}

export type AisleCategory =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'seafood'
  | 'pantry'
  | 'frozen'
  | 'bakery'
  | 'beverages'
  | 'spices'
  | 'other'

export interface GroceryItem {
  id: string
  grocery_list_id: string
  name: string
  quantity: string | null
  unit: string | null
  aisle: AisleCategory
  source_recipe: string | null
  checked: boolean
  sort_order: number
}

export interface ParsedRecipe {
  title: string
  description: string
  servings: number
  prep_time_mins: number | null
  cook_time_mins: number | null
  cuisine: string | null
  tags: string[]
  cover_image_url: string | null
  ingredients: Array<{
    name: string
    quantity: number | null
    unit: string | null
    notes: string | null
  }>
  steps: Array<{ instruction: string }>
}

export interface NutritionData {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export type RecipeFormValues = {
  title: string
  description: string
  source_url: string
  cover_image: string
  servings: number
  prep_time_mins: number | null
  cook_time_mins: number | null
  cuisine: string
  tags: string[]
  ingredients: Array<{
    name: string
    quantity: string
    unit: string
    notes: string
  }>
  steps: Array<{ instruction: string }>
}
