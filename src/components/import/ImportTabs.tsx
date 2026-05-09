'use client'

import { useState } from 'react'
import { UrlImportForm } from './UrlImportForm'
import { TextPasteForm } from './TextPasteForm'
import { RecipeForm } from '@/components/recipe/RecipeForm'
import { ImportPreview } from './ImportPreview'
import { InkDoodle, type DoodleKind } from '@/components/paper'
import type { ParsedRecipe } from '@/types'

type Mode = 'url' | 'paste' | 'manual'
type ImportStep = 'input' | 'preview'

const MODES: Array<{ id: Mode; label: string; doodle: DoodleKind }> = [
  { id: 'url', label: 'Paste a link', doodle: 'cup' },
  { id: 'paste', label: 'Paste text', doodle: 'sprig' },
  { id: 'manual', label: 'Write it down', doodle: 'whisk' },
]

export function ImportTabs() {
  const [parsed, setParsed] = useState<ParsedRecipe | null>(null)
  const [sourceType, setSourceType] = useState<Mode>('url')
  const [sourceUrl, setSourceUrl] = useState<string>('')
  const [step, setStep] = useState<ImportStep>('input')

  function handleParsed(data: ParsedRecipe, type: 'url' | 'paste', url?: string) {
    setParsed(data)
    setSourceType(type)
    if (url) setSourceUrl(url)
    setStep('preview')
  }

  if (step === 'preview' && parsed) {
    return (
      <ImportPreview
        parsed={parsed}
        sourceType={sourceType as 'url' | 'paste'}
        sourceUrl={sourceUrl}
        onBack={() => {
          setStep('input')
          setParsed(null)
        }}
      />
    )
  }

  return (
    <div>
      {/* Mode tabs */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 18,
          flexWrap: 'wrap',
        }}
      >
        {MODES.map((m) => {
          const active = sourceType === m.id
          return (
            <button
              key={m.id}
              onClick={() => setSourceType(m.id)}
              style={{
                all: 'unset',
                cursor: 'pointer',
                padding: '12px 18px',
                borderRadius: 12,
                border: '1px solid ' + (active ? 'var(--ink)' : 'var(--rule)'),
                background: active ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                color: 'var(--ink)',
                transition: 'all .15s',
              }}
            >
              <InkDoodle
                kind={m.doodle}
                size={20}
                color={active ? 'var(--accent-ink)' : 'var(--ink-soft)'}
              />
              <span style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: 18 }}>
                {m.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Input panel */}
      <div
        style={{
          background: 'rgba(255,255,255,.5)',
          border: '1px solid var(--rule)',
          borderRadius: 12,
          padding: '22px 24px',
          minHeight: 340,
        }}
      >
        {sourceType === 'url' && (
          <UrlImportForm onParsed={(data, url) => handleParsed(data, 'url', url)} />
        )}
        {sourceType === 'paste' && (
          <TextPasteForm onParsed={(data) => handleParsed(data, 'paste')} />
        )}
        {sourceType === 'manual' && <RecipeForm sourceType="manual" />}
      </div>
    </div>
  )
}
