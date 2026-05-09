import { RecipeCard } from './RecipeCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { Recipe } from '@/types'

interface RecipeGridProps {
  recipes: Recipe[]
}

export function RecipeGrid({ recipes }: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <div
        style={{
          marginTop: 24,
          padding: '60px 24px',
          borderRadius: 14,
          border: '1.5px dashed var(--rule)',
          textAlign: 'center',
          color: 'var(--ink-soft)',
          background: 'rgba(255,255,255,.3)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontSize: 22,
            marginBottom: 8,
          }}
        >
          An empty page, awaiting.
        </div>
        <p style={{ margin: '0 auto 18px', maxWidth: 380, fontSize: 14, lineHeight: 1.5 }}>
          Paste in a link from a blog you love, or write one from scratch.
        </p>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 24,
      }}
    >
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}

export function RecipeGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-[4/3] rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}
