'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { InkDoodle, type DoodleKind } from '@/components/paper'

interface SidebarLinkProps {
  href: string
  doodle: DoodleKind
  children: React.ReactNode
}

export function SidebarLink({ href, doodle, children }: SidebarLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

  return (
    <Link
      href={href}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,.35)'
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 8,
        fontFamily: 'var(--font-sans, ui-sans-serif)',
        fontSize: 14,
        fontWeight: isActive ? 600 : 500,
        color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
        background: isActive ? 'rgba(255,255,255,.55)' : 'transparent',
        boxShadow: isActive ? 'inset 0 0 0 1px var(--rule)' : 'none',
        position: 'relative',
        textDecoration: 'none',
        transition: 'background .15s, color .15s',
      }}
    >
      <InkDoodle
        kind={doodle}
        size={20}
        color={isActive ? 'var(--accent-ink)' : 'var(--ink-soft)'}
      />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {children}
      </span>
      {isActive && (
        <span
          style={{
            position: 'absolute',
            left: -24,
            top: '50%',
            width: 18,
            height: 2,
            background: 'var(--accent-ink)',
            transform: 'translateY(-50%)',
          }}
        />
      )}
    </Link>
  )
}
