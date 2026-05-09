'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface ShareButtonProps {
  recipeId: string
  shareToken: string | null
}

export function ShareButton({ recipeId, shareToken }: ShareButtonProps) {
  const [token, setToken] = useState(shareToken)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function getOrCreateToken() {
    if (token) return token
    setLoading(true)
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setToken(data.token)
      return data.token as string
    } catch {
      toast.error('Failed to generate share link')
      return null
    } finally {
      setLoading(false)
    }
  }

  async function handleShare() {
    const t = await getOrCreateToken()
    if (!t) return

    const url = `${window.location.origin}/share/${t}`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Recipe', url })
        return
      } catch {
        // Fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="icon" onClick={handleShare} disabled={loading}>
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
    </Button>
  )
}
