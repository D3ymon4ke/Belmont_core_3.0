'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import {
  Home,
  Compass,
  MessageSquare,
  Send,
  Bell,
  User,
  Settings,
  ShieldAlert,
  Sparkles,
  LogOut,
  ChevronRight,
  Wallet,
  Landmark,
  BarChart3,
  Newspaper,
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const userUsername = currentProfile?.username || 'me'

  const categories = [
    {
      title: 'Mansão',
      items: [
        { label: 'Command Center', href: '/home', icon: Home },
        { label: 'Banco Belmont', href: '/banco', icon: Landmark },
        { label: 'Bolsa Belmont', href: '/bolsa', icon: BarChart3 },
        { label: 'Notícias da Mansão', href: '/noticias', icon: Newspaper },
        { label: 'Boas-Vindas & Lore', href: '/boas-vindas', icon: Sparkles },
      ],
    },
    {
      title: 'Comunidade',
      items: [
        { label: 'Feed da Mansão', href: '/feed', icon: Compass },
        { label: 'Chat Geral', href: '/chat', icon: MessageSquare },
        { label: 'Mensagens Privadas', href: '/mensagens', icon: Send },
      ],
    },
    {
      title: 'Você',
      items: [
        { label: 'Meu Perfil', href: `/perfil/${userUsername}`, icon: User },
        { label: 'Carteira & Coins', href: '/carteira', icon: Wallet },
        { label: 'Notificações', href: '/notificacoes', icon: Bell },
        { label: 'Configurações', href: '/configuracoes', icon: Settings },
      ],
    },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 bg-belmont-bg/95 border-r border-belmont-border p-4 justify-between z-30 select-none">
      <div className="space-y-6">
        {/* Belmont Emblem Header */}
        <Link href="/home" className="flex items-center gap-3 px-3 py-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-belmont-crimson to-belmont-rose flex items-center justify-center text-white shadow-belmont-glow group-hover:scale-105 transition-all">
            <span className="font-display font-extrabold text-xl tracking-wider">B</span>
          </div>
          <div>
            <h1 className="font-display font-extrabold text-base text-belmont-text-primary tracking-wide leading-tight group-hover:text-belmont-rose transition-colors">
              BELMONT
            </h1>
            <p className="text-[10px] tracking-widest text-belmont-rose font-bold uppercase">
              CORE 2.0
            </p>
          </div>
        </Link>

        {/* Categorized Navigation */}
        <nav className="space-y-5">
          {categories.map((category, catIdx) => (
            <div key={catIdx} className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase text-belmont-text-muted tracking-wider mb-1">
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
                      'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group',
                      isActive
                        ? 'bg-gradient-to-r from-belmont-crimson/25 to-transparent text-belmont-rose border-l-2 border-belmont-rose'
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
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-belmont-rose/70" />}
                  </Link>
                )
              })}
            </div>
          ))}

          {/* Admin System Link */}
          {currentProfile?.is_admin && (
            <div className="pt-2 border-t border-belmont-border">
              <p className="px-3 text-[10px] font-bold uppercase text-amber-400 tracking-wider mb-1">
                Sistema
              </p>
              <Link
                href="/admin"
                className={clsx(
                  'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition-colors',
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

      {/* User Footer Profile Card */}
      <div className="pt-3 border-t border-belmont-border">
        <div className="flex items-center justify-between p-2 rounded-xl bg-belmont-surface/70 border border-belmont-border">
          <Link href={`/perfil/${userUsername}`} className="flex items-center gap-2.5 overflow-hidden">
            <Avatar
              src={currentProfile?.avatar_url}
              fallback={currentProfile?.display_name || 'B'}
              size="sm"
            />
            <div className="truncate">
              <p className="text-xs font-bold text-belmont-text-primary truncate">
                {currentProfile?.display_name || 'Membro Belmont'}
              </p>
              <p className="text-[10px] text-belmont-text-muted truncate">
                @{currentProfile?.username || 'usuario'}
              </p>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            title="Encerrar Sessão"
            className="p-1.5 text-belmont-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
