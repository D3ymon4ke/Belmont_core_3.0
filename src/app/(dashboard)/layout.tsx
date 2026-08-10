import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { RightSidebar } from '@/components/layout/RightSidebar'
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
        // Auto-heal: Insert missing profile row into Supabase profiles table
        const cleanUsername = (user.user_metadata?.username || user.email?.split('@')[0] || 'membro')
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '')
        const cleanName = user.user_metadata?.display_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Membro Belmont'

        const { data: createdProfile } = await (supabase
          .from('profiles') as any)
          .upsert({
            id: user.id,
            username: cleanUsername,
            display_name: cleanName,
            avatar_url: user.user_metadata?.avatar_url || null,
            status_text: 'Na Mansão Belmont',
            is_admin: false,
            belmont_coins: 100,
            rank_title: 'Iniciado',
          })
          .select('*')
          .single()

        await (supabase.from('user_progress') as any)
          .upsert({ user_id: user.id, xp: 0, rank_title: 'Iniciado' })

        if (createdProfile) {
          currentProfile = createdProfile as Profile
        } else {
          currentProfile = {
            id: user.id,
            username: cleanUsername,
            display_name: cleanName,
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
    }
  } catch (error) {
    console.error('Error fetching profile in layout:', error)
  }

  return (
    <div className="min-h-screen bg-belmont-bg text-belmont-text-primary flex justify-center">
      <div className="w-full max-w-7xl flex">
        {/* 1. Left Persistent Sidebar (Desktop) */}
        <Sidebar currentProfile={currentProfile} />

        {/* 2. Main Center Content Container */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen pb-16 md:pb-0">
          <Topbar currentProfile={currentProfile} />
          
          <div className="flex-1 flex gap-6 p-4 sm:p-6 justify-center">
            {/* Center Protagonist Column */}
            <main className="flex-1 max-w-2xl min-w-0 w-full">
              {children}
            </main>

            {/* 3. Right Contextual Sidebar (Desktop) */}
            <RightSidebar />
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileNavigation currentProfile={currentProfile} />
      </div>
    </div>
  )
}
