'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { CookbookCard } from '@/components/cookbook/CookbookCard'
import { WavyRule, InkDoodle } from '@/components/paper'
import { createClient } from '@/lib/supabase/client'
import { createCookbook } from '@/actions/cookbook'
import { toast } from 'sonner'
import useSWR from 'swr'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { Cookbook } from '@/types'

export default function CookbooksPage() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()

  const supabase = createClient()
  const { data, mutate } = useSWR('cookbooks-with-counts', async () => {
    const [{ data: books }, { data: links }] = await Promise.all([
      supabase.from('cookbooks').select('*').order('name'),
      supabase.from('recipe_cookbooks').select('cookbook_id'),
    ])
    const counts = new Map<string, number>()
    for (const l of links ?? []) {
      counts.set(l.cookbook_id, (counts.get(l.cookbook_id) ?? 0) + 1)
    }
    return {
      cookbooks: (books ?? []) as Cookbook[],
      counts,
    }
  })

  function handleCreate() {
    if (!name.trim()) return
    startTransition(async () => {
      try {
        await createCookbook(name.trim())
        setName('')
        setOpen(false)
        mutate()
        toast.success('Cookbook created')
      } catch {
        toast.error('Failed to create cookbook')
      }
    })
  }

  const cookbooks = data?.cookbooks ?? []
  const counts = data?.counts ?? new Map<string, number>()

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
      {/* Page header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 24,
          marginBottom: 18,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
            }}
          >
            Volume I · Spring
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif, Georgia, serif)',
              fontWeight: 500,
              fontSize: 56,
              lineHeight: 1,
              margin: '6px 0 0',
              color: 'var(--ink)',
            }}
          >
            Your <em style={{ fontStyle: 'italic' }}>cookbooks</em>
          </h1>
          <p
            style={{
              margin: '10px 0 0',
              color: 'var(--ink-soft)',
              maxWidth: 520,
              fontSize: 15,
              lineHeight: 1.5,
            }}
          >
            A pantry of recipes — pulled from blogs, scribbled from memory, handed down. Tap a
            cookbook to read its recipes.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button
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
                flexShrink: 0,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              New cookbook
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Create cookbook</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="Quick Weeknights…"
                />
              </div>
              <Button onClick={handleCreate} disabled={isPending || !name.trim()} className="w-full">
                {isPending ? 'Creating…' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <WavyRule style={{ margin: '22px 0 28px' }} />

      {/* Cookbook spines row */}
      <section>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          Cookbooks
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontWeight: 500,
            fontSize: 28,
            lineHeight: 1.1,
            margin: '4px 0 14px',
            color: 'var(--ink)',
          }}
        >
          Open one
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 18,
            marginTop: 14,
          }}
        >
          <NewCookbookCard onClick={() => setOpen(true)} />
          {cookbooks.map((cb, i) => (
            <CookbookCard
              key={cb.id}
              cookbook={cb}
              index={i}
              recipeCount={counts.get(cb.id) ?? 0}
            />
          ))}
        </div>

        {cookbooks.length === 0 && (
          <div
            style={{
              marginTop: 28,
              padding: '40px 24px',
              borderRadius: 14,
              border: '1.5px dashed var(--rule)',
              textAlign: 'center',
              color: 'var(--ink-soft)',
              background: 'rgba(255,255,255,.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <InkDoodle kind="book" size={48} color="var(--ink-faint)" />
            </div>
            <div
              style={{
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontSize: 22,
                color: 'var(--ink)',
              }}
            >
              No cookbooks yet.
            </div>
            <p style={{ margin: '8px auto 0', maxWidth: 380, fontSize: 14, lineHeight: 1.5 }}>
              Group recipes by mood, by season, or by who&apos;s coming to dinner.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

function NewCookbookCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lift"
      style={{
        all: 'unset',
        cursor: 'pointer',
        aspectRatio: '4/5',
        border: '1.5px dashed var(--rule)',
        borderRadius: 10,
        padding: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 10,
        color: 'var(--ink-soft)',
        background: 'transparent',
        textAlign: 'center',
      }}
    >
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '1.5px solid var(--ink-soft)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontFamily: 'var(--font-serif, Georgia, serif)',
        }}
      >
        +
      </span>
      <div style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontSize: 18, fontStyle: 'italic' }}>
        New cookbook
      </div>
      <div style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '.06em' }}>
        Group recipes by mood
      </div>
    </button>
  )
}
