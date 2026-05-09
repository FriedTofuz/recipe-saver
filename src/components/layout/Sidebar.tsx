import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SidebarLink } from './SidebarLink'
import { SidebarSignOut } from './SidebarSignOut'
import { LayoutDashboard, Calendar, ShoppingCart, BookOpen, Plus, ChefHat } from 'lucide-react'

const mainNav = [
  { href: '/dashboard', label: 'My Recipes', icon: LayoutDashboard },
  { href: '/meal-plan', label: 'Meal Plan', icon: Calendar },
  { href: '/grocery-lists', label: 'Grocery Lists', icon: ShoppingCart },
]

export async function Sidebar() {
  const supabase = createClient()
  const { data: cookbooks } = await supabase
    .from('cookbooks')
    .select('id, name')
    .order('name')

  return (
    <aside className="hidden md:flex w-64 flex-col h-full border-r bg-muted/30">
      <div className="flex items-center gap-2 px-4 h-16 border-b">
        <ChefHat className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">My Recipes</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <nav className="space-y-1">
          {mainNav.map((item) => (
            <SidebarLink key={item.href} href={item.href} icon={<item.icon className="h-4 w-4 shrink-0" />}>
              {item.label}
            </SidebarLink>
          ))}
        </nav>

        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cookbooks
            </span>
            <Link href="/cookbooks" className="text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="h-3.5 w-3.5" />
            </Link>
          </div>
          <nav className="space-y-1">
            {(cookbooks ?? []).map((cb) => (
              <SidebarLink key={cb.id} href={`/cookbooks/${cb.id}`} icon={<BookOpen className="h-4 w-4 shrink-0" />}>
                {cb.name}
              </SidebarLink>
            ))}
            {(cookbooks ?? []).length === 0 && (
              <p className="px-3 py-1.5 text-xs text-muted-foreground">No cookbooks yet</p>
            )}
          </nav>
        </div>
      </div>

      <div className="border-t p-3">
        <SidebarSignOut />
      </div>
    </aside>
  )
}
