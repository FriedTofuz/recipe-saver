import React from 'react'

// ── Seeded PRNG for stable shapes across renders ──────────────────────────────
function seeded(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return () => {
    h += 0x6d2b79f5
    let t = h
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Blob hue types ────────────────────────────────────────────────────────────
const BLOB_PALETTE = {
  tomato:  ['#d97c5b', '#b65030', '#7a3014'],
  mustard: ['#d8b259', '#a8842a', '#704f10'],
  sage:    ['#a4b076', '#7a8a52', '#4f5b30'],
  plum:    ['#a06585', '#74445b', '#42233a'],
  cream:   ['#e9d9b9', '#c8b18a', '#8a7250'],
  ink:     ['#675a4a', '#3e3528', '#231d18'],
} as const

export type BlobHue = keyof typeof BLOB_PALETTE

// ── WatercolorBlob ─────────────────────────────────────────────────────────────
export function WatercolorBlob({
  id = 'b1',
  hue = 'tomato',
  size = 44,
  style,
}: {
  id?: string
  hue?: BlobHue
  size?: number
  style?: React.CSSProperties
}) {
  const palette = BLOB_PALETTE[hue] ?? BLOB_PALETTE.tomato
  const r = seeded(id)

  const cx = 50, cy = 50
  const pts = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * Math.PI * 2
    const rr = 28 + r() * 14
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr] as [number, number]
  })

  const path = pts
    .map((p, i, arr) => {
      const next = arr[(i + 1) % arr.length]
      const prev = arr[(i - 1 + arr.length) % arr.length]
      const cp1x = p[0] + (next[0] - prev[0]) * 0.15
      const cp1y = p[1] + (next[1] - prev[1]) * 0.15
      return (
        (i === 0 ? `M${p[0].toFixed(1)} ${p[1].toFixed(1)} ` : '') +
        `Q${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${next[0].toFixed(1)} ${next[1].toFixed(1)} `
      )
    })
    .join('') + 'Z'

  const fid = `wc-${id}`
  const seed1 = Math.floor(r() * 100)
  const seed2 = Math.floor(r() * 100)

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={style} aria-hidden>
      <defs>
        <radialGradient id={`${fid}-g`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor={palette[0]} stopOpacity="0.85" />
          <stop offset="55%" stopColor={palette[1]} stopOpacity="0.65" />
          <stop offset="100%" stopColor={palette[2]} stopOpacity="0.85" />
        </radialGradient>
        <filter id={`${fid}-tx`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves={2} seed={seed1} />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .35 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <filter id={`${fid}-edge`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={seed2} />
          <feDisplacementMap in="SourceGraphic" scale={6} />
        </filter>
      </defs>
      <g filter={`url(#${fid}-edge)`}>
        <path d={path} fill={`url(#${fid}-g)`} />
        <path
          d={path}
          fill={palette[1]}
          opacity=".25"
          transform="translate(2,2) scale(.95)"
          style={{ transformOrigin: '50% 50%' }}
        />
      </g>
      <rect x="0" y="0" width="100" height="100" fill="transparent" filter={`url(#${fid}-tx)`} />
    </svg>
  )
}

// ── InkDoodle ─────────────────────────────────────────────────────────────────
export type DoodleKind = 'leaf' | 'fork' | 'sprig' | 'whisk' | 'tomato' | 'cup' | 'book' | 'star'

const doodlePaths: Record<DoodleKind, React.ReactNode> = {
  leaf: (
    <path
      d="M3 17 C 6 8, 14 5, 21 5 C 17 11, 12 16, 3 19 M5 14 C 9 12, 14 10, 18 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  ),
  fork: (
    <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M6 4 V 11 M9 4 V 11 M12 4 V 11" />
      <path d="M9 11 V 21" />
    </g>
  ),
  sprig: (
    <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M12 22 C 11 16, 11 10, 12 4" />
      <path d="M12 8 C 14 7, 16 6, 18 4 M12 12 C 9 11, 7 10, 5 8 M12 16 C 14 15, 16 14, 18 12" />
    </g>
  ),
  whisk: (
    <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M12 2 V 11" />
      <path d="M9 12 C 9 18, 15 18, 15 12 Q 12 9, 9 12 Z" />
      <path d="M11 12 V 18 M13 12 V 18" />
    </g>
  ),
  tomato: (
    <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <circle cx="12" cy="14" r="7" />
      <path d="M9 8 L12 5 L15 8 M12 5 V 7" />
    </g>
  ),
  cup: (
    <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M5 8 H 17 V 14 C 17 17, 14 19, 11 19 C 8 19, 5 17, 5 14 Z" />
      <path d="M17 10 C 20 10, 21 12, 21 14 C 21 16, 19 17, 17 17" />
      <path d="M8 5 C 9 6, 8 7, 9 8 M11 4 C 12 5, 11 6, 12 8" />
    </g>
  ),
  book: (
    <g fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M4 4 h16 v16 h-16 Z" />
      <path d="M12 4 v16" />
      <path d="M8 9 h3 M8 13 h3 M13 9 h3 M13 13 h3" />
    </g>
  ),
  star: (
    <path
      d="M12 4 L13.6 9.5 L19 9.7 L14.7 13.2 L16.3 18.5 L12 15.4 L7.7 18.5 L9.3 13.2 L5 9.7 L10.4 9.5 Z"
      fill="currentColor"
      stroke="none"
    />
  ),
}

export function InkDoodle({
  kind = 'leaf',
  size = 22,
  color = 'currentColor',
  style,
}: {
  kind?: DoodleKind
  size?: number
  color?: string
  style?: React.CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ color, flexShrink: 0, ...style }}
      aria-hidden
    >
      {doodlePaths[kind]}
    </svg>
  )
}

// ── WavyRule ──────────────────────────────────────────────────────────────────
export function WavyRule({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 800 14"
      preserveAspectRatio="none"
      style={{ width: '100%', height: 14, display: 'block', color: 'var(--rule)', ...style }}
      aria-hidden
    >
      <path
        d="M2 7 Q 50 1 100 7 T 200 7 T 300 7 T 400 7 T 500 7 T 600 7 T 700 7 T 798 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  )
}

// ── HandStars ─────────────────────────────────────────────────────────────────
export function HandStars({ rating = 4.5, size = 14 }: { rating?: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2, color: 'var(--accent-ink)' }}>
      {Array.from({ length: 5 }, (_, i) => {
        const pct = Math.max(0, Math.min(1, rating - i))
        return (
          <span
            key={i}
            style={{ position: 'relative', display: 'inline-block', width: size + 1, height: size }}
          >
            <svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', inset: 0 }}>
              <path
                d="M12 3 L13.8 9.2 L20 9.6 L15.2 13.4 L17 19.6 L12 16 L7 19.6 L8.8 13.4 L4 9.6 L10.2 9.2 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                width: `${pct * 100}%`,
              }}
            >
              <svg width={size} height={size} viewBox="0 0 24 24">
                <path
                  d="M12 3 L13.8 9.2 L20 9.6 L15.2 13.4 L17 19.6 L12 16 L7 19.6 L8.8 13.4 L4 9.6 L10.2 9.2 Z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </span>
        )
      })}
    </span>
  )
}

// ── CoverWash ─────────────────────────────────────────────────────────────────
// Typographic recipe cover placeholder. Shows a color-blocked background with
// title text. Replaced by actual image when recipe.cover_image exists.
const COVER_TONES: Record<string, [string, string]> = {
  tomato:  ['#e7c8b3', '#b6562a'],
  mustard: ['#e8d8a6', '#9a7a2a'],
  sage:    ['#cfd6b6', '#6f7a4a'],
  plum:    ['#d6c1cb', '#7d3f2f'],
}

export function CoverWash({
  title = '',
  cuisine = '',
  time,
  hue = 'tomato',
  compact = false,
}: {
  title?: string
  cuisine?: string
  time?: number
  hue?: string
  compact?: boolean
}) {
  const tone = COVER_TONES[hue] ?? COVER_TONES.tomato

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: `linear-gradient(160deg, ${tone[0]} 0%, ${tone[0]}cc 100%)`,
      }}
    >
      {!compact && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '16px 16px 14px',
            color: tone[1],
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              opacity: 0.75,
              marginBottom: 5,
            }}
          >
            {cuisine || 'recipe'}
            {time ? ` · ${time} min` : ''}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-serif, "EB Garamond", Georgia, serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 20,
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Utilities ─────────────────────────────────────────────────────────────────

const BLOB_HUE_MAP: Record<string, BlobHue> = {
  noodles: 'mustard', meat: 'tomato', egg: 'mustard', cheese: 'mustard',
  oil: 'sage', pepper: 'ink', salt: 'cream', citrus: 'mustard',
  garlic: 'cream', herb: 'sage', dairy: 'cream', broth: 'mustard',
  tofu: 'cream', paste: 'sage', spice: 'tomato', tomato: 'tomato',
  flour: 'cream', sugar: 'cream', chocolate: 'plum', fruit: 'plum',
  vegetable: 'sage',
}

export function blobHue(key: string): BlobHue {
  return BLOB_HUE_MAP[key] ?? 'tomato'
}

// Derives a stable hue from a recipe's ID for CoverWash placeholders
export function recipeHue(id: string): string {
  const hues = ['tomato', 'mustard', 'sage', 'plum']
  const r = seeded(id)
  return hues[Math.floor(r() * hues.length)]
}
