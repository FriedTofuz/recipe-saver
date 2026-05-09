'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { deleteItem, updateItem } from '@/actions/grocery'
import type { GroceryItem } from '@/types'

interface ItemRowProps {
  item: GroceryItem
  onUpdate: (id: string, patch: Partial<GroceryItem>) => void
  onRemove: (id: string) => void
  onDragStart: () => void
  onDragEnd: () => void
}

export function ItemRow({
  item,
  onUpdate,
  onRemove,
  onDragStart,
  onDragEnd,
}: ItemRowProps) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(item.name)
  const [draftQty, setDraftQty] = useState(
    [item.quantity, item.unit].filter(Boolean).join(' ').trim()
  )

  const handleToggle = async () => {
    const next = !item.checked
    onUpdate(item.id, { checked: next })
    try {
      await updateItem(item.id, { checked: next })
    } catch {
      toast.error('Could not update item')
      onUpdate(item.id, { checked: item.checked })
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove(item.id)
    try {
      await deleteItem(item.id)
    } catch {
      toast.error('Could not delete item')
    }
  }

  const submitEdit = async () => {
    const name = draftName.trim()
    if (!name) {
      setEditing(false)
      setDraftName(item.name)
      setDraftQty([item.quantity, item.unit].filter(Boolean).join(' ').trim())
      return
    }
    // Parse "2 cups" -> quantity="2", unit="cups". Anything fancier stays in quantity.
    const qty = draftQty.trim()
    let quantity: string | null = null
    let unit: string | null = null
    if (qty) {
      const m = qty.match(/^([\d./\s]+)\s+(.+)$/)
      if (m) {
        quantity = m[1].trim()
        unit = m[2].trim()
      } else {
        quantity = qty
      }
    }
    const patch = { name, quantity, unit }
    onUpdate(item.id, patch)
    setEditing(false)
    try {
      await updateItem(item.id, patch)
    } catch {
      toast.error('Could not update item')
    }
  }

  const off = item.checked

  if (editing) {
    return (
      <li
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 6px',
          borderRadius: 6,
          background: 'rgba(255,255,255,.7)',
          border: '1px dashed var(--rule)',
        }}
      >
        <input
          value={draftQty}
          onChange={(e) => setDraftQty(e.target.value)}
          placeholder="qty"
          style={inlineInput(60)}
        />
        <input
          autoFocus
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitEdit()
            if (e.key === 'Escape') {
              setEditing(false)
              setDraftName(item.name)
              setDraftQty([item.quantity, item.unit].filter(Boolean).join(' ').trim())
            }
          }}
          onBlur={submitEdit}
          style={inlineInput()}
        />
      </li>
    )
  }

  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      onClick={handleToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '6px 8px',
        borderRadius: 6,
        cursor: 'pointer',
        opacity: off ? 0.5 : 1,
        transition: 'opacity .2s, background .15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,.5)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
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
      <div className={off ? 'hand-strike' : ''} style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontFamily: 'var(--font-sans)',
            color: 'var(--ink)',
            lineHeight: 1.2,
          }}
        >
          {(item.quantity || item.unit) && (
            <strong style={{ color: 'var(--accent-ink)', marginRight: 4 }}>
              {[item.quantity, item.unit].filter(Boolean).join(' ')}
            </strong>
          )}
          {item.name}
        </div>
        {item.source_recipe && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--ink-faint)',
              fontFamily: 'var(--font-serif, Georgia, serif)',
              fontStyle: 'italic',
              marginTop: 1,
            }}
          >
            for {item.source_recipe}
          </div>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setEditing(true)
        }}
        aria-label="Edit"
        style={iconBtn}
        className="item-action"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
      <button
        onClick={handleDelete}
        aria-label="Delete"
        style={iconBtn}
        className="item-action"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
      </button>
    </li>
  )
}

const iconBtn: React.CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  padding: 4,
  color: 'var(--ink-faint)',
  borderRadius: 4,
  display: 'inline-flex',
}

function inlineInput(width?: number): React.CSSProperties {
  return {
    all: 'unset',
    flex: width ? '0 0 auto' : 1,
    width: width,
    fontSize: 14,
    fontFamily: 'var(--font-sans)',
    color: 'var(--ink)',
    padding: '2px 4px',
    borderBottom: '1px dashed var(--rule)',
    minWidth: width ? undefined : 0,
  }
}
