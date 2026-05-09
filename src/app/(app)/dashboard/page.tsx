import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RecipeGrid } from '@/components/recipe/RecipeGrid'
import { SearchBar } from '@/components/recipe/SearchBar'
import { WavyRule, InkDoodle } from '@/components/paper'
import type { Recipe } from '@/types'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { q?: string; tag?: string; cuisine?: string }
}) {
  const supabase = createClient()

  let query = supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })

  if (searchParams.q) {
    query = query.ilike('title', `%${searchParams.q}%`)
  }
  if (searchParams.tag) {
    query = query.contains('tags', [searchParams.tag])
  }
  if (searchParams.cuisine) {
    query = query.ilike('cuisine', searchParams.cuisine)
  }

  const { data: recipes } = await query

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Page header */}
      <header style={{ marginBottom: 8 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                color: 'var(--ink-faint)',
              }}
            >
              Volume I · {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
              Your <em style={{ fontStyle: 'italic' }}>recipes</em>
            </h1>
            <p
              style={{
                margin: '10px 0 0',
                color: 'var(--ink-soft)',
                maxWidth: 520,
                fontSize: 15,
                lineHeight: 1.5,
              }}
            >
              A pantry of recipes — pulled from blogs, scribbled from memory, handed down.
            </p>
          </div>

          <Link
            href="/recipes/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 16px',
              borderRadius: 999,
              border: '1px solid var(--accent-ink)',
              background: 'var(--accent-ink)',
              color: 'var(--paper)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 500,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <InkDoodle kind="whisk" size={14} color="currentColor" />
            New recipe
          </Link>
        </div>
      </header>

      <WavyRule style={{ margin: '22px 0 24px' }} />

      {/* Search */}
      <Suspense fallback={<div style={{ height: 40, borderRadius: 999, background: 'rgba(255,255,255,.35)', border: '1px solid var(--rule)' }} />}>
        <SearchBar />
      </Suspense>

      {/* Recipe section heading */}
      <div style={{ marginTop: 28, marginBottom: 18 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          {searchParams.q ? 'Search results' : 'Recently saved'}
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
          {searchParams.q
            ? `${(recipes ?? []).length} matches`
            : 'All recipes'}
        </h2>
      </div>

      <RecipeGrid recipes={(recipes as Recipe[]) ?? []} />
    </div>
  )
}
