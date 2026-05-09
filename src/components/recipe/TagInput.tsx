'use client'

import { useState, KeyboardEvent } from 'react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ tags, onChange, placeholder = 'Press enter to add a tag…' }: TagInputProps) {
  const [input, setInput] = useState('')

  function addTag(value: string) {
    const trimmed = value.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      onChange([...tags, trimmed])
    }
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
        padding: '6px 8px',
        borderRadius: 10,
        border: '1px solid var(--rule)',
        background: 'rgba(255,255,255,.5)',
        minHeight: 40,
      }}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 4px 3px 10px',
            borderRadius: 999,
            border: '1px solid var(--rule)',
            background: 'var(--paper)',
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            color: 'var(--ink-soft)',
            letterSpacing: '.04em',
            textTransform: 'uppercase',
          }}
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            aria-label={`Remove ${tag}`}
            style={{
              all: 'unset',
              cursor: 'pointer',
              width: 18,
              height: 18,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              color: 'var(--ink-faint)',
              fontSize: 14,
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(125,63,47,.12)'
              e.currentTarget.style.color = '#7d3f2f'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--ink-faint)'
            }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
        style={{
          all: 'unset',
          flex: 1,
          minWidth: 140,
          padding: '4px 6px',
          fontSize: 13,
          color: 'var(--ink)',
          fontFamily: 'var(--font-sans)',
        }}
      />
    </div>
  )
}
