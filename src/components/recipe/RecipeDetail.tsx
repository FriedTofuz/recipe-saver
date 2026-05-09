'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Edit, Trash2 } from 'lucide-react'
import { ServingScaler } from './ServingScaler'
import { CookingMode } from './CookingMode'
import { ShareButton } from '@/components/share/ShareButton'
import { deleteRecipe } from '@/actions/recipe'
import { toast } from 'sonner'
import { WavyRule, InkDoodle, CoverWash, recipeHue } from '@/components/paper'
import type { Recipe } from '@/types'

interface RecipeDetailProps {
  recipe: Recipe
}

type Units = 'us' | 'metric'

export function RecipeDetail({ recipe }: RecipeDetailProps) {
  const [cookingMode, setCookingMode] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [units, setUnits] = useState<Units>('us')

  const totalTime = (recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0)
  const hue = recipeHue(recipe.id)
  const tools = recipe.tools ?? []

  async function handleDelete() {
    if (!confirm('Delete this recipe?')) return
    setDeleting(true)
    try {
      await deleteRecipe(recipe.id)
    } catch {
      toast.error('Failed to delete recipe')
      setDeleting(false)
    }
  }

  if (cookingMode && recipe.steps && recipe.ingredients) {
    return (
      <CookingMode
        steps={recipe.steps}
        ingredients={recipe.ingredients}
        title={recipe.title}
        onClose={() => setCookingMode(false)}
      />
    )
  }

  return (
    <div style={{ maxWidth: 1100, padding: '4px 0 40px' }}>
      {/* Back link */}
      <Link
        href="/dashboard"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 0',
          marginBottom: 14,
          color: 'var(--ink-soft)',
          fontSize: 13,
          fontFamily: 'var(--font-sans)',
          textDecoration: 'none',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Back to recipes
      </Link>

      {/* Cover + title block */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr',
          gap: 36,
          alignItems: 'start',
          marginBottom: 0,
        }}
      >
        {/* Cover */}
        <div
          style={{
            aspectRatio: '4/3',
            borderRadius: 12,
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {recipe.cover_image ? (
            <Image
              src={recipe.cover_image}
              alt={recipe.title}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <CoverWash
              title={recipe.title}
              cuisine={recipe.cuisine ?? ''}
              time={totalTime > 0 ? totalTime : undefined}
              hue={hue}
            />
          )}
        </div>

        {/* Title / meta */}
        <div style={{ paddingTop: 4 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              marginBottom: 6,
            }}
          >
            {[recipe.cuisine, recipe.tags[0]].filter(Boolean).join(' · ')}
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif, Georgia, serif)',
              fontSize: 48,
              fontWeight: 500,
              lineHeight: 1.02,
              margin: '0 0 12px',
              color: 'var(--ink)',
            }}
          >
            {recipe.title}
          </h1>

          {recipe.description && (
            <p
              style={{
                color: 'var(--ink-soft)',
                fontSize: 15.5,
                lineHeight: 1.55,
                margin: '0 0 18px',
              }}
            >
              {recipe.description}
            </p>
          )}

          {/* Meta strip */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 22,
              paddingTop: 14,
              borderTop: '1px solid var(--rule)',
              marginBottom: 14,
            }}
          >
            {recipe.prep_time_mins ? <MetaItem label="Prep" value={`${recipe.prep_time_mins} min`} /> : null}
            {recipe.cook_time_mins ? <MetaItem label="Cook" value={`${recipe.cook_time_mins} min`} /> : null}
            {totalTime > 0 ? <MetaItem label="Total" value={`${totalTime} min`} /> : null}
            <MetaItem label="Serves" value={String(recipe.servings)} />
          </div>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 22 }}>
              {recipe.tags.map((tag) => (
                <span key={tag} className="paper-chip">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setCookingMode(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 999,
                border: '1px solid var(--accent-ink)',
                background: 'var(--accent-ink)',
                color: 'var(--paper)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <InkDoodle kind="whisk" size={16} color="currentColor" />
              Start Cooking
            </button>

            <ShareButton recipeId={recipe.id} shareToken={recipe.share_token} />

            <Link
              href={`/recipes/${recipe.id}/edit`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 999,
                border: '1px solid var(--ink)',
                background: 'transparent',
                color: 'var(--ink)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              <Edit size={14} />
              Edit
            </Link>

            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 999,
                border: '1px solid var(--rule)',
                background: 'transparent',
                color: 'var(--ink-faint)',
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                opacity: deleting ? 0.5 : 1,
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>

          {recipe.source_url && (
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                marginTop: 12,
                fontSize: 11,
                color: 'var(--ink-faint)',
                textDecoration: 'underline',
              }}
            >
              Source
            </a>
          )}
        </div>
      </div>

      <WavyRule style={{ margin: '36px 0 28px' }} />

      {/* Two-column body */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 1fr) 1.6fr',
          gap: 48,
        }}
      >
        {/* ── Ingredients column (sticky) ── */}
        <section style={{ position: 'sticky', top: 20, alignSelf: 'start' }}>
          <SectionTitle
            kicker="What you need"
            title="Ingredients"
            right={<UnitsToggle value={units} onChange={setUnits} />}
          />

          {recipe.ingredients && recipe.ingredients.length > 0 ? (
            <ServingScaler
              baseServings={recipe.servings}
              ingredients={recipe.ingredients}
              calories={recipe.calories}
              protein_g={recipe.protein_g}
              carbs_g={recipe.carbs_g}
              fat_g={recipe.fat_g}
              units={units}
            />
          ) : (
            <p style={{ color: 'var(--ink-faint)', fontSize: 13 }}>No ingredients listed.</p>
          )}

          {/* Tools section */}
          <ToolsSection tools={tools} />
        </section>

        {/* ── Instructions column ── */}
        <section>
          <SectionTitle kicker="How it goes" title="Instructions" />

          {recipe.steps && recipe.steps.length > 0 ? (
            <ol style={{ listStyle: 'none', padding: 0, margin: '22px 0 0', display: 'flex', flexDirection: 'column', gap: 22 }}>
              {recipe.steps.map((step) => (
                <li
                  key={step.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '56px 1fr',
                    gap: 16,
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Step number */}
                  <div style={{ position: 'relative', paddingTop: 2 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-serif, Georgia, serif)',
                        fontStyle: 'italic',
                        fontSize: 46,
                        fontWeight: 400,
                        lineHeight: 1,
                        color: 'var(--accent-ink)',
                        display: 'inline-block',
                      }}
                    >
                      {step.step_number}
                    </span>
                    <span style={{ position: 'absolute', left: 0, right: 0, bottom: -4, height: 8, color: 'var(--accent-ink)' }}>
                      <svg width="100%" height="6" viewBox="0 0 60 6" preserveAspectRatio="none">
                        <path d="M2 3 Q 18 0 30 3 T 58 3" stroke="currentColor" strokeWidth="1.2" fill="none" />
                      </svg>
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      paddingTop: 8,
                      fontSize: 16,
                      lineHeight: 1.65,
                      color: 'var(--ink)',
                    }}
                  >
                    {step.instruction}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p style={{ color: 'var(--ink-faint)', fontSize: 13, marginTop: 22 }}>No steps listed.</p>
          )}

          {/* Notes section */}
          <NotesSection sourceUrl={recipe.source_url} />
        </section>
      </div>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-faint)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-serif, Georgia, serif)',
          fontSize: 18,
          fontWeight: 500,
          color: 'var(--ink)',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function SectionTitle({
  kicker,
  title,
  right,
}: {
  kicker: string
  title: string
  right?: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 8,
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
          {kicker}
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontWeight: 500,
            fontSize: 30,
            margin: '4px 0 0',
            lineHeight: 1,
            color: 'var(--ink)',
          }}
        >
          {title}
        </h2>
      </div>
      {right}
    </div>
  )
}

function UnitsToggle({ value, onChange }: { value: Units; onChange: (u: Units) => void }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        border: '1px solid var(--rule)',
        borderRadius: 999,
        padding: 2,
        background: 'rgba(255,255,255,.5)',
      }}
    >
      {(['us', 'metric'] as const).map((k) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: '4px 12px',
            borderRadius: 999,
            fontSize: 11,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-sans)',
            background: value === k ? 'var(--ink)' : 'transparent',
            color: value === k ? 'var(--paper)' : 'var(--ink-soft)',
          }}
        >
          {k === 'us' ? 'US' : 'Metric'}
        </button>
      ))}
    </div>
  )
}

function ToolsSection({ tools }: { tools: string[] }) {
  return (
    <div style={{ marginTop: 26, paddingTop: 18, borderTop: '1px dashed var(--rule)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          style={{ color: 'var(--ink-soft)' }}
        >
          <path d="M14.7 6.3a4 4 0 015.6 5.6l-1.4 1.4-5.6-5.6 1.4-1.4z" />
          <path d="M13.3 7.7L4 17v3h3l9.3-9.3" />
        </svg>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          Tools you&apos;ll need
        </div>
      </div>
      {tools.length > 0 ? (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
          }}
        >
          {tools.map((t) => (
            <li
              key={t}
              style={{
                fontSize: 13,
                padding: '5px 10px',
                border: '1px solid var(--rule)',
                borderRadius: 999,
                background: 'rgba(255,255,255,.4)',
                color: 'var(--ink-soft)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {t}
            </li>
          ))}
        </ul>
      ) : (
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: 'var(--ink-faint)',
            fontStyle: 'italic',
          }}
        >
          None listed for this recipe.
        </p>
      )}
    </div>
  )
}

function NotesSection({ sourceUrl }: { sourceUrl: string | null }) {
  return (
    <div style={{ marginTop: 36 }}>
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '.22em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
          }}
        >
          Marginalia
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontWeight: 500,
            fontSize: 30,
            margin: '4px 0 0',
            lineHeight: 1,
            color: 'var(--ink)',
          }}
        >
          Notes
        </h2>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        {sourceUrl && (
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(255,255,255,.55)',
              border: '1px solid var(--rule)',
              borderRadius: 6,
            }}
          >
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                margin: 0,
                fontFamily: 'var(--font-sans)',
                fontSize: 13,
                lineHeight: 1.4,
                color: 'var(--ink)',
                textDecoration: 'none',
                wordBreak: 'break-word',
              }}
            >
              Source: <span style={{ color: 'var(--accent-ink)' }}>{prettyHost(sourceUrl)}</span>
            </a>
          </div>
        )}
        <button
          type="button"
          style={{
            all: 'unset',
            cursor: 'pointer',
            padding: '12px 14px',
            border: '1.5px dashed var(--rule)',
            borderRadius: 6,
            color: 'var(--ink-faint)',
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontStyle: 'italic',
            fontSize: 16,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          + jot a note
        </button>
      </div>
    </div>
  )
}

function prettyHost(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
