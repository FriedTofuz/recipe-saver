'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { setRecipeCookbooks, createCookbook } from '@/actions/cookbook'
import { deleteRecipe } from '@/actions/recipe'
import { ConfirmDialog } from '@/components/paper/ConfirmDialog'
import { toast } from 'sonner'
import type { Cookbook } from '@/types'

interface RecipeCardMenuProps {
  recipeId: string
  recipeTitle: string
}

type View = 'menu' | 'cookbooks'

export function RecipeCardMenu({ recipeId, recipeTitle }: RecipeCardMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('menu')
  const [showDelete, setShowDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setView('menu')
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setView('menu')
      }
    }
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteRecipe(recipeId)
        toast.success('Recipe deleted')
      } catch {
        toast.error('Failed to delete recipe')
      }
    })
  }

  function preventNav(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <>
      <div
        ref={containerRef}
        onClick={preventNav}
        onMouseDown={preventNav}
        onTouchStart={preventNav}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 5,
        }}
      >
        <button
          aria-label="Recipe options"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen((v) => !v)
            setView('menu')
          }}
          style={{
            all: 'unset',
            cursor: 'pointer',
            width: 30,
            height: 30,
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,.85)',
            color: 'var(--ink)',
            boxShadow: '0 1px 2px rgba(60,40,20,.18)',
            border: '1px solid var(--rule)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <circle cx="6" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="18" cy="12" r="1.6" />
          </svg>
        </button>

        {open && (
          <div
            style={{
              position: 'absolute',
              top: 36,
              right: 0,
              minWidth: 200,
              background: 'var(--paper)',
              border: '1px solid var(--rule)',
              borderRadius: 8,
              boxShadow: 'var(--shadow-card)',
              padding: 6,
              fontFamily: 'var(--font-sans)',
            }}
          >
            {view === 'menu' && (
              <>
                <MenuItem
                  onClick={() => {
                    setOpen(false)
                    router.push(`/recipes/${recipeId}/edit`)
                  }}
                >
                  <PencilIcon /> Edit
                </MenuItem>
                <MenuItem onClick={() => setView('cookbooks')}>
                  <BookIcon /> Add to cookbook
                </MenuItem>
                <div
                  style={{
                    height: 1,
                    background: 'var(--rule)',
                    margin: '4px 0',
                  }}
                />
                <MenuItem
                  destructive
                  onClick={() => {
                    setOpen(false)
                    setShowDelete(true)
                  }}
                >
                  <TrashIcon /> Delete
                </MenuItem>
              </>
            )}
            {view === 'cookbooks' && (
              <CookbooksPicker
                recipeId={recipeId}
                onClose={() => {
                  setOpen(false)
                  setView('menu')
                }}
              />
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showDelete}
        title={`Delete "${recipeTitle}"?`}
        message="This recipe and its ingredients, steps, and any meal-plan entries will be removed. This can't be undone."
        confirmLabel={isPending ? 'Deleting…' : 'Delete recipe'}
        cancelLabel="Keep it"
        destructive
        onConfirm={() => {
          setShowDelete(false)
          handleDelete()
        }}
        onCancel={() => setShowDelete(false)}
      />
    </>
  )
}

function MenuItem({
  children,
  onClick,
  destructive,
}: {
  children: React.ReactNode
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        boxSizing: 'border-box',
        padding: '8px 10px',
        borderRadius: 6,
        fontSize: 13,
        color: destructive ? '#7d3f2f' : 'var(--ink)',
        transition: 'background .12s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,.55)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}

function CookbooksPicker({ recipeId, onClose }: { recipeId: string; onClose: () => void }) {
  const supabase = createClient()
  const { data, mutate } = useSWR(`recipe-cookbooks-${recipeId}`, async () => {
    const [{ data: books }, { data: links }] = await Promise.all([
      supabase.from('cookbooks').select('id, name').order('name'),
      supabase.from('recipe_cookbooks').select('cookbook_id').eq('recipe_id', recipeId),
    ])
    return {
      cookbooks: (books ?? []) as Cookbook[],
      selectedIds: new Set((links ?? []).map((l) => l.cookbook_id as string)),
    }
  })
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [seeded, setSeeded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (data && !seeded) {
      setSelected(new Set(data.selectedIds))
      setSeeded(true)
    }
  }, [data, seeded])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await setRecipeCookbooks(recipeId, Array.from(selected))
      toast.success('Cookbooks updated')
      onClose()
    } catch {
      toast.error('Failed to update cookbooks')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddNew() {
    const name = newName.trim()
    if (!name) return
    setSaving(true)
    try {
      const cb = await createCookbook(name)
      setSelected((prev) => {
        const next = new Set(prev)
        next.add(cb.id)
        return next
      })
      setNewName('')
      mutate()
    } catch {
      toast.error('Failed to create cookbook')
    } finally {
      setSaving(false)
    }
  }

  if (!data) {
    return (
      <div style={{ padding: 12, fontSize: 13, color: 'var(--ink-faint)' }}>Loading…</div>
    )
  }

  return (
    <div style={{ padding: '4px 4px 6px', minWidth: 220 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
          padding: '4px 8px 6px',
        }}
      >
        Add to cookbook
      </div>
      {data.cookbooks.length === 0 && (
        <div style={{ padding: '6px 8px', fontSize: 12, color: 'var(--ink-faint)' }}>
          No cookbooks yet — create one below.
        </div>
      )}
      <div style={{ maxHeight: 180, overflowY: 'auto' }} className="scroll-y">
        {data.cookbooks.map((cb) => {
          const on = selected.has(cb.id)
          return (
            <button
              key={cb.id}
              onClick={() => toggle(cb.id)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                boxSizing: 'border-box',
                padding: '6px 8px',
                borderRadius: 6,
                fontSize: 13,
                color: 'var(--ink)',
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
              <span
                style={{
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {cb.name}
              </span>
            </button>
          )
        })}
      </div>
      <div
        style={{
          marginTop: 6,
          paddingTop: 6,
          borderTop: '1px dashed var(--rule)',
          display: 'flex',
          gap: 6,
        }}
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddNew()
            }
          }}
          placeholder="New cookbook…"
          style={{
            all: 'unset',
            flex: 1,
            padding: '4px 8px',
            borderRadius: 6,
            background: 'rgba(255,255,255,.6)',
            border: '1px solid var(--rule)',
            fontSize: 12,
            color: 'var(--ink)',
            fontFamily: 'var(--font-sans)',
          }}
        />
        <button
          onClick={handleAddNew}
          disabled={!newName.trim() || saving}
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: '4px 10px',
            borderRadius: 6,
            background: 'var(--ink)',
            color: 'var(--paper)',
            fontSize: 12,
            opacity: !newName.trim() || saving ? 0.5 : 1,
          }}
        >
          +
        </button>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 6,
          marginTop: 8,
        }}
      >
        <button
          onClick={onClose}
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: '5px 10px',
            fontSize: 12,
            color: 'var(--ink-soft)',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: '5px 12px',
            borderRadius: 999,
            background: 'var(--accent-ink)',
            color: 'var(--paper)',
            fontSize: 12,
            fontWeight: 500,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
      <path d="M14.7 6.3a4 4 0 015.6 5.6l-1.4 1.4-5.6-5.6 1.4-1.4z" />
      <path d="M13.3 7.7L4 17v3h3l9.3-9.3" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
      <path d="M4 4 h16 v16 h-16 Z" />
      <path d="M12 4 v16" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M5 6l1 14h12l1-14" />
    </svg>
  )
}
