'use client'

import type { GroceryItem } from '@/types'

interface PrintListProps {
  items: GroceryItem[]
}

/**
 * Hidden block, only shown via print stylesheet. Strips backgrounds, decorative
 * elements, and checked items — leaves a clean black-on-white shopping list.
 */
export function PrintList({ items }: PrintListProps) {
  const today = new Date()
  const dateStr = today.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const unchecked = items
    .filter((i) => !i.checked)
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="print-only">
      <div
        style={{
          borderBottom: '2px solid #000',
          paddingBottom: 8,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <h1 style={{ fontSize: 28, margin: 0, fontWeight: 600 }}>Grocery list</h1>
        <div style={{ fontSize: 12, fontFamily: 'Helvetica, Arial, sans-serif' }}>
          {dateStr} · {unchecked.length} {unchecked.length === 1 ? 'item' : 'items'}
        </div>
      </div>

      {unchecked.length === 0 ? (
        <p style={{ fontStyle: 'italic', fontSize: 14 }}>Nothing left to buy.</p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            columnCount: unchecked.length > 16 ? 2 : 1,
            columnGap: '0.5in',
          }}
        >
          {unchecked.map((it) => (
            <li
              key={it.id}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                fontSize: 13,
                padding: '4px 0',
                fontFamily: 'Helvetica, Arial, sans-serif',
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
              }}
            >
              <span
                aria-hidden
                style={{
                  display: 'inline-block',
                  width: 11,
                  height: 11,
                  border: '1px solid #000',
                  flexShrink: 0,
                  transform: 'translateY(2px)',
                }}
              />
              <span style={{ flex: 1 }}>
                {(it.quantity || it.unit) && (
                  <strong style={{ fontWeight: 600, marginRight: 4 }}>
                    {[it.quantity, it.unit].filter(Boolean).join(' ')}
                  </strong>
                )}
                {it.name}
                {it.source_recipe && (
                  <em style={{ fontStyle: 'italic', color: '#000', marginLeft: 6, fontSize: 12 }}>
                    — for {it.source_recipe}
                  </em>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
