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
      className="paper-bg"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto scroll-y" style={{ maxHeight: '100dvh' }}>
          <div className="p-6 pb-24 md:pb-8">{children}</div>
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
