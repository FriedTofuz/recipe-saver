'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, Users, Edit, Trash2, Share2, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ServingScaler } from './ServingScaler'
import { CookingMode } from './CookingMode'
import { ShareButton } from '@/components/share/ShareButton'
import { deleteRecipe } from '@/actions/recipe'
import { toast } from 'sonner'
import type { Recipe } from '@/types'

interface RecipeDetailProps {
  recipe: Recipe
}

export function RecipeDetail({ recipe }: RecipeDetailProps) {
  const [cookingMode, setCookingMode] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const totalTime = (recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0)

  async function handleDelete() {
    if (!confirm('Delete this recipe?')) return
    setDeleting(true)
    try {
      await deleteRecipe(recipe.id)
    } catch {
      toast.error('Failed to delete recipe')
      setDeleting(false)
    }
  }

  if (cookingMode && recipe.steps && recipe.ingredients) {
    return (
      <CookingMode
        steps={recipe.steps}
        ingredients={recipe.ingredients}
        title={recipe.title}
        onClose={() => setCookingMode(false)}
      />
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Cover image */}
      {recipe.cover_image && (
        <div className="relative aspect-[16/7] rounded-xl overflow-hidden">
          <Image
            src={recipe.cover_image}
            alt={recipe.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold">{recipe.title}</h1>
          <div className="flex gap-2 shrink-0">
            <ShareButton recipeId={recipe.id} shareToken={recipe.share_token} />
            <Button variant="outline" size="icon" asChild>
              <Link href={`/recipes/${recipe.id}/edit`}>
                <Edit className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {recipe.description && (
          <p className="text-muted-foreground">{recipe.description}</p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {recipe.prep_time_mins && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Prep: {recipe.prep_time_mins}m
            </span>
          )}
          {recipe.cook_time_mins && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Cook: {recipe.cook_time_mins}m
            </span>
          )}
          {totalTime > 0 && (
            <span>Total: {totalTime}m</span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {recipe.servings} servings
          </span>
          {recipe.cuisine && <span>{recipe.cuisine}</span>}
        </div>

        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.map((tag) => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}

        {recipe.source_url && (
          <a
            href={recipe.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground underline"
          >
            Source
          </a>
        )}
      </div>

      {/* Start cooking button */}
      {recipe.steps && recipe.steps.length > 0 && (
        <Button size="lg" onClick={() => setCookingMode(true)} className="gap-2">
          <ChefHat className="h-5 w-5" />
          Start Cooking
        </Button>
      )}

      <Separator />

      {/* Ingredients with scaling */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
        {recipe.ingredients && recipe.ingredients.length > 0 ? (
          <ServingScaler
            baseServings={recipe.servings}
            ingredients={recipe.ingredients}
            calories={recipe.calories}
            protein_g={recipe.protein_g}
            carbs_g={recipe.carbs_g}
            fat_g={recipe.fat_g}
          />
        ) : (
          <p className="text-muted-foreground text-sm">No ingredients listed.</p>
        )}
      </div>

      <Separator />

      {/* Steps */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        {recipe.steps && recipe.steps.length > 0 ? (
          <ol className="space-y-4">
            {recipe.steps.map((step) => (
              <li key={step.id} className="flex gap-4">
                <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold">
                  {step.step_number}
                </span>
                <p className="pt-0.5 leading-relaxed">{step.instruction}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-muted-foreground text-sm">No steps listed.</p>
        )}
      </div>
    </div>
  )
}
