'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Calendar, ShoppingCart, BookOpen } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Recipes', icon: LayoutDashboard },
  { href: '/cookbooks', label: 'Cookbooks', icon: BookOpen },
  { href: '/meal-plan', label: 'Meal Plan', icon: Calendar },
  { href: '/grocery-lists', label: 'Groceries', icon: ShoppingCart },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background flex">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
