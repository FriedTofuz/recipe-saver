'use client'

import type { GroceryAisle, GroceryItem } from '@/types'

interface PrintListProps {
  aisles: GroceryAisle[]
  items: GroceryItem[]
  uncategorized: GroceryItem[]
}

/**
 * Hidden block, only shown via print stylesheet. Strips backgrounds, decorative
 * elements, and checked items — leaves a clean black-on-white shopping list
 * grouped by aisle.
 */
export function PrintList({ aisles, items, uncategorized }: PrintListProps) {
  const today = new Date()
  const dateStr = today.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const itemsByAisle = new Map<string, GroceryItem[]>()
  for (const item of items) {
    if (item.checked) continue
    const key = item.aisle_id ?? '__uncategorized'
    if (!itemsByAisle.has(key)) itemsByAisle.set(key, [])
    itemsByAisle.get(key)!.push(item)
  }
  Array.from(itemsByAisle.values()).forEach((list: GroceryItem[]) =>
    list.sort((a, b) => a.sort_order - b.sort_order)
  )

  const orderedAisles = aisles
    .map((a) => ({ a, list: itemsByAisle.get(a.id) ?? [] }))
    .filter((g) => g.list.length > 0)

  const uncatList = (itemsByAisle.get('__uncategorized') ?? []).filter(
    (i) => !i.checked
  )

  const totalItems =
    orderedAisles.reduce((acc, g) => acc + g.list.length, 0) + uncatList.length

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
          {dateStr} · {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </div>
      </div>

      {totalItems === 0 && (
        <p style={{ fontStyle: 'italic', fontSize: 14 }}>Nothing left to buy.</p>
      )}

      <div
        style={{
          columnCount: totalItems > 16 ? 2 : 1,
          columnGap: '0.5in',
        }}
      >
        {orderedAisles.map(({ a, list }) => (
          <PrintAisle key={a.id} name={a.name} items={list} />
        ))}
        {uncatList.length > 0 && (
          <PrintAisle name="Uncategorized" items={uncatList} />
        )}
      </div>
    </div>
  )
}

function PrintAisle({ name, items }: { name: string; items: GroceryItem[] }) {
  return (
    <section
      style={{
        marginBottom: 14,
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
      }}
    >
      <h2
        style={{
          fontSize: 14,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          margin: '0 0 4px',
          borderBottom: '1px solid #000',
          paddingBottom: 2,
          fontWeight: 600,
        }}
      >
        {name}
      </h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((it) => (
          <li
            key={it.id}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
              fontSize: 13,
              padding: '3px 0',
              fontFamily: 'Helvetica, Arial, sans-serif',
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
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
