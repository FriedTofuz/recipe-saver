import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { Clock, Users, ChefHat } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Recipe } from '@/types'

interface SharePageProps {
  params: { token: string }
}

export default async function SharePage({ params }: SharePageProps) {
  // Use service role to bypass RLS for public share lookups
  const supabase = createServiceClient()

  const { data: recipe } = await supabase
    .from('recipes')
    .select('*, ingredients(*), steps(*)')
    .eq('share_token', params.token)
    .not('share_token', 'is', null)
    .order('sort_order', { foreignTable: 'ingredients', ascending: true })
    .order('step_number', { foreignTable: 'steps', ascending: true })
    .single()

  if (!recipe) notFound()

  const r = recipe as Recipe
  const totalTime = (r.prep_time_mins ?? 0) + (r.cook_time_mins ?? 0)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b py-3 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">My Recipes</span>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link href="/login">Sign in</Link>
        </Button>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
        {r.cover_image && (
          <div className="relative aspect-[16/7] rounded-xl overflow-hidden">
            <Image src={r.cover_image} alt={r.title} fill className="object-cover" priority />
          </div>
        )}

        <div className="space-y-3">
          <h1 className="text-3xl font-bold">{r.title}</h1>
          {r.description && <p className="text-muted-foreground">{r.description}</p>}

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {r.prep_time_mins && <span><Clock className="h-4 w-4 inline mr-1" />Prep: {r.prep_time_mins}m</span>}
            {r.cook_time_mins && <span><Clock className="h-4 w-4 inline mr-1" />Cook: {r.cook_time_mins}m</span>}
            {totalTime > 0 && <span>Total: {totalTime}m</span>}
            <span><Users className="h-4 w-4 inline mr-1" />{r.servings} servings</span>
          </div>

          {r.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {r.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div>
          <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
          <ul className="space-y-1.5">
            {(r.ingredients ?? []).map((ing) => (
              <li key={ing.id} className="flex gap-2 text-sm">
                <span className="font-medium w-14 text-right shrink-0">
                  {ing.quantity ?? ''}
                </span>
                <span className="text-muted-foreground w-14 shrink-0">{ing.unit ?? ''}</span>
                <span>{ing.name}{ing.notes && <span className="text-muted-foreground">, {ing.notes}</span>}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        <div>
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="space-y-4">
            {(r.steps ?? []).map((step) => (
              <li key={step.id} className="flex gap-4">
                <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center font-semibold">
                  {step.step_number}
                </span>
                <p className="pt-0.5 leading-relaxed">{step.instruction}</p>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  )
}
