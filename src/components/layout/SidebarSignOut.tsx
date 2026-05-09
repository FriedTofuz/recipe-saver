'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export function SidebarSignOut() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      title="Sign out"
      aria-label="Sign out"
      style={{
        all: 'unset',
        cursor: 'pointer',
        width: 28,
        height: 28,
        borderRadius: 6,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ink-faint)',
        flexShrink: 0,
        transition: 'color .15s, background .15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = 'var(--ink)'
        e.currentTarget.style.background = 'rgba(255,255,255,.45)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = 'var(--ink-faint)'
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <LogOut size={14} />
    </button>
  )
}
