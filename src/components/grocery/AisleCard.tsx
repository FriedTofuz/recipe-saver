'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ItemRow } from './ItemRow'
import { ConfirmDialog } from '@/components/paper/ConfirmDialog'
import { clearAisle, deleteAisle, renameAisle } from '@/actions/grocery'
import type { GroceryAisle, GroceryItem } from '@/types'

interface AisleCardProps {
  aisle: GroceryAisle
  items: GroceryItem[]
  hideChecked: boolean
  uncategorized?: boolean
  isDropTarget: boolean
  isAisleDragTarget: boolean
  onDragOver: (type: 'suggestion' | 'item' | 'aisle') => void
  onDragLeave: () => void
  onDrop: () => void
  onAisleDragStart: () => void
  onAisleDragEnd: () => void
  onItemDragStart: (item: GroceryItem) => void
  onItemDragEnd: () => void
  onAddItem: (name: string) => void
  onItemUpdate: (id: string, patch: Partial<GroceryItem>) => void
  onItemRemove: (id: string) => void
  onAisleUpdate: (id: string, patch: Partial<GroceryAisle>) => void
  onAisleRemove: (id: string) => void
}

export function AisleCard({
  aisle,
  items,
  hideChecked,
  uncategorized = false,
  isDropTarget,
  isAisleDragTarget,
  onDragOver,
  onDragLeave,
  onDrop,
  onAisleDragStart,
  onAisleDragEnd,
  onItemDragStart,
  onItemDragEnd,
  onAddItem,
  onItemUpdate,
  onItemRemove,
  onAisleUpdate,
  onAisleRemove,
}: AisleCardProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [nameDraft, setNameDraft] = useState(aisle.name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    function close(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const visibleItems = hideChecked ? items.filter((i) => !i.checked) : items
  const checkedItems = items.filter((i) => i.checked)

  const handleRename = async () => {
    const next = nameDraft.trim()
    if (!next || next === aisle.name) {
      setRenaming(false)
      setNameDraft(aisle.name)
      return
    }
    onAisleUpdate(aisle.id, { name: next })
    setRenaming(false)
    try {
      await renameAisle(aisle.id, next)
    } catch {
      toast.error('Could not rename aisle')
      onAisleUpdate(aisle.id, { name: aisle.name })
    }
  }

  const handleDelete = async () => {
    setConfirmDelete(false)
    onAisleRemove(aisle.id)
    try {
      await deleteAisle(aisle.id)
      toast.success(`Removed "${aisle.name}"`)
    } catch {
      toast.error('Could not delete aisle')
    }
  }

  const handleClear = async () => {
    setConfirmClear(false)
    items.forEach((it) => onItemRemove(it.id))
    try {
      await clearAisle(uncategorized ? null : aisle.id)
      toast.success(`Cleared "${aisle.name}"`)
    } catch {
      toast.error('Could not clear aisle')
    }
  }

  const submitNewItem = () => {
    const name = newItemName.trim()
    if (!name) {
      setAdding(false)
      return
    }
    onAddItem(name)
    setNewItemName('')
    // keep input open for rapid entry; close on Esc
  }

  return (
    <section
      onDragOver={(e) => {
        e.preventDefault()
        // We don't know the drag type from native events, so always notify;
        // GroceryPage will only update hover for relevant types.
        onDragOver('suggestion')
      }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        background: 'rgba(255,255,255,.5)',
        border: isDropTarget
          ? '2px dashed var(--accent-ink)'
          : isAisleDragTarget
          ? '2px dashed var(--ink-soft)'
          : '1px solid var(--rule)',
        borderRadius: 10,
        padding: '18px 22px 14px',
        position: 'relative',
        boxShadow: 'var(--shadow-soft)',
        transition: 'border-color .15s, transform .15s',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 14,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
            flex: 1,
            minWidth: 0,
            cursor: uncategorized ? 'default' : 'grab',
          }}
          draggable={!uncategorized && !renaming}
          onDragStart={(e) => {
            if (uncategorized) return
            e.dataTransfer.effectAllowed = 'move'
            onAisleDragStart()
          }}
          onDragEnd={onAisleDragEnd}
          onClick={() => {
            if (renaming) return
            setCollapsed((c) => !c)
          }}
        >
          <span
            style={{
              fontSize: 11,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
            }}
          >
            aisle
          </span>
          {renaming ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') {
                  setRenaming(false)
                  setNameDraft(aisle.name)
                }
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                all: 'unset',
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontWeight: 500,
                fontSize: 26,
                color: 'var(--ink)',
                borderBottom: '1px dashed var(--rule)',
                minWidth: 100,
              }}
            />
          ) : (
            <h2
              style={{
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontWeight: 500,
                fontSize: 26,
                margin: 0,
                lineHeight: 1,
                color: 'var(--ink)',
              }}
            >
              {aisle.name}
            </h2>
          )}
          {checkedItems.length === items.length && items.length > 0 && (
            <span
              style={{
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontStyle: 'italic',
                color: 'var(--accent-ink)',
                fontSize: 14,
              }}
            >
              got it ✓
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-faint)' }}>
            {checkedItems.length}/{items.length}
          </span>
          {!uncategorized && (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen((m) => !m)
                }}
                aria-label="Aisle options"
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  padding: 4,
                  color: 'var(--ink-soft)',
                  borderRadius: 4,
                  display: 'inline-flex',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="1.6" />
                  <circle cx="12" cy="12" r="1.6" />
                  <circle cx="19" cy="12" r="1.6" />
                </svg>
              </button>
              {menuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: '110%',
                    right: 0,
                    zIndex: 30,
                    background: 'var(--paper)',
                    border: '1px solid var(--rule)',
                    borderRadius: 8,
                    boxShadow: 'var(--shadow-card)',
                    padding: 4,
                    minWidth: 180,
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                  }}
                >
                  <MenuItem
                    onClick={() => {
                      setMenuOpen(false)
                      setAdding(true)
                    }}
                  >
                    Add item
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setMenuOpen(false)
                      setRenaming(true)
                    }}
                  >
                    Rename aisle
                  </MenuItem>
                  <MenuItem
                    disabled={items.length === 0}
                    onClick={() => {
                      setMenuOpen(false)
                      setConfirmClear(true)
                    }}
                  >
                    Clear items
                  </MenuItem>
                  <MenuItem
                    danger
                    onClick={() => {
                      setMenuOpen(false)
                      setConfirmDelete(true)
                    }}
                  >
                    Delete aisle
                  </MenuItem>
                </div>
              )}
            </div>
          )}
          <svg
            onClick={() => setCollapsed((c) => !c)}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              color: 'var(--ink-soft)',
              transform: collapsed ? 'rotate(-90deg)' : 'none',
              transition: 'transform .2s',
              cursor: 'pointer',
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {!collapsed && (
        <>
          <ul
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 4,
            }}
          >
            {visibleItems.map((it) => (
              <ItemRow
                key={it.id}
                item={it}
                onUpdate={onItemUpdate}
                onRemove={onItemRemove}
                onDragStart={() => onItemDragStart(it)}
                onDragEnd={onItemDragEnd}
              />
            ))}
            {visibleItems.length === 0 && !adding && (
              <li
                style={{
                  fontStyle: 'italic',
                  color: 'var(--ink-faint)',
                  fontSize: 13,
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  padding: '4px 8px',
                }}
              >
                {hideChecked && checkedItems.length > 0 ? 'all checked off' : 'empty — drop a suggestion or add an item'}
              </li>
            )}
          </ul>

          {adding && (
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                border: '1px dashed var(--rule)',
                borderRadius: 6,
                background: 'rgba(255,255,255,.55)',
              }}
            >
              <input
                autoFocus
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitNewItem()
                  if (e.key === 'Escape') {
                    setAdding(false)
                    setNewItemName('')
                  }
                }}
                placeholder="2 lemons, milk, …"
                style={{
                  all: 'unset',
                  flex: 1,
                  fontSize: 14,
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--ink)',
                }}
              />
              <button
                onClick={() => {
                  setAdding(false)
                  setNewItemName('')
                }}
                style={inlineGhostBtn}
              >
                Done
              </button>
            </div>
          )}

          {!adding && (
            <button
              onClick={() => setAdding(true)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                marginTop: 10,
                fontSize: 12,
                color: 'var(--ink-soft)',
                fontFamily: 'var(--font-sans)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 6px',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add item
            </button>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete "${aisle.name}"?`}
        message="Items in this aisle will move to Uncategorized."
        confirmLabel="Delete aisle"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
      <ConfirmDialog
        open={confirmClear}
        title={`Clear "${aisle.name}"?`}
        message="Removes every item in this aisle. The aisle itself stays."
        confirmLabel="Clear items"
        destructive
        onConfirm={handleClear}
        onCancel={() => setConfirmClear(false)}
      />
    </section>
  )
}

function MenuItem({
  onClick,
  children,
  danger = false,
  disabled = false,
}: {
  onClick: () => void
  children: React.ReactNode
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        all: 'unset',
        display: 'block',
        width: '100%',
        boxSizing: 'border-box',
        padding: '7px 10px',
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? 'var(--ink-faint)' : danger ? '#7d3f2f' : 'var(--ink)',
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = 'rgba(0,0,0,.04)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {children}
    </button>
  )
}

const inlineGhostBtn: React.CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  fontSize: 12,
  fontFamily: 'var(--font-sans)',
  color: 'var(--ink-soft)',
  padding: '2px 8px',
  borderRadius: 999,
  border: '1px solid var(--rule)',
}
