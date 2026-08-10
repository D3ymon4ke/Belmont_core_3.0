'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { Home, Compass, MessageSquare, BarChart3, User } from 'lucide-react'
import { Profile } from '@/types'

interface MobileNavigationProps {
  currentProfile?: Profile | null
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ currentProfile }) => {
  const pathname = usePathname()
  const userUsername = currentProfile?.username || 'me'

  const navItems = [
    { label: 'Início', href: '/home', icon: Home },
    { label: 'Feed', href: '/feed', icon: Compass },
    { label: 'Chat', href: '/chat', icon: MessageSquare },
    { label: 'Bolsa', href: '/bolsa', icon: BarChart3 },
    { label: 'Perfil', href: `/perfil/${userUsername}`, icon: User },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-belmont-bg/95 backdrop-blur-lg border-t border-belmont-border px-2 flex items-center justify-around z-40">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive =
          pathname === item.href ||
          (item.href.includes('/perfil') && pathname.startsWith('/perfil'))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex flex-col items-center justify-center w-12 h-10 rounded-xl text-[9px] font-medium transition-all',
              isActive
                ? 'text-belmont-rose font-bold'
                : 'text-belmont-text-muted hover:text-belmont-text-primary'
            )}
          >
            <Icon className={clsx('w-4 h-4 mb-0.5', isActive && 'text-belmont-rose')} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
