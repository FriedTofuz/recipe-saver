import Link from 'next/link'
import Image from 'next/image'
import { Clock, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Recipe } from '@/types'

interface RecipeCardProps {
  recipe: Recipe
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = (recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0)

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow group">
        <div className="relative aspect-[4/3] bg-muted">
          {recipe.cover_image ? (
            <Image
              src={recipe.cover_image}
              alt={recipe.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl text-muted-foreground/30">
              🍽️
            </div>
          )}
        </div>

        <CardContent className="p-3 space-y-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2">{recipe.title}</h3>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {totalTime > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {totalTime}m
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {recipe.servings}
            </span>
            {recipe.calories && (
              <span>{Math.round(recipe.calories)} kcal</span>
            )}
          </div>

          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
