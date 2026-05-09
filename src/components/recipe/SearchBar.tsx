'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const q = searchParams.get('q') ?? ''

  const buildQuery = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set('q', value)
      } else {
        params.delete('q')
      }
      return params.toString()
    },
    [searchParams]
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    startTransition(() => {
      router.replace(`${pathname}?${buildQuery(e.target.value)}`)
    })
  }

  function handleClear() {
    startTransition(() => {
      router.replace(`${pathname}?${buildQuery('')}`)
    })
  }

  return (
    <div className="relative">
      {isPending ? (
        <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin pointer-events-none" />
      ) : (
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      )}
      <Input
        placeholder="Search recipes…"
        value={q}
        onChange={handleChange}
        className="pl-9 pr-9"
      />
      {q && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
