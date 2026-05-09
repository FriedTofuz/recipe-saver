import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DeleteGroceryListButton } from '@/components/grocery/DeleteGroceryListButton'
import { NewGroceryListButton } from '@/components/grocery/NewGroceryListButton'
import { WavyRule, InkDoodle } from '@/components/paper'
import type { GroceryList, Recipe } from '@/types'

export default async function GroceryListsPage({
  searchParams,
}: {
  searchParams: { recipe?: string | string[] }
}) {
  const supabase = createClient()

  const [{ data: lists }, { data: recipes }] = await Promise.all([
    supabase
      .from('grocery_lists')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('recipes').select('id, title').order('title'),
  ])

  const preselectedRecipes = searchParams.recipe
    ? Array.isArray(searchParams.recipe)
      ? searchParams.recipe
      : [searchParams.recipe]
    : []

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 18,
          marginBottom: 14,
          flexWrap: 'wrap',
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
            To market
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
            <em style={{ fontStyle: 'italic' }}>Groceries</em>
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
            Build a list from recipes, or jot one down on a fresh page.
          </p>
        </div>

        <NewGroceryListButton
          recipes={(recipes as Pick<Recipe, 'id' | 'title'>[]) ?? []}
          preselectedIds={preselectedRecipes}
        />
      </header>

      <WavyRule style={{ margin: '22px 0 28px' }} />

      {(lists ?? []).length === 0 ? (
        <div
          style={{
            padding: '60px 24px',
            borderRadius: 14,
            border: '1.5px dashed var(--rule)',
            textAlign: 'center',
            color: 'var(--ink-soft)',
            background: 'rgba(255,255,255,.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <InkDoodle kind="tomato" size={48} color="var(--ink-faint)" />
          </div>
          <div style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: 22, color: 'var(--ink)' }}>
            No grocery lists yet.
          </div>
          <p style={{ margin: '8px auto 0', maxWidth: 380, fontSize: 14, lineHeight: 1.5 }}>
            Create one to get started.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {(lists as GroceryList[]).map((list) => (
            <div
              key={list.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Link
                href={`/grocery-lists/${list.id}`}
                style={{
                  flex: 1,
                  textDecoration: 'none',
                  display: 'block',
                  padding: '14px 18px',
                  borderRadius: 10,
                  background: 'rgba(255,255,255,.55)',
                  border: '1px solid var(--rule)',
                  boxShadow: 'var(--shadow-soft)',
                  transition: 'transform .15s, box-shadow .15s',
                }}
                className="lift"
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <InkDoodle kind="tomato" size={22} color="var(--accent-ink)" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-serif, Georgia, serif)',
                        fontWeight: 500,
                        fontSize: 18,
                        color: 'var(--ink)',
                        lineHeight: 1.2,
                      }}
                    >
                      {list.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--ink-faint)',
                        letterSpacing: '.06em',
                        marginTop: 3,
                      }}
                    >
                      {new Date(list.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Link>
              <DeleteGroceryListButton id={list.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
