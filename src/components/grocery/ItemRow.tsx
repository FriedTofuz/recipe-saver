'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { deleteItem, updateItem } from '@/actions/grocery'
import type { GroceryItem } from '@/types'

interface ItemRowProps {
  item: GroceryItem
  isHover: boolean
  onUpdate: (id: string, patch: Partial<GroceryItem>) => void
  onRemove: (id: string) => void
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent<HTMLLIElement>) => void
  onDrop: () => void
}

export function ItemRow({
  item,
  isHover,
  onUpdate,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: ItemRowProps) {
  const [editing, setEditing] = useState(false)
  const [draftQty, setDraftQty] = useState(item.quantity ?? '')
  const [draftUnit, setDraftUnit] = useState(item.unit ?? '')
  const [draftName, setDraftName] = useState(item.name)

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

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDraftQty(item.quantity ?? '')
    setDraftUnit(item.unit ?? '')
    setDraftName(item.name)
    setEditing(true)
  }

  const submitEdit = async () => {
    const name = draftName.trim()
    if (!name) {
      setEditing(false)
      return
    }
    const patch = {
      name,
      quantity: draftQty.trim() || null,
      unit: draftUnit.trim() || null,
    }
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
          display: 'grid',
          gridTemplateColumns: '70px 90px 1fr auto',
          gap: 8,
          alignItems: 'center',
          padding: '6px 8px',
          borderRadius: 6,
          background: 'rgba(255,255,255,.7)',
          border: '1px dashed var(--accent-ink)',
        }}
      >
        <input
          value={draftQty}
          onChange={(e) => setDraftQty(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitEdit()
            if (e.key === 'Escape') setEditing(false)
          }}
          placeholder="Qty"
          style={inlineInput}
        />
        <input
          value={draftUnit}
          onChange={(e) => setDraftUnit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitEdit()
            if (e.key === 'Escape') setEditing(false)
          }}
          placeholder="Unit"
          style={inlineInput}
        />
        <input
          autoFocus
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submitEdit()
            if (e.key === 'Escape') setEditing(false)
          }}
          placeholder="Item name"
          style={inlineInput}
        />
        <button onClick={submitEdit} style={saveBtn}>
          Save
        </button>
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
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={handleToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 6,
        cursor: 'pointer',
        opacity: off ? 0.5 : 1,
        borderTop: isHover ? '2px solid var(--accent-ink)' : '2px solid transparent',
        transition: 'opacity .2s, background .15s, border-color .15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,.5)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <span
        aria-hidden
        style={{
          color: 'var(--ink-faint)',
          cursor: 'grab',
          flexShrink: 0,
          display: 'inline-flex',
        }}
        title="Drag to reorder"
      >
        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
          <circle cx="2" cy="2" r="1.2" />
          <circle cx="8" cy="2" r="1.2" />
          <circle cx="2" cy="7" r="1.2" />
          <circle cx="8" cy="7" r="1.2" />
          <circle cx="2" cy="12" r="1.2" />
          <circle cx="8" cy="12" r="1.2" />
        </svg>
      </span>
      <span className={`paper-check ${off ? 'is-on' : ''}`} style={{ flexShrink: 0 }}>
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
        <span
          style={{
            fontSize: 14.5,
            fontFamily: 'var(--font-sans)',
            color: 'var(--ink)',
            lineHeight: 1.3,
          }}
        >
          {(item.quantity || item.unit) && (
            <strong style={{ color: 'var(--accent-ink)', marginRight: 6 }}>
              {[item.quantity, item.unit].filter(Boolean).join(' ')}
            </strong>
          )}
          {item.name}
          {item.source_recipe && (
            <span
              style={{
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontStyle: 'italic',
                color: 'var(--ink-faint)',
                fontSize: 13,
                marginLeft: 8,
              }}
            >
              — for {item.source_recipe}
            </span>
          )}
        </span>
      </div>
      <button
        onClick={startEdit}
        aria-label="Edit"
        style={iconBtn}
        className="item-action"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

const inlineInput: React.CSSProperties = {
  all: 'unset',
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '4px 8px',
  borderRadius: 4,
  background: 'rgba(255,255,255,.7)',
  border: '1px solid var(--rule)',
  fontSize: 14,
  color: 'var(--ink)',
  fontFamily: 'var(--font-sans)',
}

const saveBtn: React.CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  padding: '4px 10px',
  borderRadius: 999,
  border: '1px solid var(--accent-ink)',
  background: 'var(--accent-ink)',
  color: 'var(--paper)',
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  fontWeight: 500,
}
