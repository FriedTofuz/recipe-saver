import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'stretch',
        padding: 16,
      }}
    >
      {/* Paper panel — the warm cream "book" sitting on the dark background */}
      <div
        className="paper-bg"
        style={{
          flex: 1,
          display: 'flex',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,.5)',
          minHeight: 'calc(100dvh - 32px)',
        }}
      >
        <Sidebar />

        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto scroll-y">
            <div className="p-6 pb-24 md:pb-8">{children}</div>
          </main>
          <MobileNav />
        </div>
      </div>
    </div>
  )
}
