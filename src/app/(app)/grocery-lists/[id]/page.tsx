'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { AisleView } from '@/components/grocery/AisleView'
import { RecipeView } from '@/components/grocery/RecipeView'
import { WavyRule } from '@/components/paper'
import { clearCheckedItems } from '@/actions/grocery'
import { toast } from 'sonner'
import type { GroceryList, GroceryItem, AisleCategory } from '@/types'

const AISLE_LABELS: Record<AisleCategory, string> = {
  produce: 'produce',
  meat: 'meat',
  seafood: 'seafood',
  dairy: 'dairy',
  frozen: 'frozen',
  bakery: 'bakery',
  pantry: 'pantry',
  spices: 'spices',
  beverages: 'beverages',
  other: 'other',
}

export default function GroceryListPage() {
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  const [view, setView] = useState<'aisle' | 'recipe'>('aisle')

  const { data: list, mutate } = useSWR(`grocery-list-${id}`, async () => {
    const { data } = await supabase
      .from('grocery_lists')
      .select('*, items:grocery_items(*)')
      .eq('id', id)
      .order('sort_order', { foreignTable: 'grocery_items' })
      .single()
    return data as GroceryList
  })

  async function handleClearChecked() {
    try {
      await clearCheckedItems(id)
      mutate()
      toast.success('Checked items cleared')
    } catch {
      toast.error('Failed to clear items')
    }
  }

  const items = useMemo(() => list?.items ?? [], [list])
  const totalCount = items.length
  const checkedCount = items.filter((i) => i.checked).length

  const recipeBuckets = useMemo(() => {
    const map = new Map<string, GroceryItem[]>()
    for (const it of items) {
      const key = it.source_recipe ?? 'Other'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(it)
    }
    return map
  }, [items])

  const aisleBuckets = useMemo(() => {
    const map = new Map<string, GroceryItem[]>()
    for (const it of items) {
      if (!map.has(it.aisle)) map.set(it.aisle, [])
      map.get(it.aisle)!.push(it)
    }
    return map
  }, [items])

  if (!list) return null

  return (
    <div style={{ maxWidth: 1100, position: 'relative' }}>
      {/* Back link */}
      <Link
        href="/grocery-lists"
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
        All grocery lists
      </Link>

      {/* Header */}
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
            Market list
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
            <em style={{ fontStyle: 'italic' }}>{list.name}</em>
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
            Tap to cross off as you load the basket.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              border: '1px solid var(--rule)',
              borderRadius: 999,
              padding: 2,
              background: 'rgba(255,255,255,.5)',
            }}
          >
            {(['aisle', 'recipe'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setView(k)}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: 11,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-sans)',
                  background: view === k ? 'var(--ink)' : 'transparent',
                  color: view === k ? 'var(--paper)' : 'var(--ink-soft)',
                }}
              >
                By {k}
              </button>
            ))}
          </div>
          {checkedCount > 0 && (
            <button
              onClick={handleClearChecked}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 999,
                border: '1px solid var(--ink)',
                background: 'transparent',
                color: 'var(--ink)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Clear {checkedCount} checked
            </button>
          )}
        </div>
      </header>

      <WavyRule style={{ margin: '18px 0 26px' }} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 1fr)',
          gap: 36,
          alignItems: 'start',
        }}
      >
        <div>{view === 'aisle' ? <AisleView items={items} /> : <RecipeView items={items} />}</div>

        {/* Receipt-style summary */}
        <aside style={{ position: 'sticky', top: 20 }}>
          <div
            style={{
              background: '#fbf6e9',
              border: '1px solid var(--rule)',
              borderRadius: 8,
              padding: '22px 24px 18px',
              position: 'relative',
              boxShadow: 'var(--shadow-card)',
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent 0 22px, rgba(60,40,20,.05) 22px 23px)',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                borderBottom: '1.5px dashed var(--rule)',
                paddingBottom: 10,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  letterSpacing: '.18em',
                  color: 'var(--ink-faint)',
                  textTransform: 'uppercase',
                }}
              >
                Marginalia · Market List
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontStyle: 'italic',
                  fontSize: 22,
                  marginTop: 4,
                  color: 'var(--ink)',
                }}
              >
                {list.name}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 11,
                  color: 'var(--ink-faint)',
                  marginTop: 4,
                }}
              >
                {new Date(list.created_at).toLocaleDateString()}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontFamily: 'var(--font-sans)',
                fontSize: 12,
                color: 'var(--ink-soft)',
              }}
            >
              {Array.from(aisleBuckets.entries()).map(([aisle, aisleItems]) => {
                const got = aisleItems.filter((it) => it.checked).length
                return (
                  <div
                    key={aisle}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: 10,
                      alignItems: 'baseline',
                    }}
                  >
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {AISLE_LABELS[aisle as AisleCategory] ?? aisle}
                    </span>
                    <span
                      style={{
                        color: got === aisleItems.length ? 'var(--accent-ink)' : 'var(--ink-soft)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {got} / {aisleItems.length}
                    </span>
                  </div>
                )
              })}
            </div>

            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1.5px dashed var(--rule)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-faint)',
                }}
              >
                Total items
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontSize: 30,
                  fontWeight: 500,
                  color: 'var(--ink)',
                }}
              >
                {checkedCount}
                <span style={{ color: 'var(--ink-faint)', fontSize: 18 }}>
                  /{totalCount}
                </span>
              </span>
            </div>
            <div
              style={{
                textAlign: 'center',
                marginTop: 14,
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontStyle: 'italic',
                color: 'var(--accent-ink)',
                fontSize: 16,
              }}
            >
              thank you, come again
            </div>
          </div>

          {recipeBuckets.size > 0 && (
            <div
              style={{
                marginTop: 14,
                padding: 14,
                border: '1px dashed var(--rule)',
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  letterSpacing: '.18em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-faint)',
                  marginBottom: 8,
                }}
              >
                Pulled from
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Array.from(recipeBuckets.keys()).map((name) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'var(--accent-ink)',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--ink)' }}>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
