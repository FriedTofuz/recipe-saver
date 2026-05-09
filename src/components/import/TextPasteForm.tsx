'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import type { ParsedRecipe } from '@/types'

interface TextPasteFormProps {
  onParsed: (data: ParsedRecipe) => void
}

export function TextPasteForm({ onParsed }: TextPasteFormProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleParse() {
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/import/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Parsing failed')
      onParsed(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Parsing failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div className="space-y-2">
        <Label htmlFor="text">Recipe Text</Label>
        <p className="text-sm text-muted-foreground">
          Paste text from an Instagram caption, TikTok comment, email, or anywhere else.
        </p>
        <Textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste recipe text here…"
          rows={10}
          className="resize-y"
        />
      </div>
      <Button onClick={handleParse} disabled={loading || !text.trim()}>
        {loading ? 'Parsing…' : (
          <>
            <Sparkles className="h-4 w-4 mr-1" />
            Parse with AI
          </>
        )}
      </Button>
    </div>
  )
}
