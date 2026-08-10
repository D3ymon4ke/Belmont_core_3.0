'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import {
  Home,
  Sparkles,
  ScrollText,
  Compass,
  MessageSquare,
  Send,
  Wallet,
  Landmark,
  BarChart3,
  User,
  Bell,
  Settings,
  ShieldAlert,
  LogOut,
  MoreVertical,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Profile } from '@/types'

interface SidebarProps {
  currentProfile?: Profile | null
}

export const Sidebar: React.FC<SidebarProps> = ({ currentProfile }) => {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Close popup menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const userUsername = currentProfile?.username || 'me'

  const categories = [
    {
      title: 'MANSÃO',
      items: [
        { label: 'Início', href: '/home', icon: Home },
        { label: 'Boas-Vindas', href: '/boas-vindas', icon: Sparkles },
        { label: 'Arquivos da Mansão', href: '/noticias', icon: ScrollText },
      ],
    },
    {
      title: 'COMUNIDADE',
      items: [
        { label: 'Feed', href: '/feed', icon: Compass },
        { label: 'Chat Geral', href: '/chat', icon: MessageSquare },
        { label: 'Mensagens', href: '/mensagens', icon: Send },
      ],
    },
    {
      title: 'ECONOMIA',
      items: [
        { label: 'Carteira', href: '/carteira', icon: Wallet },
        { label: 'Banco Belmont', href: '/banco', icon: Landmark },
        { label: 'Bolsa Belmont', href: '/bolsa', icon: BarChart3 },
      ],
    },
    {
      title: 'VOCÊ',
      items: [
        { label: 'Meu Perfil', href: `/perfil/${userUsername}`, icon: User },
        { label: 'Notificações', href: '/notificacoes', icon: Bell },
        { label: 'Configurações', href: '/configuracoes', icon: Settings },
      ],
    },
  ]

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-belmont-bg/95 border-r border-belmont-border px-3 py-4 justify-between z-30 select-none">
      <div className="space-y-5 overflow-y-auto no-scrollbar">
        {/* Top Logo */}
        <Link href="/home" className="flex items-center gap-2.5 px-3 py-1.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-belmont-crimson to-belmont-rose flex items-center justify-center text-white shadow-belmont-glow group-hover:scale-105 transition-transform">
            <span className="font-display font-extrabold text-sm tracking-wider">B</span>
          </div>
          <div>
            <h1 className="font-display font-extrabold text-xs text-belmont-text-primary tracking-wider leading-none group-hover:text-belmont-rose transition-colors">
              BELMONT
            </h1>
            <p className="text-[9px] tracking-widest text-belmont-rose font-bold uppercase mt-0.5">
              CORE 2.0
            </p>
          </div>
        </Link>

        {/* Vertical Categorized Navigation */}
        <nav className="space-y-4">
          {categories.map((category, catIdx) => (
            <div key={catIdx} className="space-y-0.5">
              <p className="px-3 text-[9px] font-bold uppercase text-belmont-text-muted tracking-widest mb-1">
                {category.title}
              </p>
              {category.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href ||
                  (item.href.includes('/perfil') && pathname.startsWith('/perfil'))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-150 group',
                      isActive
                        ? 'bg-belmont-crimson/20 text-belmont-rose border-l-2 border-belmont-rose font-semibold'
                        : 'text-belmont-text-secondary hover:text-belmont-text-primary hover:bg-white/5'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={clsx(
                          'w-4 h-4 transition-colors',
                          isActive
                            ? 'text-belmont-rose'
                            : 'text-belmont-text-muted group-hover:text-belmont-text-primary'
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3 h-3 text-belmont-rose/60" />}
                  </Link>
                )
              })}
            </div>
          ))}

          {/* Admin System Link */}
          {currentProfile?.is_admin && (
            <div className="pt-2 border-t border-belmont-border/50">
              <p className="px-3 text-[9px] font-bold uppercase text-amber-400 tracking-widest mb-1">
                SISTEMA
              </p>
              <Link
                href="/admin"
                className={clsx(
                  'flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition-colors',
                  pathname === '/admin' && 'bg-amber-500/15 border border-amber-500/20'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Painel Admin</span>
                </div>
                <Badge variant="gold" size="sm">ADMIN</Badge>
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* User Footer Profile Popover Area */}
      <div className="pt-3 border-t border-belmont-border/50 relative" ref={menuRef}>
        {/* Profile Popover Menu */}
        {isMenuOpen && (
          <div className="absolute bottom-16 left-0 right-0 p-1.5 bg-belmont-surface/95 border border-belmont-border-strong rounded-2xl shadow-belmont-card backdrop-blur-xl animate-fadeIn space-y-0.5 z-50">
            <Link
              href={`/perfil/${userUsername}`}
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-belmont-text-primary hover:bg-white/5 rounded-xl transition-colors"
            >
              <User className="w-4 h-4 text-belmont-text-muted" />
              <span>Meu Perfil</span>
            </Link>
            <Link
              href="/configuracoes"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-belmont-text-primary hover:bg-white/5 rounded-xl transition-colors"
            >
              <Settings className="w-4 h-4 text-belmont-text-muted" />
              <span>Configurações</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair</span>
            </button>
          </div>
        )}

        {/* Profile Trigger Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-belmont-surface/40 hover:bg-white/5 border border-belmont-border/60 transition-colors text-left group"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="relative shrink-0">
              <Avatar
                src={currentProfile?.avatar_url}
                fallback={currentProfile?.display_name || 'B'}
                size="sm"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-belmont-bg" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-belmont-text-primary group-hover:text-belmont-rose transition-colors truncate">
                {currentProfile?.display_name || 'Membro Belmont'}
              </p>
              <p className="text-[10px] text-belmont-text-muted truncate">
                @{currentProfile?.username || 'usuario'}
              </p>
            </div>
          </div>

          <MoreVertical className="w-4 h-4 text-belmont-text-muted shrink-0 ml-1" />
        </button>
      </div>
    </aside>
  )
}
