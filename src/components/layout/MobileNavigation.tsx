'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { Home, Compass, MessageSquare, Send, User } from 'lucide-react'
import { Profile } from '@/types'

interface MobileNavigationProps {
  currentProfile?: Profile | null
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ currentProfile }) => {
  const pathname = usePathname()
  const userUsername = currentProfile?.username || 'me'

  const navItems = [
    { label: 'Home', href: '/home', icon: Home },
    { label: 'Feed', href: '/feed', icon: Compass },
    { label: 'Chat', href: '/chat', icon: MessageSquare },
    { label: 'DMs', href: '/mensagens', icon: Send },
    { label: 'Perfil', href: `/perfil/${userUsername}`, icon: User },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-belmont-border px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href.includes('/perfil') && pathname.startsWith('/perfil'))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 min-w-[56px]',
                isActive ? 'text-belmont-rose' : 'text-belmont-text-muted hover:text-belmont-text-secondary'
              )}
            >
              <div className="relative">
                <Icon className={clsx('w-5 h-5 transition-transform', isActive && 'scale-110')} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-belmont-rose" />
                )}
              </div>
              <span className="text-[10px] font-medium mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
