'use client'

import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { WavyRule } from '@/components/paper'
import { ConfirmDialog } from '@/components/paper/ConfirmDialog'
import { AisleCard } from './AisleCard'
import { SuggestionsPanel } from './SuggestionsPanel'
import { PrintList } from './PrintList'
import {
  addAisle,
  addItem,
  clearAllItems,
  clearCheckedItems,
  reorderAisles,
  updateItem,
} from '@/actions/grocery'
import type { GroceryAisle, GroceryItem, GrocerySuggestion } from '@/types'

export type DragPayload =
  | { type: 'suggestion'; suggestion: GrocerySuggestion }
  | { type: 'item'; item: GroceryItem }
  | { type: 'aisle'; aisleId: string }
  | null

interface GroceryPageProps {
  initialAisles: GroceryAisle[]
  initialItems: GroceryItem[]
}

export function GroceryPage({ initialAisles, initialItems }: GroceryPageProps) {
  const [aisles, setAisles] = useState<GroceryAisle[]>(initialAisles)
  const [items, setItems] = useState<GroceryItem[]>(initialItems)
  const [drag, setDrag] = useState<DragPayload>(null)
  const [hoverAisleId, setHoverAisleId] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [addAisleOpen, setAddAisleOpen] = useState(false)
  const [newAisleName, setNewAisleName] = useState('')
  const [hideChecked, setHideChecked] = useState(false)

  const totalCount = items.length
  const checkedCount = items.filter((i) => i.checked).length

  const itemsByAisle = useMemo(() => {
    const map = new Map<string | null, GroceryItem[]>()
    for (const it of items) {
      const k = it.aisle_id
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(it)
    }
    Array.from(map.values()).forEach((list: GroceryItem[]) =>
      list.sort((a, b) => a.sort_order - b.sort_order)
    )
    return map
  }, [items])

  const uncategorized = itemsByAisle.get(null) ?? []

  const handleAddAisle = async () => {
    const name = newAisleName.trim()
    if (!name) return
    try {
      const created = await addAisle(name)
      setAisles((prev) => [...prev, created])
      setNewAisleName('')
      setAddAisleOpen(false)
    } catch {
      toast.error('Could not add aisle')
    }
  }

  const handleAddItem = useCallback(
    async (aisleId: string | null, name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      try {
        const created = await addItem({ aisle_id: aisleId, name: trimmed })
        setItems((prev) => [...prev, created])
      } catch {
        toast.error('Could not add item')
      }
    },
    []
  )

  const handleAddSuggestion = useCallback(
    async (suggestion: GrocerySuggestion, aisleId: string | null) => {
      try {
        const created = await addItem({
          aisle_id: aisleId,
          name: suggestion.name,
          quantity: suggestion.quantity,
          unit: suggestion.unit,
          source_recipe: suggestion.recipe_title,
        })
        setItems((prev) => [...prev, created])
      } catch {
        toast.error('Could not add suggestion')
      }
    },
    []
  )

  const handleDropOnAisle = async (aisleId: string | null) => {
    if (!drag) return
    if (drag.type === 'suggestion') {
      await handleAddSuggestion(drag.suggestion, aisleId)
    } else if (drag.type === 'item') {
      // Move item to this aisle
      const it = drag.item
      if (it.aisle_id === aisleId) return
      setItems((prev) =>
        prev.map((p) => (p.id === it.id ? { ...p, aisle_id: aisleId } : p))
      )
      try {
        await updateItem(it.id, { aisle_id: aisleId })
      } catch {
        toast.error('Could not move item')
      }
    }
    setDrag(null)
    setHoverAisleId(null)
  }

  const handleAisleDrop = async (targetAisleId: string) => {
    if (!drag || drag.type !== 'aisle') return
    if (drag.aisleId === targetAisleId) return
    const next = [...aisles]
    const fromIdx = next.findIndex((a) => a.id === drag.aisleId)
    const toIdx = next.findIndex((a) => a.id === targetAisleId)
    if (fromIdx === -1 || toIdx === -1) return
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    setAisles(next)
    try {
      await reorderAisles(next.map((a) => a.id))
    } catch {
      toast.error('Could not reorder aisles')
    }
    setDrag(null)
  }

  const handleClearChecked = async () => {
    setItems((prev) => prev.filter((i) => !i.checked))
    try {
      await clearCheckedItems()
      toast.success(`Cleared ${checkedCount} checked ${checkedCount === 1 ? 'item' : 'items'}`)
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

  const handlePrint = () => {
    window.print()
  }

  const updateLocalItem = useCallback(
    (id: string, patch: Partial<GroceryItem>) => {
      setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    },
    []
  )

  const removeLocalItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const updateLocalAisle = useCallback(
    (id: string, patch: Partial<GroceryAisle>) => {
      setAisles((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    },
    []
  )

  const removeLocalAisle = useCallback((id: string) => {
    setAisles((prev) => prev.filter((p) => p.id !== id))
    // Items in that aisle become uncategorized (matches DB behavior).
    setItems((prev) =>
      prev.map((p) => (p.aisle_id === id ? { ...p, aisle_id: null } : p))
    )
  }, [])

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
            plan — drag them onto an aisle to add.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setAddAisleOpen(true)} style={ghostBtn} title="Add a new aisle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New aisle
          </button>
          <button
            onClick={() => setHideChecked((v) => !v)}
            style={ghostBtn}
            title="Toggle checked-item visibility"
          >
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
        {/* Aisle list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {aisles.length === 0 && uncategorized.length === 0 && (
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
              <div
                style={{
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontSize: 22,
                  color: 'var(--ink)',
                }}
              >
                No aisles yet.
              </div>
              <p style={{ margin: '8px auto 0', maxWidth: 380, fontSize: 14, lineHeight: 1.5 }}>
                Add an aisle to start filling your list, or drag a suggestion in.
              </p>
            </div>
          )}

          {aisles.map((aisle) => {
            const aisleItems = itemsByAisle.get(aisle.id) ?? []
            return (
              <AisleCard
                key={aisle.id}
                aisle={aisle}
                items={aisleItems}
                hideChecked={hideChecked}
                isDropTarget={hoverAisleId === aisle.id && (drag?.type === 'suggestion' || drag?.type === 'item')}
                isAisleDragTarget={hoverAisleId === aisle.id && drag?.type === 'aisle' && drag.aisleId !== aisle.id}
                onDragOver={(type) => {
                  if (type === 'aisle' && drag?.type === 'aisle') {
                    setHoverAisleId(aisle.id)
                  } else if (drag?.type === 'suggestion' || drag?.type === 'item') {
                    setHoverAisleId(aisle.id)
                  }
                }}
                onDragLeave={() => setHoverAisleId(null)}
                onDrop={() => {
                  if (drag?.type === 'aisle') {
                    return handleAisleDrop(aisle.id)
                  }
                  return handleDropOnAisle(aisle.id)
                }}
                onAisleDragStart={() => setDrag({ type: 'aisle', aisleId: aisle.id })}
                onAisleDragEnd={() => {
                  setDrag(null)
                  setHoverAisleId(null)
                }}
                onItemDragStart={(item) => setDrag({ type: 'item', item })}
                onItemDragEnd={() => {
                  setDrag(null)
                  setHoverAisleId(null)
                }}
                onAddItem={(name) => handleAddItem(aisle.id, name)}
                onItemUpdate={updateLocalItem}
                onItemRemove={removeLocalItem}
                onAisleUpdate={updateLocalAisle}
                onAisleRemove={removeLocalAisle}
              />
            )
          })}

          {/* Uncategorized bucket — only show if it has items */}
          {uncategorized.length > 0 && (
            <AisleCard
              aisle={{
                id: '__uncategorized',
                user_id: '',
                name: 'Uncategorized',
                sort_order: 9999,
                created_at: '',
              }}
              items={uncategorized}
              hideChecked={hideChecked}
              uncategorized
              isDropTarget={hoverAisleId === '__uncategorized' && (drag?.type === 'suggestion' || drag?.type === 'item')}
              isAisleDragTarget={false}
              onDragOver={() => {
                if (drag?.type === 'suggestion' || drag?.type === 'item') {
                  setHoverAisleId('__uncategorized')
                }
              }}
              onDragLeave={() => setHoverAisleId(null)}
              onDrop={() => handleDropOnAisle(null)}
              onAisleDragStart={() => undefined}
              onAisleDragEnd={() => undefined}
              onItemDragStart={(item) => setDrag({ type: 'item', item })}
              onItemDragEnd={() => {
                setDrag(null)
                setHoverAisleId(null)
              }}
              onAddItem={(name) => handleAddItem(null, name)}
              onItemUpdate={updateLocalItem}
              onItemRemove={removeLocalItem}
              onAisleUpdate={() => undefined}
              onAisleRemove={() => undefined}
            />
          )}
        </div>

        <SuggestionsPanel
          aisles={aisles}
          drag={drag}
          setDrag={setDrag}
          existingItemNames={items.map((i) => i.name)}
          onAddToAisle={handleAddSuggestion}
        />
      </div>

      {/* Add-aisle dialog */}
      {addAisleOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            background: 'rgba(35,29,24,.45)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setAddAisleOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--rule)',
              borderRadius: 10,
              boxShadow: 'var(--shadow-card)',
              maxWidth: 420,
              width: '100%',
              padding: '24px 26px 22px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                color: 'var(--ink-faint)',
              }}
            >
              New aisle
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontWeight: 500,
                fontSize: 26,
                margin: '4px 0 14px',
                color: 'var(--ink)',
                lineHeight: 1.15,
              }}
            >
              Add a category
            </h2>
            <input
              autoFocus
              value={newAisleName}
              onChange={(e) => setNewAisleName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddAisle()
                if (e.key === 'Escape') setAddAisleOpen(false)
              }}
              placeholder="Bulk bins, frozen, snacks…"
              style={{
                all: 'unset',
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(255,255,255,.55)',
                border: '1px solid var(--rule)',
                fontSize: 14,
                color: 'var(--ink)',
                fontFamily: 'var(--font-sans)',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button onClick={() => setAddAisleOpen(false)} style={ghostBtn}>
                Cancel
              </button>
              <button onClick={handleAddAisle} disabled={!newAisleName.trim()} style={primaryBtn}>
                Add aisle
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Clear the whole list?"
        message="This removes every item, in every aisle. Aisle categories are kept."
        confirmLabel="Clear list"
        destructive
        onConfirm={handleClearAll}
        onCancel={() => setConfirmClear(false)}
      />

      <PrintList aisles={aisles} items={items} uncategorized={uncategorized} />
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

const primaryBtn: React.CSSProperties = {
  all: 'unset',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: 999,
  border: '1px solid var(--accent-ink)',
  background: 'var(--accent-ink)',
  color: 'var(--paper)',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
}
