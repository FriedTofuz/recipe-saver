'use client'

import { useState, useEffect } from 'react'
import { useWakeLock } from '@/hooks/useWakeLock'
import { WatercolorBlob, blobHue } from '@/components/paper'
import type { Step, Ingredient } from '@/types'

interface CookingModeProps {
  steps: Step[]
  ingredients: Ingredient[]
  title: string
  onClose: () => void
}

export function CookingMode({ steps, ingredients, title, onClose }: CookingModeProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [doneIngredients, setDoneIngredients] = useState<Set<string>>(new Set())
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set())
  useWakeLock(true)

  const total = steps.length
  const step = steps[currentStep]

  function next() {
    setDoneSteps((prev) => {
      const n = new Set(prev)
      n.add(currentStep)
      return n
    })
    setCurrentStep((s) => Math.min(total - 1, s + 1))
  }

  function prev() {
    setCurrentStep((s) => Math.max(0, s - 1))
  }

  function toggleIng(id: string) {
    setDoneIngredients((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ') next()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, total])

  return (
    <div
      className="paper-bg"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '22px 38px 60px', maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
            marginBottom: 18,
          }}
        >
          <button
            onClick={onClose}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 0',
              fontSize: 13,
              color: 'var(--ink-soft)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            Close cooking mode
          </button>

          <div style={{ textAlign: 'center', minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '.22em',
                textTransform: 'uppercase',
                color: 'var(--ink-faint)',
              }}
            >
              Now cooking
            </div>
            <div
              style={{
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontSize: 22,
                fontStyle: 'italic',
                marginTop: 2,
                color: 'var(--ink)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {title}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-soft)' }}>
              Step {currentStep + 1}{' '}
              <span style={{ color: 'var(--ink-faint)' }}>of {total}</span>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--accent-ink)',
              }}
            >
              screen stays awake
            </span>
          </div>
        </div>

        {/* Progress bar dots */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 30 }}>
          {steps.map((_, i) => {
            const isDone = doneSteps.has(i) || i < currentStep
            const isNow = i === currentStep
            return (
              <div key={i} style={{ flex: 1 }}>
                <div
                  style={{
                    height: isNow ? 6 : 4,
                    borderRadius: 6,
                    background: isDone || isNow ? 'var(--accent-ink)' : 'var(--rule)',
                    transition: 'background .3s, height .2s',
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Main: step + ingredients */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 1fr)',
            gap: 32,
            alignItems: 'start',
          }}
        >
          {/* Step panel */}
          <div
            className="paper-bg"
            style={{
              borderRadius: 8,
              boxShadow: 'var(--shadow-card)',
              padding: '42px 56px 36px',
              minHeight: 380,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 18,
                right: 24,
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--ink-faint)',
              }}
            >
              p.{currentStep + 1}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                marginBottom: 28,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: 110,
                  lineHeight: 1,
                  color: 'var(--accent-ink)',
                  display: 'inline-block',
                }}
              >
                {currentStep + 1}
              </span>
              <div style={{ borderLeft: '1px solid var(--rule)', paddingLeft: 22 }}>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: '.22em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-faint)',
                  }}
                >
                  The next move
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-serif, Georgia, serif)',
                    fontStyle: 'italic',
                    fontSize: 18,
                    color: 'var(--ink-soft)',
                    marginTop: 4,
                    lineHeight: 1.1,
                  }}
                >
                  {currentStep === total - 1
                    ? 'the last step!'
                    : currentStep === 0
                    ? 'ready, set...'
                    : 'and then —'}
                </div>
              </div>
            </div>

            <p
              style={{
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontWeight: 400,
                fontSize: 30,
                lineHeight: 1.35,
                margin: '0 0 28px',
                color: 'var(--ink)',
              }}
            >
              {step.instruction}
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 24,
                paddingTop: 18,
                borderTop: '1px dashed var(--rule)',
              }}
            >
              <button
                onClick={prev}
                disabled={currentStep === 0}
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
                  cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentStep === 0 ? 0.4 : 1,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
                Previous
              </button>

              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: 12,
                  color: 'var(--ink-faint)',
                }}
              >
                {currentStep + 1} / {total}
              </div>

              {currentStep === total - 1 ? (
                <button
                  onClick={onClose}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: '1px solid var(--accent-ink)',
                    background: 'var(--accent-ink)',
                    color: 'var(--paper)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Done cooking!
                </button>
              ) : (
                <button
                  onClick={next}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: '1px solid var(--accent-ink)',
                    background: 'var(--accent-ink)',
                    color: 'var(--paper)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Next step
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              )}
            </div>

            {/* Step preview list */}
            <div
              style={{
                marginTop: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {steps.map((s, i) => {
                if (Math.abs(i - currentStep) > 2 && i !== total - 1 && i !== 0) return null
                const isPast = i < currentStep
                const isCurrent = i === currentStep
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    style={{
                      all: 'unset',
                      cursor: 'pointer',
                      padding: '6px 8px',
                      borderRadius: 6,
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                      background: isCurrent ? 'rgba(182,86,42,.06)' : 'transparent',
                      opacity: isPast ? 0.55 : 1,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 11,
                        color: isCurrent ? 'var(--accent-ink)' : 'var(--ink-faint)',
                        width: 18,
                        flexShrink: 0,
                        paddingTop: 3,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: 'var(--ink-soft)',
                        lineHeight: 1.4,
                        textDecoration: isPast ? 'line-through' : 'none',
                      }}
                    >
                      {s.instruction.length > 110
                        ? s.instruction.slice(0, 108) + '…'
                        : s.instruction}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Ingredients sidebar */}
          <div style={{ position: 'sticky', top: 20 }}>
            <div
              className="paper-bg"
              style={{
                borderRadius: 8,
                boxShadow: 'var(--shadow-card)',
                padding: '22px 24px 18px',
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
                Mise en place
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontWeight: 500,
                  fontSize: 24,
                  margin: '4px 0 14px',
                  color: 'var(--ink)',
                }}
              >
                Cross off as you go
              </h3>

              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {ingredients.map((ing) => {
                  const off = doneIngredients.has(ing.id)
                  return (
                    <li
                      key={ing.id}
                      onClick={() => toggleIng(ing.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 11,
                        padding: '6px 4px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: 'opacity .2s',
                        opacity: off ? 0.55 : 1,
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
                      <span style={{ flex: '0 0 28px', display: 'inline-flex' }}>
                        <WatercolorBlob
                          id={`cm-${ing.id}`}
                          hue={blobHue(ing.name.toLowerCase())}
                          size={28}
                        />
                      </span>
                      <div
                        className={off ? 'hand-strike' : ''}
                        style={{
                          flex: 1,
                          fontSize: 13.5,
                          color: 'var(--ink)',
                          lineHeight: 1.3,
                        }}
                      >
                        {ing.quantity != null && (
                          <strong style={{ color: 'var(--accent-ink)' }}>{ing.quantity} </strong>
                        )}
                        {ing.unit && (
                          <span style={{ color: 'var(--ink-soft)' }}>{ing.unit} </span>
                        )}
                        <span>{ing.name}</span>
                        {ing.notes && (
                          <div
                            style={{
                              fontFamily: 'var(--font-sans)',
                              fontSize: 12,
                              color: 'var(--ink-faint)',
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

              <div
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: '1px dashed var(--rule)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-faint)',
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {doneIngredients.size}/{ingredients.length} ready
                </span>
                <button
                  onClick={() => setDoneIngredients(new Set())}
                  style={{
                    all: 'unset',
                    cursor: 'pointer',
                    fontSize: 12,
                    padding: '4px 0',
                    color: 'var(--ink-soft)',
                  }}
                >
                  Reset
                </button>
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                padding: '10px 14px',
                border: '1px dashed var(--rule)',
                borderRadius: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                Use ← / → to step
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontStyle: 'italic',
                  fontSize: 14,
                  color: 'var(--accent-ink)',
                }}
              >
                good luck!
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
