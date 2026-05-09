'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteGroceryList } from '@/actions/grocery'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function DeleteGroceryListButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    if (!confirm('Delete this grocery list?')) return
    startTransition(async () => {
      try {
        await deleteGroceryList(id)
        router.refresh()
      } catch {
        toast.error('Failed to delete list')
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDelete}
      disabled={isPending}
      className="text-muted-foreground hover:text-destructive shrink-0"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
