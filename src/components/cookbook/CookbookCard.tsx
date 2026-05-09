import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import type { Cookbook } from '@/types'

interface CookbookCardProps {
  cookbook: Cookbook
  recipeCount?: number
}

export function CookbookCard({ cookbook, recipeCount }: CookbookCardProps) {
  return (
    <Link href={`/cookbooks/${cookbook.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{cookbook.name}</p>
            {cookbook.description && (
              <p className="text-sm text-muted-foreground truncate">{cookbook.description}</p>
            )}
            {recipeCount !== undefined && (
              <p className="text-xs text-muted-foreground">{recipeCount} recipes</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
