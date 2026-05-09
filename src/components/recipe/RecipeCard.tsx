'use client'

import Link from 'next/link'
import Image from 'next/image'
import { CoverWash, recipeHue } from '@/components/paper'
import { RecipeCardMenu } from './RecipeCardMenu'
import type { Recipe } from '@/types'

interface RecipeCardProps {
  recipe: Recipe
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = (recipe.prep_time_mins ?? 0) + (recipe.cook_time_mins ?? 0)
  const hue = recipeHue(recipe.id)

  return (
    <div
      className="lift"
      style={{
        background: 'rgba(255,255,255,.55)',
        border: '1px solid var(--rule)',
        borderRadius: 10,
        overflow: 'visible',
        position: 'relative',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      <RecipeCardMenu recipeId={recipe.id} recipeTitle={recipe.title} />
      <Link
        href={`/recipes/${recipe.id}`}
        style={{
          textDecoration: 'none',
          display: 'block',
          color: 'inherit',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {/* Cover image or typographic placeholder */}
        <div style={{ aspectRatio: '5/4', position: 'relative', overflow: 'hidden' }}>
          {recipe.cover_image ? (
            <Image
              src={recipe.cover_image}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <CoverWash
              title={recipe.title}
              cuisine={recipe.cuisine ?? ''}
              time={totalTime > 0 ? totalTime : undefined}
              hue={hue}
            />
          )}

          {/* Overlay badges */}
          <div
            style={{
              position: 'absolute',
              left: 10,
              bottom: 8,
              right: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {recipe.cuisine && (
              <span className="paper-chip" style={{ background: 'rgba(246,239,225,.85)' }}>
                {recipe.cuisine}
              </span>
            )}
            {totalTime > 0 && (
              <span
                style={{
                  fontFamily: 'var(--font-serif, Georgia, serif)',
                  fontSize: 18,
                  color: recipe.cover_image ? 'white' : 'inherit',
                  textShadow: recipe.cover_image ? '0 1px 2px rgba(0,0,0,.35)' : 'none',
                  lineHeight: 1,
                }}
              >
                {totalTime}
                <span style={{ fontSize: 12 }}>m</span>
              </span>
            )}
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding: '14px 16px 16px' }}>
          <h3
            style={{
              fontFamily: 'var(--font-serif, Georgia, serif)',
              fontWeight: 500,
              fontSize: 18,
              lineHeight: 1.2,
              margin: '0 0 6px',
              color: 'var(--ink)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {recipe.title}
          </h3>

          {recipe.description && (
            <p
              style={{
                margin: '0 0 10px',
                color: 'var(--ink-soft)',
                fontSize: 13,
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {recipe.description}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {recipe.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="paper-chip">
                  {tag}
                </span>
              ))}
            </div>
            {recipe.servings && (
              <span style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '.04em' }}>
                serves {recipe.servings}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  )
}
