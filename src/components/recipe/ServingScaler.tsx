'use client'

import { useState } from 'react'
import { scaleQuantity, convertUnit } from '@/lib/ingredient-scaler'
import { blobHue } from '@/components/paper'
import type { Ingredient } from '@/types'

interface ServingScalerProps {
  baseServings: number
  ingredients: Ingredient[]
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  units: 'us' | 'metric'
}

const DOT_COLOR: Record<string, string> = {
  tomato: '#b6562a',
  mustard: '#c9954a',
  sage: '#7a8a52',
  plum: '#7d3f2f',
  cream: '#d8c79a',
  ink: '#3e3528',
}

export function ServingScaler({
  baseServings,
  ingredients,
  calories,
  protein_g,
  carbs_g,
  fat_g,
  units,
}: ServingScalerProps) {
  const [servings, setServings] = useState(baseServings)
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const multiplier = servings / baseServings

  function toggle(id: string) {
    setChecked((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  return (
    <div>
      {/* Serving scaler box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          margin: '0 0 16px',
          border: '1px solid var(--rule)',
          borderRadius: 10,
          background: 'rgba(255,255,255,.45)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--ink-faint)',
              textTransform: 'uppercase',
              letterSpacing: '.12em',
            }}
          >
            Servings
          </div>
          <div
            style={{
              fontFamily: 'var(--font-serif, Georgia, serif)',
              fontWeight: 500,
              fontSize: 30,
              color: 'var(--ink)',
              lineHeight: 1,
              marginTop: 4,
            }}
          >
            {servings}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ScaleButton onClick={() => setServings((s) => Math.max(1, s - 1))}>–</ScaleButton>
          <ScaleButton onClick={() => setServings((s) => s + 1)}>+</ScaleButton>
        </div>
      </div>

      {/* Ingredient list */}
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {ingredients.map((ing) => {
          const scaledQty = scaleQuantity(ing.quantity, baseServings, servings)
          const conv = convertUnit(
            ing.quantity !== null ? (ing.quantity * servings) / baseServings : null,
            ing.unit,
            units === 'metric'
          )
          const displayQty = units === 'metric' ? conv.quantity : scaledQty
          const displayUnit = units === 'metric' ? conv.unit : ing.unit ?? ''
          const off = checked.has(ing.id)
          const dotColor = DOT_COLOR[blobHue(ing.name.toLowerCase())] ?? '#b6562a'

          return (
            <li
              key={ing.id}
              onClick={() => toggle(ing.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '6px 0',
                cursor: 'pointer',
                opacity: off ? 0.45 : 1,
                transition: 'opacity .2s',
              }}
            >
              <span
                style={{
                  flex: '0 0 14px',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  marginTop: 7,
                  background: dotColor,
                  boxShadow:
                    'inset 0 -2px 3px rgba(0,0,0,.18), 0 0 0 2px rgba(255,255,255,.5)',
                  display: 'inline-block',
                }}
              />
              <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
                <div
                  className={off ? 'hand-strike' : ''}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    color: 'var(--ink)',
                    lineHeight: 1.4,
                  }}
                >
                  {displayQty && (
                    <span style={{ fontWeight: 600, marginRight: 6, color: 'var(--accent-ink)' }}>
                      {displayQty}
                    </span>
                  )}
                  {displayUnit && (
                    <span style={{ marginRight: 6, color: 'var(--ink-soft)' }}>{displayUnit}</span>
                  )}
                  <span>{ing.name}</span>
                </div>
                {ing.notes && (
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: 12.5,
                      color: 'var(--ink-soft)',
                      marginTop: 3,
                      lineHeight: 1.35,
                      fontStyle: 'italic',
                    }}
                  >
                    {ing.notes}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {hasNutrition({ calories, protein_g, carbs_g, fat_g }) && (
        <div style={{ marginTop: 22 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              padding: '4px 0 8px',
            }}
          >
            Per serving
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap: 8,
            }}
          >
            {[
              ['kcal', calories],
              ['protein', protein_g != null ? `${Math.round(protein_g * multiplier)}g` : null],
              ['carbs', carbs_g != null ? `${Math.round(carbs_g * multiplier)}g` : null],
              ['fat', fat_g != null ? `${Math.round(fat_g * multiplier)}g` : null],
            ].map(([k, v], idx) => (
              <div
                key={String(k)}
                style={{
                  padding: '8px 6px',
                  textAlign: 'center',
                  border: '1px solid var(--rule)',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,.4)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-serif, Georgia, serif)',
                    fontSize: 18,
                    fontWeight: 500,
                    color: 'var(--ink)',
                  }}
                >
                  {idx === 0
                    ? calories != null
                      ? Math.round(calories * multiplier)
                      : '—'
                    : v ?? '—'}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '.12em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-faint)',
                  }}
                >
                  {k as string}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function hasNutrition(n: {
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
}): boolean {
  return (
    (n.calories != null && n.calories > 0) ||
    (n.protein_g != null && n.protein_g > 0) ||
    (n.carbs_g != null && n.carbs_g > 0) ||
    (n.fat_g != null && n.fat_g > 0)
  )
}

function ScaleButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset',
        cursor: 'pointer',
        width: 30,
        height: 30,
        borderRadius: '50%',
        border: '1px solid var(--ink)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-serif, Georgia, serif)',
        fontSize: 18,
        lineHeight: 1,
        background: 'transparent',
        color: 'var(--ink)',
      }}
    >
      {children}
    </button>
  )
}
