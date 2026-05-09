'use client'

import { useEffect, useState } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  async function handleConfirm() {
    setBusy(true)
    try {
      await onConfirm()
    } finally {
      setBusy(false)
    }
  }

  const accentBg = destructive ? '#7d3f2f' : 'var(--accent-ink)'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(35,29,24,.45)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--rule)',
          borderRadius: 10,
          boxShadow: 'var(--shadow-card)',
          maxWidth: 420,
          width: '100%',
          padding: '24px 26px 22px',
          position: 'relative',
        }}
      >
        <span
          className="paper-tape"
          style={{ top: -10, left: 28, transform: 'rotate(-3deg)' }}
        />
        <div
          style={{
            fontSize: 11,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          {destructive ? 'Heads up' : 'A moment'}
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontWeight: 500,
            fontSize: 26,
            margin: '4px 0 10px',
            color: 'var(--ink)',
            lineHeight: 1.15,
          }}
        >
          {title}
        </h2>
        {message && (
          <p
            style={{
              margin: '0 0 18px',
              color: 'var(--ink-soft)',
              fontSize: 14.5,
              lineHeight: 1.5,
            }}
          >
            {message}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: message ? 0 : 18,
          }}
        >
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              all: 'unset',
              cursor: busy ? 'not-allowed' : 'pointer',
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
              opacity: busy ? 0.5 : 1,
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={busy}
            style={{
              all: 'unset',
              cursor: busy ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 16px',
              borderRadius: 999,
              border: `1px solid ${accentBg}`,
              background: accentBg,
              color: 'var(--paper)',
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 500,
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
