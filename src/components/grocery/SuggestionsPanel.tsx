'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { GroceryAisle, GrocerySuggestion } from '@/types'
import type { DragPayload } from './GroceryPage'
import { dedupeSuggestions } from '@/lib/grocery-suggestions'

interface SuggestionsPanelProps {
  aisles: GroceryAisle[]
  drag: DragPayload
  setDrag: (d: DragPayload) => void
  existingItemNames: string[]
  onAddToAisle: (
    suggestion: GrocerySuggestion,
    aisleId: string | null
  ) => void | Promise<void>
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function defaultStart(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return toIsoDate(d)
}

function defaultEnd(): string {
  const d = new Date()
  d.setDate(d.getDate() + 6)
  d.setHours(0, 0, 0, 0)
  return toIsoDate(d)
}

function shortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${DAY_LABELS[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`
}

export function SuggestionsPanel({
  aisles,
  drag,
  setDrag,
  existingItemNames,
  onAddToAisle,
}: SuggestionsPanelProps) {
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState(defaultEnd)
  const [rawSuggestions, setRawSuggestions] = useState<GrocerySuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [collapsedRecipes, setCollapsedRecipes] = useState<Set<string>>(new Set())

  const fetchSuggestions = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/grocery/suggestions?start=${start}&end=${end}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to load')
      setRawSuggestions(data.suggestions ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [start, end])

  useEffect(() => {
    void fetchSuggestions()
  }, [fetchSuggestions])

  // Re-dedupe locally as the user adds items so suggestions disappear immediately.
  const suggestions = useMemo(
    () => dedupeSuggestions(rawSuggestions, existingItemNames.map((n) => ({ name: n }))),
    [rawSuggestions, existingItemNames]
  )

  const groupedByRecipe = useMemo(() => {
    const map = new Map<
      string,
      { recipe_id: string; recipe_title: string; dates: string[]; items: GrocerySuggestion[] }
    >()
    for (const s of suggestions) {
      const existing = map.get(s.recipe_id)
      if (existing) {
        existing.items.push(s)
      } else {
        map.set(s.recipe_id, {
          recipe_id: s.recipe_id,
          recipe_title: s.recipe_title,
          dates: s.scheduled_dates,
          items: [s],
        })
      }
    }
    return Array.from(map.values())
  }, [suggestions])

  const toggleRecipe = (id: string) => {
    setCollapsedRecipes((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const handleAddAll = async (group: typeof groupedByRecipe[number]) => {
    for (const s of group.items) {
      // Default to "Other" aisle (last in default seed) — find any aisle named "Other"
      // or fall back to the first aisle, or null.
      const target =
        aisles.find((a) => a.name.toLowerCase() === 'other') ??
        aisles[aisles.length - 1] ??
        null
      // eslint-disable-next-line no-await-in-loop
      await onAddToAisle(s, target?.id ?? null)
    }
    toast.success(`Added ${group.items.length} from "${group.recipe_title}"`)
  }

  const handleAddOne = async (s: GrocerySuggestion) => {
    const target =
      aisles.find((a) => a.name.toLowerCase() === 'other') ??
      aisles[aisles.length - 1] ??
      null
    await onAddToAisle(s, target?.id ?? null)
  }

  return (
    <aside style={{ position: 'sticky', top: 20 }} className="grocery-suggestions">
      <div
        style={{
          background: '#fbf6e9',
          border: '1px solid var(--rule)',
          borderRadius: 8,
          padding: '20px 22px 16px',
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
            From your meal plan
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
            Don&apos;t forget these
          </div>
        </div>

        {/* Date range */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 12,
          }}
        >
          <label style={dateLabel}>
            <span style={dateLabelText}>From</span>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              style={dateInput}
            />
          </label>
          <label style={dateLabel}>
            <span style={dateLabelText}>To</span>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              style={dateInput}
            />
          </label>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
            {loading ? 'Loading…' : `${suggestions.length} ${suggestions.length === 1 ? 'item' : 'items'}`}
          </div>
          <button
            onClick={fetchSuggestions}
            disabled={loading}
            style={refreshBtn}
            title="Re-pull from meal plan"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Refresh
          </button>
        </div>

        {error && (
          <div style={{ fontSize: 12, color: '#7d3f2f', padding: '6px 0' }}>{error}</div>
        )}

        {!loading && suggestions.length === 0 && !error && (
          <div
            style={{
              padding: '20px 8px',
              textAlign: 'center',
              color: 'var(--ink-faint)',
              fontSize: 13,
              fontStyle: 'italic',
              fontFamily: 'var(--font-serif, Georgia, serif)',
            }}
          >
            No new ingredients in this range — your list is set.
          </div>
        )}

        <div
          className="scroll-y"
          style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 520, overflowY: 'auto' }}
        >
          {groupedByRecipe.map((g) => {
            const collapsed = collapsedRecipes.has(g.recipe_id)
            return (
              <div key={g.recipe_id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleRecipe(g.recipe_id)}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-serif, Georgia, serif)',
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--ink)',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {g.recipe_title}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: 'var(--ink-faint)',
                        fontFamily: 'var(--font-sans)',
                        marginTop: 1,
                      }}
                    >
                      {g.dates.map(shortDate).join(' · ')}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleAddAll(g)
                    }}
                    style={tinyBtn}
                    title="Add all to list"
                  >
                    Add all
                  </button>
                </div>
                {!collapsed && (
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '6px 0 0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    {g.items.map((s) => (
                      <li
                        key={s.key}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'copy'
                          setDrag({ type: 'suggestion', suggestion: s })
                        }}
                        onDragEnd={() => setDrag(null)}
                        onDoubleClick={() => void handleAddOne(s)}
                        title="Drag to an aisle, or double-click to add"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '4px 6px',
                          borderRadius: 5,
                          cursor: 'grab',
                          fontSize: 13,
                          fontFamily: 'var(--font-sans)',
                          color: 'var(--ink)',
                          background:
                            drag?.type === 'suggestion' && drag.suggestion.key === s.key
                              ? 'rgba(182,86,42,.12)'
                              : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!(drag?.type === 'suggestion' && drag.suggestion.key === s.key)) {
                            e.currentTarget.style.background = 'rgba(255,255,255,.55)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!(drag?.type === 'suggestion' && drag.suggestion.key === s.key)) {
                            e.currentTarget.style.background = 'transparent'
                          }
                        }}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          style={{ color: 'var(--ink-faint)', flexShrink: 0 }}
                        >
                          <circle cx="9" cy="6" r="1.4" />
                          <circle cx="15" cy="6" r="1.4" />
                          <circle cx="9" cy="12" r="1.4" />
                          <circle cx="15" cy="12" r="1.4" />
                          <circle cx="9" cy="18" r="1.4" />
                          <circle cx="15" cy="18" r="1.4" />
                        </svg>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          {(s.quantity || s.unit) && (
                            <strong style={{ color: 'var(--accent-ink)', marginRight: 4 }}>
                              {[s.quantity, s.unit].filter(Boolean).join(' ')}
                            </strong>
                          )}
                          {s.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>

        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1.5px dashed var(--rule)',
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'var(--ink-faint)',
            textAlign: 'center',
          }}
        >
          drag onto an aisle, or double-click to drop into Other
        </div>
      </div>
    </aside>
  )
}

const dateLabel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}
const dateLabelText: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '.18em',
  textTransform: 'uppercase',
  color: 'var(--ink-faint)',
  fontFamily: 'var(--font-sans)',
}
const dateInput: React.CSSProperties = {
  all: 'unset',
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '6px 8px',
  border: '1px solid var(--rule)',
  borderRadius: 6,
  fontSize: 12,
  fontFamily: 'var(--font-sans)',
  background: 'rgba(255,255,255,.7)',
  color: 'var(--ink)',
  cursor: 'pointer',
}

const refreshBtn: React.CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  fontSize: 11,
  color: 'var(--ink-soft)',
  fontFamily: 'var(--font-sans)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '3px 8px',
  border: '1px solid var(--rule)',
  borderRadius: 999,
  background: 'rgba(255,255,255,.55)',
}

const tinyBtn: React.CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  fontSize: 11,
  color: 'var(--accent-ink)',
  fontFamily: 'var(--font-sans)',
  fontWeight: 500,
  padding: '2px 8px',
  border: '1px solid var(--accent-ink)',
  borderRadius: 999,
  flexShrink: 0,
}
