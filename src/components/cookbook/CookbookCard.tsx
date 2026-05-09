import Link from 'next/link'
import type { Cookbook } from '@/types'

interface CookbookCardProps {
  cookbook: Cookbook
  recipeCount?: number
  index?: number
}

const SPINE_TONES = [
  'linear-gradient(170deg, #b6562a 0%, #7d3f2f 100%)',  // tomato
  'linear-gradient(170deg, #9a7a2a 0%, #704f10 100%)',  // mustard
  'linear-gradient(170deg, #6f7a4a 0%, #4f5b30 100%)',  // sage
  'linear-gradient(170deg, #7d3f2f 0%, #4a2a22 100%)',  // brick
  'linear-gradient(170deg, #6a4f7a 0%, #42233a 100%)',  // plum
  'linear-gradient(170deg, #2e4a4a 0%, #1c2d2d 100%)',  // teal
]

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

function spineFor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return SPINE_TONES[h % SPINE_TONES.length]
}

export function CookbookCard({ cookbook, recipeCount, index = 0 }: CookbookCardProps) {
  const tone = spineFor(cookbook.id)
  const volume = ROMAN[Math.min(ROMAN.length - 1, index)]

  return (
    <Link href={`/cookbooks/${cookbook.id}`} style={{ textDecoration: 'none' }}>
      <div
        className="lift"
        style={{
          aspectRatio: '4/5',
          borderRadius: 10,
          background: 'rgba(255,255,255,.45)',
          border: '1px solid var(--rule)',
          padding: 14,
          position: 'relative',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* Spine — typographic cookbook cover */}
        <div
          style={{
            flex: 1,
            borderRadius: 6,
            overflow: 'hidden',
            position: 'relative',
            background: tone,
            color: '#f6efe1',
            padding: '18px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow:
              'inset 0 0 0 1px rgba(255,255,255,.12), inset 0 -40px 60px rgba(0,0,0,.18)',
          }}
        >
          <div
            style={{
              fontSize: 9,
              letterSpacing: '.28em',
              textTransform: 'uppercase',
              opacity: 0.75,
            }}
          >
            volume {volume}
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-serif, Georgia, serif)',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 26,
                lineHeight: 1.05,
                letterSpacing: '.005em',
              }}
            >
              {cookbook.name}
            </div>
            <div
              style={{
                marginTop: 14,
                paddingTop: 10,
                borderTop: '1px solid rgba(255,255,255,.28)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                fontSize: 10,
                letterSpacing: '.18em',
                textTransform: 'uppercase',
                opacity: 0.85,
              }}
            >
              <span>
                {recipeCount ?? 0} {recipeCount === 1 ? 'recipe' : 'recipes'}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontStyle: 'italic',
                  letterSpacing: '.02em',
                  textTransform: 'none',
                  fontSize: 13,
                  opacity: 0.9,
                }}
              >
                read →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
