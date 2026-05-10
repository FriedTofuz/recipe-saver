'use client'

import { useState } from 'react'

interface AddItemFormProps {
  onAdd: (input: {
    name: string
    quantity: string | null
    unit: string | null
  }) => void | Promise<void>
}

export function AddItemForm({ onAdd }: AddItemFormProps) {
  const [qty, setQty] = useState('')
  const [unit, setUnit] = useState('')
  const [name, setName] = useState('')

  const submit = async () => {
    const trimmedName = name.trim()
    if (!trimmedName) return
    await onAdd({
      name: trimmedName,
      quantity: qty.trim() || null,
      unit: unit.trim() || null,
    })
    setQty('')
    setUnit('')
    setName('')
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      void submit()
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '70px 90px 1fr auto',
        gap: 8,
        alignItems: 'center',
        padding: '10px 12px',
        borderRadius: 8,
        background: 'rgba(255,255,255,.7)',
        border: '1px dashed var(--rule)',
      }}
    >
      <input
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        onKeyDown={onKey}
        placeholder="Qty"
        style={inputStyle}
        aria-label="Quantity (optional)"
      />
      <input
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        onKeyDown={onKey}
        placeholder="Unit"
        style={inputStyle}
        aria-label="Unit (optional)"
      />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={onKey}
        placeholder="Item name"
        style={inputStyle}
        aria-label="Item name"
      />
      <button
        onClick={submit}
        disabled={!name.trim()}
        style={{
          ...primaryBtn,
          opacity: name.trim() ? 1 : 0.5,
          cursor: name.trim() ? 'pointer' : 'not-allowed',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add
      </button>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  all: 'unset',
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '6px 10px',
  borderRadius: 6,
  background: 'rgba(255,255,255,.65)',
  border: '1px solid var(--rule)',
  fontSize: 14,
  color: 'var(--ink)',
  fontFamily: 'var(--font-sans)',
}

const primaryBtn: React.CSSProperties = {
  all: 'unset',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 999,
  border: '1px solid var(--accent-ink)',
  background: 'var(--accent-ink)',
  color: 'var(--paper)',
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 500,
}
