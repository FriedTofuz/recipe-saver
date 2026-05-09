'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { BookOpen } from 'lucide-react'
import { setRecipeCookbooks } from '@/actions/cookbook'
import { toast } from 'sonner'
import type { Cookbook } from '@/types'

interface AddToCookbookDialogProps {
  recipeId: string
  cookbooks: Cookbook[]
  selectedIds: string[]
}

export function AddToCookbookDialog({
  recipeId,
  cookbooks,
  selectedIds,
}: AddToCookbookDialogProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds))
  const [saving, setSaving] = useState(false)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSave() {
    setSaving(true)
    try {
      await setRecipeCookbooks(recipeId, Array.from(selected))
      toast.success('Cookbooks updated')
      setOpen(false)
    } catch {
      toast.error('Failed to update cookbooks')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BookOpen className="h-4 w-4 mr-1" />
          Add to Cookbook
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to Cookbook</DialogTitle>
        </DialogHeader>
        {cookbooks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No cookbooks yet. Create one from the sidebar.
          </p>
        ) : (
          <div className="space-y-3 py-2">
            {cookbooks.map((cb) => (
              <div key={cb.id} className="flex items-center gap-3">
                <Checkbox
                  id={cb.id}
                  checked={selected.has(cb.id)}
                  onCheckedChange={() => toggle(cb.id)}
                />
                <Label htmlFor={cb.id} className="cursor-pointer">
                  {cb.name}
                </Label>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
