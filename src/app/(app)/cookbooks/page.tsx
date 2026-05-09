'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CookbookCard } from '@/components/cookbook/CookbookCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { createCookbook } from '@/actions/cookbook'
import { toast } from 'sonner'
import useSWR from 'swr'
import type { Cookbook } from '@/types'

export default function CookbooksPage() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const supabase = createClient()
  const { data: cookbooks, mutate } = useSWR('cookbooks', async () => {
    const { data } = await supabase.from('cookbooks').select('*').order('name')
    return data as Cookbook[]
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cookbooks</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              New Cookbook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Create Cookbook</DialogTitle>
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
      </div>

      {(cookbooks ?? []).length === 0 ? (
        <p className="text-muted-foreground text-sm">No cookbooks yet. Create one to get started.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(cookbooks ?? []).map((cb) => (
            <CookbookCard key={cb.id} cookbook={cb} />
          ))}
        </div>
      )}
    </div>
  )
}
