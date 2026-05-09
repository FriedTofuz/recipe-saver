'use client'

import { useState } from 'react'
import { toggleGroceryItem } from '@/actions/grocery'
import type { GroceryItem as GroceryItemType, AisleCategory } from '@/types'

const AISLE_ORDER: AisleCategory[] = [
  'produce',
  'meat',
  'seafood',
  'dairy',
  'frozen',
  'bakery',
  'pantry',
  'spices',
  'beverages',
  'other',
]

const AISLE_LABELS: Record<AisleCategory, string> = {
  produce: 'Produce',
  meat: 'Meat',
  seafood: 'Seafood',
  dairy: 'Dairy',
  frozen: 'Frozen',
  bakery: 'Bakery',
  pantry: 'Pantry',
  spices: 'Spices & Herbs',
  beverages: 'Beverages',
  other: 'Other',
}

interface AisleViewProps {
  items: GroceryItemType[]
}

export function AisleView({ items }: AisleViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [optimisticChecks, setOptimisticChecks] = useState<Record<string, boolean>>({})

  function toggle(item: GroceryItemType) {
    const next = !(optimisticChecks[item.id] ?? item.checked)
    setOptimisticChecks((prev) => ({ ...prev, [item.id]: next }))
    void toggleGroceryItem(item.id, next)
  }

  function toggleAisle(a: string) {
    setCollapsed((prev) => {
      const n = new Set(prev)
      n.has(a) ? n.delete(a) : n.add(a)
      return n
    })
  }

  const grouped = AISLE_ORDER.reduce<Record<string, GroceryItemType[]>>((acc, aisle) => {
    const aisleItems = items.filter((i) => i.aisle === aisle)
    if (aisleItems.length > 0) acc[aisle] = aisleItems
    return acc
  }, {})

  if (items.length === 0) {
    return (
      <p style={{ color: 'var(--ink-faint)', fontSize: 13 }}>
        No items in this list.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {Object.entries(grouped).map(([aisle, aisleItems]) => {
        const isOpen = !collapsed.has(aisle)
        const checkedItems = aisleItems.filter(
          (it) => optimisticChecks[it.id] ?? it.checked
        )
        return (
          <section
            key={aisle}
            style={{
              background: 'rgba(255,255,255,.5)',
              border: '1px solid var(--rule)',
              borderRadius: 10,
              padding: '18px 22px 14px',
              position: 'relative',
              boxShadow: 'var(--shadow-soft)',
            }}
          >
            <div
              onClick={() => toggleAisle(aisle)}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 14,
                cursor: 'pointer',
                marginBottom: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-faint)',
                  }}
                >
                  aisle
                </span>
                <h2
                  style={{
                    fontFamily: 'var(--font-serif, Georgia, serif)',
                    fontWeight: 500,
                    fontSize: 24,
                    margin: 0,
                    lineHeight: 1,
                    color: 'var(--ink)',
                  }}
                >
                  {AISLE_LABELS[aisle as AisleCategory] ?? aisle}
                </h2>
                {checkedItems.length === aisleItems.length && (
                  <span
                    style={{
                      fontFamily: 'var(--font-serif, Georgia, serif)',
                      fontStyle: 'italic',
                      color: 'var(--accent-ink)',
                      fontSize: 14,
                    }}
                  >
                    got it ✓
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-faint)' }}>
                  {checkedItems.length}/{aisleItems.length}
                </span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    color: 'var(--ink-soft)',
                    transform: isOpen ? 'none' : 'rotate(-90deg)',
                    transition: 'transform .2s',
                  }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            </div>

            {isOpen && (
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                  gap: 6,
                }}
              >
                {aisleItems.map((it) => {
                  const off = optimisticChecks[it.id] ?? it.checked
                  return (
                    <li
                      key={it.id}
                      onClick={() => toggle(it)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '7px 8px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        opacity: off ? 0.5 : 1,
                        transition: 'opacity .2s',
                      }}
                    >
                      <span className={`paper-check ${off ? 'is-on' : ''}`}>
                        {off && (
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--paper)"
                            strokeWidth="3"
                            strokeLinecap="round"
                          >
                            <path d="M5 12l5 5L20 7" />
                          </svg>
                        )}
                      </span>
                      <div className={off ? 'hand-strike' : ''} style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontFamily: 'var(--font-sans)',
                            color: 'var(--ink)',
                            lineHeight: 1.2,
                          }}
                        >
                          {(it.quantity || it.unit) && (
                            <strong style={{ color: 'var(--accent-ink)', marginRight: 4 }}>
                              {it.quantity} {it.unit}
                            </strong>
                          )}
                          {it.name}
                        </div>
                        {it.source_recipe && (
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--ink-faint)',
                              fontFamily: 'var(--font-serif, Georgia, serif)',
                              fontStyle: 'italic',
                              marginTop: 1,
                            }}
                          >
                            for {it.source_recipe}
                          </div>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
