'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createGroceryList, addItemsToGroceryList } from '@/actions/grocery'
import { toast } from 'sonner'

interface NewGroceryListButtonProps {
  recipes: Array<{ id: string; title: string }>
  preselectedIds?: string[]
}

function defaultListName(): string {
  const d = new Date()
  const month = d.toLocaleString('en-US', { month: 'short' })
  return `Market list — ${month} ${d.getDate()}`
}

export function NewGroceryListButton({ recipes, preselectedIds = [] }: NewGroceryListButtonProps) {
  const [open, setOpen] = useState(preselectedIds.length > 0)
  const [name, setName] = useState(defaultListName())
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set(preselectedIds))
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  useEffect(() => {
    if (preselectedIds.length > 0) {
      setSelectedRecipes(new Set(preselectedIds))
      setOpen(true)
    }
  }, [preselectedIds])

  function toggleRecipe(id: string) {
    setSelectedRecipes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function close() {
    setOpen(false)
    if (preselectedIds.length > 0) {
      // Clean up the URL so reopening the page doesn't auto-launch the dialog again.
      router.replace('/grocery-lists')
    }
  }

  function handleCreate() {
    if (!name.trim()) return
    startTransition(async () => {
      try {
        const list = await createGroceryList(name.trim())

        if (selectedRecipes.size > 0) {
          try {
            const res = await fetch('/api/grocery/merge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ recipeIds: Array.from(selectedRecipes) }),
            })
            const data = await res.json()
            if (!res.ok) {
              throw new Error(data.error ?? 'Couldn’t generate items')
            }
            if (data.items?.length > 0) {
              await addItemsToGroceryList(list.id, data.items)
              toast.success(`Built a list of ${data.items.length} items`)
            } else {
              toast.success('List created — no items were generated')
            }
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Couldn’t build the items, but the list is saved.')
          }
        } else {
          toast.success('Grocery list created')
        }

        setOpen(false)
        router.push(`/grocery-lists/${list.id}`)
      } catch {
        toast.error('Failed to create grocery list')
      }
    })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} style={triggerBtn}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New list
      </button>

      {open && (
        <div
          style={overlayStyle}
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={dialogStyle}
          >
            <div style={kickerStyle}>To market</div>
            <h2 style={titleStyle}>New grocery list</h2>

            <label style={labelStyle}>List name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Market list…"
              style={inputStyle}
            />

            {recipes.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <label style={labelStyle}>Generate from recipes</label>
                <div
                  className="scroll-y"
                  style={{
                    maxHeight: 200,
                    overflowY: 'auto',
                    marginTop: 6,
                    border: '1px solid var(--rule)',
                    borderRadius: 8,
                    padding: 6,
                    background: 'rgba(255,255,255,.4)',
                  }}
                >
                  {recipes.map((r) => {
                    const on = selectedRecipes.has(r.id)
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => toggleRecipe(r.id)}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '6px 8px',
                          borderRadius: 6,
                          fontSize: 13,
                          color: 'var(--ink)',
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255,255,255,.55)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <span className={`paper-check ${on ? 'is-on' : ''}`}>
                          {on && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--paper)" strokeWidth="3" strokeLinecap="round">
                              <path d="M5 12l5 5L20 7" />
                            </svg>
                          )}
                        </span>
                        <span style={{ flex: 1 }}>{r.title}</span>
                      </button>
                    )
                  })}
                </div>
                {selectedRecipes.size > 0 && (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                    We&apos;ll combine ingredients across {selectedRecipes.size} {selectedRecipes.size === 1 ? 'recipe' : 'recipes'} and group by aisle.
                  </p>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button onClick={close} disabled={isPending} style={ghostBtn}>
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isPending || !name.trim()}
                style={{
                  ...primaryBtn,
                  opacity: isPending || !name.trim() ? 0.6 : 1,
                  cursor: isPending || !name.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Building…' : 'Create list'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const triggerBtn: React.CSSProperties = {
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
  flexShrink: 0,
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 70,
  background: 'rgba(35,29,24,.45)',
  backdropFilter: 'blur(2px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
}

const dialogStyle: React.CSSProperties = {
  background: 'var(--paper)',
  border: '1px solid var(--rule)',
  borderRadius: 10,
  boxShadow: 'var(--shadow-card)',
  maxWidth: 460,
  width: '100%',
  padding: '24px 26px 22px',
  position: 'relative',
}

const kickerStyle: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: '.22em',
  textTransform: 'uppercase',
  color: 'var(--ink-faint)',
}

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-serif, Georgia, serif)',
  fontWeight: 500,
  fontSize: 26,
  margin: '4px 0 14px',
  color: 'var(--ink)',
  lineHeight: 1.15,
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  letterSpacing: '.22em',
  textTransform: 'uppercase',
  color: 'var(--ink-faint)',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
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
}

const ghostBtn: React.CSSProperties = {
  all: 'unset',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '8px 16px',
  borderRadius: 999,
  border: '1px solid var(--ink)',
  background: 'transparent',
  color: 'var(--ink)',
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
