'use client'

import { useMemo, useState } from 'react'
import { upsertMealPlanSlot } from '@/actions/meal-plan'
import { CoverWash, recipeHue, InkDoodle } from '@/components/paper'
import { toast } from 'sonner'
import type { Recipe, MealPlanSlot } from '@/types'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MEALS: Array<'breakfast' | 'lunch' | 'dinner'> = ['breakfast', 'lunch', 'dinner']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getISOMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0]
}

interface MealPlanCalendarProps {
  initialSlots: MealPlanSlot[]
  recipes: Recipe[]
}

export function MealPlanCalendar({ initialSlots, recipes }: MealPlanCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => getISOMonday(new Date()))
  const [slots, setSlots] = useState<MealPlanSlot[]>(initialSlots)
  const [dragId, setDragId] = useState<string | null>(null)
  const [hoverKey, setHoverKey] = useState<string | null>(null)
  const [drawerQuery, setDrawerQuery] = useState('')

  const weekStartStr = toDateStr(weekStart)

  const filteredRecipes = useMemo(() => {
    const q = drawerQuery.trim().toLowerCase()
    if (!q) return recipes
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.cuisine?.toLowerCase().includes(q) ?? false)
    )
  }, [drawerQuery, recipes])

  function getSlot(day: number, meal: string) {
    return slots.find(
      (s) => s.week_start === weekStartStr && s.day_of_week === day && s.meal_type === meal
    )
  }

  async function onDrop(day: number, meal: 'breakfast' | 'lunch' | 'dinner') {
    if (!dragId) return
    const recipe = recipes.find((r) => r.id === dragId)
    setSlots((prev) => {
      const filtered = prev.filter(
        (s) =>
          !(s.week_start === weekStartStr && s.day_of_week === day && s.meal_type === meal)
      )
      return [
        ...filtered,
        {
          id: `${weekStartStr}-${day}-${meal}`,
          user_id: '',
          week_start: weekStartStr,
          day_of_week: day,
          meal_type: meal,
          recipe_id: dragId,
          recipe,
        },
      ]
    })
    setDragId(null)
    setHoverKey(null)
    await upsertMealPlanSlot(weekStartStr, day, meal, dragId)
  }

  async function onClear(day: number, meal: 'breakfast' | 'lunch' | 'dinner') {
    setSlots((prev) =>
      prev.filter(
        (s) =>
          !(s.week_start === weekStartStr && s.day_of_week === day && s.meal_type === meal)
      )
    )
    await upsertMealPlanSlot(weekStartStr, day, meal, null)
  }

  function prevWeek() {
    setWeekStart((d) => {
      const nd = new Date(d)
      nd.setDate(nd.getDate() - 7)
      return nd
    })
  }

  function nextWeek() {
    setWeekStart((d) => {
      const nd = new Date(d)
      nd.setDate(nd.getDate() + 7)
      return nd
    })
  }

  async function generateGroceryList() {
    const weekSlots = slots.filter((s) => s.week_start === weekStartStr && s.recipe_id)
    if (weekSlots.length === 0) {
      toast.error('No recipes in this week')
      return
    }
    const recipeIds = Array.from(
      new Set(weekSlots.map((s) => s.recipe_id).filter((id): id is string => id !== null))
    )
    const params = new URLSearchParams()
    recipeIds.forEach((id) => id && params.append('recipe', id))
    window.location.href = `/grocery-lists/new?${params.toString()}`
  }

  const totalRecipes = slots.filter((s) => s.week_start === weekStartStr && s.recipe_id).length

  const weekLabel = (() => {
    const we = new Date(weekStart)
    we.setDate(we.getDate() + 6)
    return `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} – ${MONTHS[we.getMonth()]} ${we.getDate()}`
  })()

  return (
    <div style={{ maxWidth: 1340, margin: '0 auto', position: 'relative' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 18,
          marginBottom: 8,
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
            Week of {weekLabel}
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
            The <em style={{ fontStyle: 'italic' }}>plan</em>
          </h1>
          <p
            style={{
              margin: '10px 0 0',
              color: 'var(--ink-soft)',
              maxWidth: 460,
              fontSize: 15,
              lineHeight: 1.5,
            }}
          >
            Drag a recipe onto a day. We&apos;ll roll the groceries up for you.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={prevWeek} style={ghostBtn}>
            ← Prev week
          </button>
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              color: 'var(--ink-soft)',
              padding: '0 12px',
              height: 36,
              display: 'inline-flex',
              alignItems: 'center',
              borderLeft: '1px solid var(--rule)',
              borderRight: '1px solid var(--rule)',
            }}
          >
            This week
          </span>
          <button onClick={nextWeek} style={ghostBtn}>
            Next week →
          </button>
          <button onClick={generateGroceryList} style={accentBtn}>
            <InkDoodle kind="tomato" size={14} color="currentColor" />
            Build groceries
          </button>
        </div>
      </header>

      <div
        style={{
          width: '100%',
          height: 14,
          color: 'var(--rule)',
          margin: '22px 0 22px',
        }}
      >
        <svg viewBox="0 0 800 14" preserveAspectRatio="none" style={{ width: '100%', height: 14 }}>
          <path
            d="M2 7 Q 50 1 100 7 T 200 7 T 300 7 T 400 7 T 500 7 T 600 7 T 700 7 T 798 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 270px',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* Calendar grid */}
        <div
          style={{
            background: 'rgba(255,255,255,.45)',
            border: '1px solid var(--rule)',
            borderRadius: 12,
            padding: 14,
            boxShadow: 'var(--shadow-soft)',
            overflowX: 'auto',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '80px repeat(7, minmax(80px, 1fr))',
              gap: 6,
              minWidth: 720,
            }}
          >
            <div />
            {DAYS.map((d) => (
              <div
                key={d}
                style={{
                  textAlign: 'center',
                  padding: '6px 4px',
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontSize: 14,
                  fontStyle: 'italic',
                  color: 'var(--ink-soft)',
                  borderBottom: '1px solid var(--rule)',
                }}
              >
                {d}
              </div>
            ))}

            {MEALS.map((meal) => (
              <Row
                key={meal}
                meal={meal}
                getSlot={getSlot}
                hoverKey={hoverKey}
                setHoverKey={setHoverKey}
                onDrop={onDrop}
                onClear={onClear}
                onDragStart={(id) => setDragId(id)}
                onDragEnd={() => {
                  setDragId(null)
                  setHoverKey(null)
                }}
              />
            ))}
          </div>

          <div
            style={{
              marginTop: 14,
              padding: '10px 4px 0',
              borderTop: '1px dashed var(--rule)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'var(--ink-soft)',
              fontSize: 13,
            }}
          >
            <span>
              <strong>{totalRecipes}</strong> meals planned
            </span>
            <span
              style={{
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontStyle: 'italic',
                color: 'var(--accent-ink)',
                fontSize: 14,
              }}
            >
              drag a recipe on the right →
            </span>
          </div>
        </div>

        {/* Recipe drawer */}
        <div>
          <div
            style={{
              position: 'sticky',
              top: 20,
              background: 'rgba(255,255,255,.55)',
              border: '1px solid var(--rule)',
              borderRadius: 12,
              padding: '14px 12px 12px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                color: 'var(--ink-faint)',
                padding: '0 4px',
              }}
            >
              Drag to a day
            </div>
            <h3
              style={{
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontWeight: 500,
                fontSize: 22,
                margin: '4px 4px 12px',
                color: 'var(--ink)',
              }}
            >
              Your recipes
            </h3>
            <input
              value={drawerQuery}
              onChange={(e) => setDrawerQuery(e.target.value)}
              placeholder="Find a recipe…"
              style={{
                all: 'unset',
                display: 'block',
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 12px',
                borderRadius: 999,
                background: 'rgba(246,239,225,.7)',
                border: '1px solid var(--rule)',
                fontSize: 13,
                fontFamily: 'var(--font-sans)',
                marginBottom: 10,
              }}
            />
            <div
              className="scroll-y"
              style={{
                maxHeight: 480,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {filteredRecipes.map((r) => (
                <div
                  key={r.id}
                  draggable
                  onDragStart={() => setDragId(r.id)}
                  onDragEnd={() => {
                    setDragId(null)
                    setHoverKey(null)
                  }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '56px 1fr',
                    gap: 10,
                    alignItems: 'center',
                    padding: 6,
                    borderRadius: 8,
                    background:
                      dragId === r.id ? 'rgba(182,86,42,.08)' : 'rgba(255,255,255,.45)',
                    border: '1px solid var(--rule)',
                    cursor: 'grab',
                  }}
                >
                  <div style={{ aspectRatio: '1', borderRadius: 6, overflow: 'hidden' }}>
                    <CoverWash title={r.title} hue={recipeHue(r.id)} compact />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-serif, Georgia, serif)',
                        fontWeight: 500,
                        fontSize: 14,
                        lineHeight: 1.15,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: 'var(--ink)',
                      }}
                    >
                      {r.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--ink-faint)',
                        marginTop: 2,
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {(r.prep_time_mins || 0) + (r.cook_time_mins || 0)}m
                      {r.cuisine ? ` · ${r.cuisine}` : ''}
                    </div>
                  </div>
                </div>
              ))}
              {filteredRecipes.length === 0 && (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--ink-faint)', fontSize: 13 }}>
                  No matching recipes.
                </div>
              )}
            </div>
            <div
              style={{
                paddingTop: 10,
                marginTop: 10,
                borderTop: '1px dashed var(--rule)',
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontStyle: 'italic',
                fontSize: 13,
                color: 'var(--ink-faint)',
                textAlign: 'center',
              }}
            >
              tip: pick up a recipe and drop it on a day
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  meal,
  getSlot,
  hoverKey,
  setHoverKey,
  onDrop,
  onClear,
  onDragStart,
  onDragEnd,
}: {
  meal: 'breakfast' | 'lunch' | 'dinner'
  getSlot: (day: number, meal: string) => MealPlanSlot | undefined
  hoverKey: string | null
  setHoverKey: (k: string | null) => void
  onDrop: (day: number, meal: 'breakfast' | 'lunch' | 'dinner') => void
  onClear: (day: number, meal: 'breakfast' | 'lunch' | 'dinner') => void
  onDragStart: (id: string) => void
  onDragEnd: () => void
}) {
  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: 10,
          fontSize: 11,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
          fontWeight: 500,
        }}
      >
        {meal}
      </div>
      {DAYS.map((_, idx) => {
        const day = idx + 1
        const slot = getSlot(day, meal)
        const r = slot?.recipe
        const key = `${day}-${meal}`
        const isOver = hoverKey === key
        return (
          <div
            key={key}
            onDragOver={(e) => {
              e.preventDefault()
              setHoverKey(key)
            }}
            onDragLeave={() => setHoverKey(hoverKey === key ? null : hoverKey)}
            onDrop={() => onDrop(day, meal)}
            style={{
              minHeight: 86,
              borderRadius: 8,
              background: r
                ? 'transparent'
                : 'repeating-linear-gradient(45deg, transparent 0 6px, rgba(120,90,60,.04) 6px 12px)',
              border: isOver
                ? '2px dashed var(--accent-ink)'
                : '1px dashed var(--rule)',
              padding: 6,
              position: 'relative',
            }}
          >
            {r ? (
              <div
                draggable
                onDragStart={() => onDragStart(r.id)}
                onDragEnd={onDragEnd}
                className="lift"
                style={{
                  height: '100%',
                  borderRadius: 6,
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid var(--rule)',
                  boxShadow: 'var(--shadow-soft)',
                  background: 'var(--paper-warm)',
                  cursor: 'grab',
                }}
              >
                <div style={{ position: 'absolute', inset: 0 }}>
                  <CoverWash title={r.title} hue={recipeHue(r.id)} compact />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, transparent 30%, rgba(40,28,18,.6))',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '8px 9px',
                    color: 'var(--paper)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-serif, Georgia, serif)',
                      fontSize: 13,
                      fontWeight: 500,
                      lineHeight: 1.15,
                    }}
                  >
                    {r.title}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      opacity: 0.85,
                      marginTop: 2,
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {(r.prep_time_mins || 0) + (r.cook_time_mins || 0)}m
                    {r.servings ? ` · ${r.servings}p` : ''}
                  </div>
                </div>
                <button
                  onClick={() => onClear(day, meal)}
                  aria-label="remove"
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'rgba(20,16,12,.55)',
                    color: 'var(--paper)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    lineHeight: 1,
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ink-faint)',
                  fontSize: 12,
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontStyle: 'italic',
                }}
              >
                {isOver ? 'drop here' : '—'}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

const ghostBtn: React.CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  height: 36,
  padding: '0 12px',
  display: 'inline-flex',
  alignItems: 'center',
  color: 'var(--ink-soft)',
  borderRadius: 999,
}

const accentBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 14px',
  height: 36,
  borderRadius: 999,
  border: '1px solid var(--accent-ink)',
  background: 'var(--accent-ink)',
  color: 'var(--paper)',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  marginLeft: 8,
}
