'use client'

import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { WavyRule } from '@/components/paper'
import { ConfirmDialog } from '@/components/paper/ConfirmDialog'
import { ItemRow } from './ItemRow'
import { AddItemForm } from './AddItemForm'
import { SuggestionsPanel } from './SuggestionsPanel'
import { PrintList } from './PrintList'
import {
  addItem,
  clearAllItems,
  clearCheckedItems,
  reorderItems,
  updateItem,
} from '@/actions/grocery'
import type { GroceryItem, GrocerySuggestion } from '@/types'

interface GroceryPageProps {
  initialItems: GroceryItem[]
}

export function GroceryPage({ initialItems }: GroceryPageProps) {
  const [items, setItems] = useState<GroceryItem[]>(initialItems)
  const [hideChecked, setHideChecked] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)

  const totalCount = items.length
  const checkedCount = items.filter((i) => i.checked).length

  // Render order: unchecked first (by sort_order), then checked at the bottom (by sort_order).
  const renderOrder = useMemo(() => {
    const unchecked = items.filter((i) => !i.checked).sort((a, b) => a.sort_order - b.sort_order)
    const checked = items.filter((i) => i.checked).sort((a, b) => a.sort_order - b.sort_order)
    return [...unchecked, ...checked]
  }, [items])

  const visibleItems = hideChecked ? renderOrder.filter((i) => !i.checked) : renderOrder

  const updateLocalItem = useCallback(
    (id: string, patch: Partial<GroceryItem>) => {
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    },
    []
  )

  const removeLocalItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const replaceLocalItem = useCallback((next: GroceryItem) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === next.id)
      if (idx === -1) return [...prev, next]
      const out = [...prev]
      out[idx] = next
      return out
    })
  }, [])

  const handleAddManual = async (input: {
    name: string
    quantity: string | null
    unit: string | null
  }) => {
    if (!input.name.trim()) return
    try {
      const { item } = await addItem({
        name: input.name,
        quantity: input.quantity,
        unit: input.unit,
        // Manual adds: never merge — let user create explicit duplicates if they want
        mergeOnDuplicate: false,
      })
      setItems((prev) => [...prev, item])
    } catch {
      toast.error('Could not add item')
    }
  }

  const handleAddSuggestion = async (suggestion: GrocerySuggestion) => {
    try {
      const { item, merged } = await addItem({
        name: suggestion.name,
        quantity: suggestion.quantity,
        unit: suggestion.unit,
        source_recipe: suggestion.recipe_title,
        mergeOnDuplicate: true,
      })
      if (merged) {
        replaceLocalItem(item)
      } else {
        setItems((prev) => [...prev, item])
      }
    } catch {
      toast.error('Could not add item')
    }
  }

  const handleClearChecked = async () => {
    const removed = checkedCount
    setItems((prev) => prev.filter((i) => !i.checked))
    try {
      await clearCheckedItems()
      toast.success(`Cleared ${removed} checked ${removed === 1 ? 'item' : 'items'}`)
    } catch {
      toast.error('Could not clear items')
    }
  }

  const handleClearAll = async () => {
    setItems([])
    setConfirmClear(false)
    try {
      await clearAllItems()
      toast.success('List cleared')
    } catch {
      toast.error('Could not clear list')
    }
  }

  const handlePrint = () => window.print()

  const onDragOverItem = (id: string, e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault()
    if (!draggingId || draggingId === id) return
    setHoverId(id)
  }

  const onDropOnItem = async (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      setHoverId(null)
      return
    }
    // Reorder draggingId to targetId's position within unchecked items.
    const unchecked = items.filter((i) => !i.checked)
    const checked = items.filter((i) => i.checked)
    const orderedUnchecked = [...unchecked].sort((a, b) => a.sort_order - b.sort_order)
    const fromIdx = orderedUnchecked.findIndex((i) => i.id === draggingId)
    const toIdx = orderedUnchecked.findIndex((i) => i.id === targetId)
    if (fromIdx === -1 || toIdx === -1) {
      setHoverId(null)
      return
    }
    const [moved] = orderedUnchecked.splice(fromIdx, 1)
    orderedUnchecked.splice(toIdx, 0, moved)
    // Re-assign sort_order across unchecked items
    const renumbered = orderedUnchecked.map((it, idx) => ({ ...it, sort_order: idx }))
    setItems([...renumbered, ...checked])
    setDraggingId(null)
    setHoverId(null)
    try {
      await reorderItems(renumbered.map((i) => i.id))
    } catch {
      toast.error('Could not save order')
    }
  }

  const existingItemNames = useMemo(() => items.map((i) => i.name), [items])

  return (
    <div className="grocery-screen" style={{ maxWidth: 1280, position: 'relative' }}>
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
            Saturday market
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
              maxWidth: 540,
              fontSize: 15,
              lineHeight: 1.5,
            }}
          >
            Your perpetual list. Suggestions on the right pull from your meal
            plan — tap <em>Add</em> to drop them in.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setHideChecked((v) => !v)} style={ghostBtn}>
            {hideChecked ? 'Show checked' : 'Hide checked'}
          </button>
          {checkedCount > 0 && (
            <button onClick={handleClearChecked} style={ghostBtn}>
              Clear {checkedCount} checked
            </button>
          )}
          <button onClick={handlePrint} style={ghostBtn}>
            Print
          </button>
          {totalCount > 0 && (
            <button onClick={() => setConfirmClear(true)} style={dangerBtn}>
              Clear list
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
        className="grocery-grid"
      >
        {/* Flat list */}
        <section
          style={{
            background: 'rgba(255,255,255,.5)',
            border: '1px solid var(--rule)',
            borderRadius: 10,
            padding: '18px 22px 16px',
            position: 'relative',
            boxShadow: 'var(--shadow-soft)',
          }}
        >
          <AddItemForm onAdd={handleAddManual} />

          <div
            style={{
              fontSize: 11,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              margin: '14px 0 6px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <span>List</span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, letterSpacing: 0, textTransform: 'none' }}>
              {checkedCount}/{totalCount}
            </span>
          </div>

          {visibleItems.length === 0 ? (
            <div
              style={{
                padding: '40px 12px',
                textAlign: 'center',
                color: 'var(--ink-faint)',
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontStyle: 'italic',
                fontSize: 15,
              }}
            >
              {totalCount === 0
                ? 'Empty list — add items above or from suggestions.'
                : 'Everything checked off.'}
            </div>
          ) : (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {visibleItems.map((it) => (
                <ItemRow
                  key={it.id}
                  item={it}
                  isHover={hoverId === it.id}
                  onUpdate={updateLocalItem}
                  onRemove={removeLocalItem}
                  onDragStart={() => setDraggingId(it.id)}
                  onDragEnd={() => {
                    setDraggingId(null)
                    setHoverId(null)
                  }}
                  onDragOver={(e) => onDragOverItem(it.id, e)}
                  onDrop={() => onDropOnItem(it.id)}
                />
              ))}
            </ul>
          )}
        </section>

        <SuggestionsPanel
          existingItemNames={existingItemNames}
          onAdd={handleAddSuggestion}
        />
      </div>

      <ConfirmDialog
        open={confirmClear}
        title="Clear the whole list?"
        message="This removes every item, checked or not."
        confirmLabel="Clear list"
        destructive
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClear(false)}
      />

      <PrintList items={items} />
    </div>
  )
}

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 14px',
  borderRadius: 999,
  border: '1px solid var(--rule)',
  background: 'rgba(255,255,255,.55)',
  color: 'var(--ink)',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
}

const dangerBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 14px',
  borderRadius: 999,
  border: '1px solid #7d3f2f',
  background: 'transparent',
  color: '#7d3f2f',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
}
