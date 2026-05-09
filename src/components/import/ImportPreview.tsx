'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { RecipeForm } from '@/components/recipe/RecipeForm'
import type { ParsedRecipe } from '@/types'

interface ImportPreviewProps {
  parsed: ParsedRecipe
  sourceType: 'url' | 'paste'
  sourceUrl?: string
  onBack: () => void
}

export function ImportPreview({ parsed, sourceType, sourceUrl, onBack }: ImportPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div>
          <p className="font-semibold">Review &amp; Edit</p>
          <p className="text-sm text-muted-foreground">
            AI extracted this recipe — review before saving.
          </p>
        </div>
      </div>
      <RecipeForm parsed={parsed} sourceType={sourceType} sourceUrl={sourceUrl} />
    </div>
  )
}
