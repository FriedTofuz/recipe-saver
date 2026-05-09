'use client'

import { useTransition } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { IngredientList } from './IngredientList'
import { StepList } from './StepList'
import { TagInput } from './TagInput'
import { ImageUpload } from './ImageUpload'
import { createRecipe, updateRecipe } from '@/actions/recipe'
import type { Recipe, RecipeFormValues, ParsedRecipe } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().default(''),
  source_url: z.string().default(''),
  cover_image: z.string().default(''),
  servings: z.coerce.number().int().min(1).default(4),
  prep_time_mins: z.coerce.number().int().min(0).nullable().default(null),
  cook_time_mins: z.coerce.number().int().min(0).nullable().default(null),
  cuisine: z.string().default(''),
  tags: z.array(z.string()).default([]),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1, 'Name required'),
        quantity: z.string().default(''),
        unit: z.string().default(''),
        notes: z.string().default(''),
      })
    )
    .default([]),
  steps: z
    .array(z.object({ instruction: z.string().min(1, 'Instruction required') }))
    .default([]),
})

function parsedToFormValues(parsed: ParsedRecipe): Partial<RecipeFormValues> {
  return {
    title: parsed.title,
    description: parsed.description,
    servings: parsed.servings,
    prep_time_mins: parsed.prep_time_mins,
    cook_time_mins: parsed.cook_time_mins,
    cuisine: parsed.cuisine ?? '',
    tags: parsed.tags,
    cover_image: parsed.cover_image_url ?? '',
    ingredients: parsed.ingredients.map((i) => ({
      name: i.name,
      quantity: i.quantity?.toString() ?? '',
      unit: i.unit ?? '',
      notes: i.notes ?? '',
    })),
    steps: parsed.steps,
  }
}

function recipeToFormValues(recipe: Recipe): RecipeFormValues {
  return {
    title: recipe.title,
    description: recipe.description ?? '',
    source_url: recipe.source_url ?? '',
    cover_image: recipe.cover_image ?? '',
    servings: recipe.servings,
    prep_time_mins: recipe.prep_time_mins,
    cook_time_mins: recipe.cook_time_mins,
    cuisine: recipe.cuisine ?? '',
    tags: recipe.tags,
    ingredients: (recipe.ingredients ?? []).map((i) => ({
      name: i.name,
      quantity: i.quantity?.toString() ?? '',
      unit: i.unit ?? '',
      notes: i.notes ?? '',
    })),
    steps: (recipe.steps ?? []).map((s) => ({ instruction: s.instruction })),
  }
}

interface RecipeFormProps {
  recipe?: Recipe
  parsed?: ParsedRecipe
  sourceType?: 'url' | 'paste' | 'manual'
  sourceUrl?: string
}

export function RecipeForm({ recipe, parsed, sourceType = 'manual', sourceUrl }: RecipeFormProps) {
  const [isPending, startTransition] = useTransition()

  const defaultValues: RecipeFormValues = recipe
    ? recipeToFormValues(recipe)
    : parsed
    ? { ...schema.parse({}), ...parsedToFormValues(parsed) }
    : schema.parse({})

  const methods = useForm<RecipeFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = methods

  const tags = watch('tags')
  const coverImage = watch('cover_image')

  function onSubmit(values: RecipeFormValues) {
    startTransition(async () => {
      try {
        if (recipe) {
          await updateRecipe(recipe.id, values)
        } else {
          await createRecipe(values, sourceType, sourceUrl)
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
        {/* Basic info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...register('title')} placeholder="Recipe title" />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description"
              rows={2}
            />
          </div>

          <ImageUpload
            value={coverImage}
            onChange={(url) => setValue('cover_image', url)}
          />
        </div>

        <Separator />

        {/* Times and metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="servings">Servings</Label>
            <Input id="servings" type="number" min={1} {...register('servings')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prep">Prep (min)</Label>
            <Input id="prep" type="number" min={0} {...register('prep_time_mins')} placeholder="—" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cook">Cook (min)</Label>
            <Input id="cook" type="number" min={0} {...register('cook_time_mins')} placeholder="—" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cuisine">Cuisine</Label>
            <Input id="cuisine" {...register('cuisine')} placeholder="Italian…" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <TagInput tags={tags} onChange={(t) => setValue('tags', t)} />
        </div>

        <Separator />

        {/* Ingredients */}
        <div className="space-y-3">
          <h3 className="font-semibold">Ingredients</h3>
          <IngredientList />
        </div>

        <Separator />

        {/* Steps */}
        <div className="space-y-3">
          <h3 className="font-semibold">Steps</h3>
          <StepList />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving…' : recipe ? 'Save changes' : 'Save recipe'}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
