'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Link2 } from 'lucide-react'
import type { ParsedRecipe } from '@/types'

interface UrlImportFormProps {
  onParsed: (data: ParsedRecipe, url: string) => void
}

export function UrlImportForm({ onParsed }: UrlImportFormProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleImport() {
    if (!url.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/import/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      onParsed(data, url.trim())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="url">Recipe URL</Label>
        <p className="text-sm text-muted-foreground">
          Paste a link from any recipe website. Instagram links are not supported — use the &quot;Paste Text&quot; tab instead.
        </p>
        <div className="flex gap-2">
          <Input
            id="url"
            type="url"
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleImport()}
          />
          <Button onClick={handleImport} disabled={loading || !url.trim()}>
            {loading ? 'Importing…' : (
              <>
                <Link2 className="h-4 w-4 mr-1" />
                Import
              </>
            )}
          </Button>
        </div>
      </div>
      {loading && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Fetching page and parsing with AI… this may take 10–15 seconds.
        </p>
      )}
    </div>
  )
}
