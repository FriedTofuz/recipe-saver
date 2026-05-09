import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SidebarLink } from './SidebarLink'
import { SidebarSignOut } from './SidebarSignOut'
import { InkDoodle } from '@/components/paper'

const mainNav = [
  { href: '/dashboard',     label: 'My Recipes',  doodle: 'cup'    as const },
  { href: '/cookbooks',     label: 'Cookbooks',   doodle: 'book'   as const },
  { href: '/meal-plan',     label: 'Meal Plan',   doodle: 'sprig'  as const },
  { href: '/grocery-lists', label: 'Groceries',   doodle: 'tomato' as const },
  { href: '/recipes/new',   label: 'Add Recipe',  doodle: 'whisk'  as const },
]

export async function Sidebar() {
  const supabase = createClient()
  const { data: cookbooks } = await supabase
    .from('cookbooks')
    .select('id, name')
    .order('name')

  return (
    <aside
      style={{
        width: 230,
        flexShrink: 0,
        padding: '28px 18px 24px 24px',
        borderRight: '1px solid var(--rule)',
        background: 'rgba(246,239,225,.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        minHeight: '100%',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'var(--ink)',
            color: 'var(--paper)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: 20,
            boxShadow: 'var(--shadow-soft)',
            flexShrink: 0,
          }}
        >
          m
        </span>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-serif, Georgia, serif)',
              fontSize: 21,
              lineHeight: 1,
              fontWeight: 500,
              letterSpacing: '.01em',
              color: 'var(--ink)',
            }}
          >
            marginalia
          </div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              marginTop: 3,
            }}
          >
            recipes worth keeping
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {mainNav.map((item) => (
          <SidebarLink key={item.href} href={item.href} doodle={item.doodle}>
            {item.label}
          </SidebarLink>
        ))}
      </nav>

      {/* Cookbooks section */}
      {(cookbooks ?? []).length > 0 && (
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-faint)',
              paddingLeft: 12,
              marginBottom: 6,
            }}
          >
            Cookbooks
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {cookbooks!.map((cb) => (
              <SidebarLink key={cb.id} href={`/cookbooks/${cb.id}`} doodle="book">
                {cb.name}
              </SidebarLink>
            ))}
          </nav>
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Sign out */}
      <div
        style={{
          paddingTop: 12,
          borderTop: '1px dashed var(--rule)',
        }}
      >
        <SidebarSignOut />
      </div>
    </aside>
  )
}
