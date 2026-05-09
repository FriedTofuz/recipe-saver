'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus } from 'lucide-react'
import { createGroceryList, addItemsToGroceryList } from '@/actions/grocery'
import { toast } from 'sonner'

interface NewGroceryListButtonProps {
  recipes: Array<{ id: string; title: string }>
  preselectedIds?: string[]
}

export function NewGroceryListButton({ recipes, preselectedIds = [] }: NewGroceryListButtonProps) {
  const [open, setOpen] = useState(preselectedIds.length > 0)
  const [name, setName] = useState('')
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set(preselectedIds))
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function toggleRecipe(id: string) {
    setSelectedRecipes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleCreate() {
    if (!name.trim()) return
    startTransition(async () => {
      try {
        const list = await createGroceryList(name.trim())

        if (selectedRecipes.size > 0) {
          const res = await fetch('/api/grocery/merge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipeIds: Array.from(selectedRecipes) }),
          })
          const data = await res.json()
          if (res.ok && data.items) {
            await addItemsToGroceryList(list.id, data.items)
          }
        }

        toast.success('Grocery list created')
        setOpen(false)
        router.push(`/grocery-lists/${list.id}`)
      } catch {
        toast.error('Failed to create grocery list')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          New List
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Grocery List</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>List name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Weekly shop…"
            />
          </div>

          {recipes.length > 0 && (
            <div className="space-y-2">
              <Label>Generate from recipes (optional)</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                {recipes.map((r) => (
                  <div key={r.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`r-${r.id}`}
                      checked={selectedRecipes.has(r.id)}
                      onCheckedChange={() => toggleRecipe(r.id)}
                    />
                    <Label htmlFor={`r-${r.id}`} className="cursor-pointer font-normal text-sm">
                      {r.title}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleCreate} disabled={isPending || !name.trim()} className="w-full">
            {isPending ? 'Creating…' : 'Create list'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
