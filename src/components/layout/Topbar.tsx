'use client'

import React from 'react'
import Link from 'next/link'
import { Bell, Sparkles, ShieldAlert } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Profile } from '@/types'

interface TopbarProps {
  currentProfile?: Profile | null
}

export const Topbar: React.FC<TopbarProps> = ({ currentProfile }) => {
  return (
    <header className="sticky top-0 z-30 w-full glass-panel border-b border-belmont-border px-4 py-3 flex items-center justify-between">
      {/* Mobile Brand / Logo */}
      <Link href="/home" className="flex items-center gap-2.5 md:hidden">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-belmont-crimson to-belmont-rose flex items-center justify-center text-white shadow-belmont-glow">
          <span className="font-display font-extrabold text-sm">B</span>
        </div>
        <span className="font-display font-bold text-sm text-belmont-text-primary tracking-wide">
          BELMONT CORE
        </span>
      </Link>

      {/* Desktop Search / Quick Lore Badge */}
      <div className="hidden md:flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-belmont-surface/70 border border-belmont-border text-xs text-belmont-text-muted">
          <Sparkles className="w-3.5 h-3.5 text-belmont-rose" />
          <span>Mansão Belmont • Sessão Protegida</span>
        </div>
      </div>

      {/* Actions (Notifications & Profile) */}
      <div className="flex items-center gap-3 ml-auto">
        {currentProfile?.is_admin && (
          <Link
            href="/admin"
            className="md:hidden p-2 text-amber-400 bg-amber-500/10 rounded-xl border border-amber-500/20"
            title="Painel Admin"
          >
            <ShieldAlert className="w-4 h-4" />
          </Link>
        )}

        <Link
          href="/notificacoes"
          className="relative p-2 text-belmont-text-muted hover:text-belmont-text-primary hover:bg-white/5 rounded-xl transition-colors"
          title="Notificações"
        >
          <Bell className="w-4 h-4" />
        </Link>

        <Link href={`/perfil/${currentProfile?.username || 'me'}`} className="md:hidden">
          <Avatar
            src={currentProfile?.avatar_url}
            fallback={currentProfile?.display_name || 'B'}
            size="sm"
          />
        </Link>
      </div>
    </header>
  )
}
