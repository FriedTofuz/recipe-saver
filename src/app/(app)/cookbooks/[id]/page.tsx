import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RecipeGrid } from '@/components/recipe/RecipeGrid'
import { WavyRule } from '@/components/paper'
import type { Recipe } from '@/types'

interface CookbookPageProps {
  params: { id: string }
}

export default async function CookbookPage({ params }: CookbookPageProps) {
  const supabase = createClient()

  const [{ data: cookbook }, { data: recipeLinks }] = await Promise.all([
    supabase.from('cookbooks').select('*').eq('id', params.id).single(),
    supabase
      .from('recipe_cookbooks')
      .select('recipe_id')
      .eq('cookbook_id', params.id),
  ])

  if (!cookbook) notFound()

  const recipeIds = (recipeLinks ?? []).map((rl) => rl.recipe_id)
  let recipes: Recipe[] = []

  if (recipeIds.length > 0) {
    const { data } = await supabase
      .from('recipes')
      .select('*')
      .in('id', recipeIds)
      .order('created_at', { ascending: false })
    recipes = (data as Recipe[]) ?? []
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Link
        href="/cookbooks"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 0',
          marginBottom: 14,
          color: 'var(--ink-soft)',
          fontSize: 13,
          fontFamily: 'var(--font-sans)',
          textDecoration: 'none',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Back to cookbooks
      </Link>

      <header>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          From the cookbook
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontWeight: 500,
            fontSize: 52,
            lineHeight: 1,
            margin: '6px 0 0',
            color: 'var(--ink)',
          }}
        >
          <em style={{ fontStyle: 'italic' }}>{cookbook.name}</em>
        </h1>
        {cookbook.description && (
          <p style={{ margin: '10px 0 0', color: 'var(--ink-soft)', maxWidth: 520, fontSize: 15, lineHeight: 1.5 }}>
            {cookbook.description}
          </p>
        )}
      </header>

      <WavyRule style={{ margin: '22px 0 28px' }} />

      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          Recipes
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontWeight: 500,
            fontSize: 26,
            margin: '4px 0 0',
            color: 'var(--ink)',
          }}
        >
          {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
        </h2>
      </div>

      <RecipeGrid recipes={recipes} />
    </div>
  )
}
