import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { MobileNavigation } from '@/components/layout/MobileNavigation'
import { Profile } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  let currentProfile: Profile | null = null

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        currentProfile = profile as Profile
      } else {
        // Fallback for user without profile row yet
        currentProfile = {
          id: user.id,
          username: user.email?.split('@')[0] || 'usuario',
          display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Membro Belmont',
          avatar_url: user.user_metadata?.avatar_url || null,
          banner_url: null,
          bio: 'Membro exclusivo da Mansão Belmont.',
          status_text: 'Na Mansão Belmont',
          is_admin: false,
          belmont_coins: 100,
          rank_title: 'Iniciado',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }
    }
  } catch (error) {
    console.error('Error fetching profile in layout:', error)
  }

  return (
    <div className="min-h-screen bg-belmont-bg text-belmont-text-primary flex">
      {/* Desktop Sidebar */}
      <Sidebar currentProfile={currentProfile} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-16 md:pb-0">
        <Topbar currentProfile={currentProfile} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation currentProfile={currentProfile} />
    </div>
  )
}
