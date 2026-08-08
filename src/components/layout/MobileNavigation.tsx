'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { Home, Compass, Landmark, BarChart3, User } from 'lucide-react'
import { Profile } from '@/types'

interface MobileNavigationProps {
  currentProfile?: Profile | null
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ currentProfile }) => {
  const pathname = usePathname()
  const userUsername = currentProfile?.username || 'me'

  const navItems = [
    { label: 'Home', href: '/home', icon: Home },
    { label: 'Banco', href: '/banco', icon: Landmark },
    { label: 'Bolsa', href: '/bolsa', icon: BarChart3 },
    { label: 'Feed', href: '/feed', icon: Compass },
    { label: 'Perfil', href: `/perfil/${userUsername}`, icon: User },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-belmont-bg/95 backdrop-blur-md border-t border-belmont-border px-2 flex items-center justify-around z-40">
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
              'flex flex-col items-center justify-center w-14 h-12 rounded-xl text-[10px] font-semibold transition-all',
              isActive
                ? 'text-belmont-rose bg-belmont-crimson/15 font-bold'
                : 'text-belmont-text-muted hover:text-belmont-text-primary'
            )}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
