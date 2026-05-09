import { createClient } from '@/lib/supabase/server'
import { SidebarLink } from './SidebarLink'
import { SidebarSignOut } from './SidebarSignOut'

const mainNav = [
  { href: '/dashboard',     label: 'Recipes',     doodle: 'fork'   as const },
  { href: '/cookbooks',     label: 'Cookbooks',   doodle: 'book'   as const },
  { href: '/meal-plan',     label: 'Meal Plan',   doodle: 'sprig'  as const },
  { href: '/grocery-lists', label: 'Groceries',   doodle: 'tomato' as const },
  { href: '/recipes/new',   label: 'Add Recipe',  doodle: 'whisk'  as const },
]

function getWeekStart(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export async function Sidebar() {
  const supabase = createClient()

  const [{ data: cookbooks }, { count: recipeCountRaw }, { data: slots }, { data: { user } }] = await Promise.all([
    supabase.from('cookbooks').select('id, name').order('name'),
    supabase.from('recipes').select('id', { count: 'exact', head: true }),
    supabase
      .from('meal_plan_slots')
      .select('recipe_id, day_of_week, week_start')
      .eq('week_start', getWeekStart())
      .not('recipe_id', 'is', null),
    supabase.auth.getUser(),
  ])

  const today = new Date().getDay() || 7
  const weekSlots = slots ?? []
  const cookedThisWeek = weekSlots.filter((s) => Number(s.day_of_week) < today).length
  const stillOnPlan = weekSlots.filter((s) => Number(s.day_of_week) >= today).length

  const cookbookCount = (cookbooks ?? []).length
  const recipeCount = recipeCountRaw ?? 0
  const email = user?.email ?? ''
  const initials = email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toLowerCase() || 'me'

  return (
    <aside
      className="hidden md:flex"
      style={{
        width: 264,
        flexShrink: 0,
        padding: '28px 20px 24px 26px',
        borderRight: '1px solid var(--rule)',
        background: 'rgba(246,239,225,.4)',
        flexDirection: 'column',
        gap: 18,
        minHeight: '100dvh',
        position: 'sticky',
        top: 0,
        alignSelf: 'flex-start',
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
      {cookbookCount > 0 && (
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

      {/* Week-count card — tilted index card with tape */}
      <div
        style={{
          padding: '14px 14px 16px',
          borderRadius: 10,
          background: 'rgba(255,255,255,.5)',
          border: '1px solid var(--rule)',
          position: 'relative',
          transform: 'rotate(-1.2deg)',
        }}
      >
        <span
          className="paper-tape"
          style={{ top: -8, left: 14, transform: 'rotate(-4deg)' }}
        />
        <div
          style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontSize: 13,
            color: 'var(--ink-soft)',
          }}
        >
          This week
        </div>
        <div
          style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontSize: 30,
            fontWeight: 500,
            marginTop: 2,
            color: 'var(--ink)',
          }}
        >
          {cookedThisWeek}{' '}
          <span style={{ fontSize: 14, color: 'var(--ink-faint)' }}>cooked</span>
        </div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            marginTop: 6,
          }}
        >
          {stillOnPlan} still on the plan
        </div>
      </div>

      {/* User block */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          paddingTop: 10,
          borderTop: '1px dashed var(--rule)',
        }}
      >
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'color-mix(in oklch, var(--accent-ink) 75%, white)',
            color: 'var(--paper)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontWeight: 600,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          {initials}
        </span>
        <div style={{ lineHeight: 1.2, minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--ink)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {email.split('@')[0] || 'You'}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--ink-faint)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {cookbookCount} {cookbookCount === 1 ? 'cookbook' : 'cookbooks'} · {recipeCount} {recipeCount === 1 ? 'recipe' : 'recipes'}
          </div>
        </div>
        <SidebarSignOut />
      </div>
    </aside>
  )
}
