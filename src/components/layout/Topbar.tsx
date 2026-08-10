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
    <header className="sticky top-0 z-30 w-full bg-belmont-bg/80 backdrop-blur-md border-b border-belmont-border px-4 py-2.5 flex items-center justify-between">
      {/* Mobile Brand / Logo */}
      <Link href="/home" className="flex items-center gap-2 md:hidden">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-belmont-crimson to-belmont-rose flex items-center justify-center text-white shadow-belmont-glow">
          <span className="font-display font-extrabold text-xs">B</span>
        </div>
        <span className="font-display font-bold text-xs text-belmont-text-primary tracking-wider">
          BELMONT
        </span>
      </Link>

      {/* Desktop Context Pill */}
      <div className="hidden md:flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-belmont-surface/50 border border-belmont-border text-[11px] text-belmont-text-muted">
          <Sparkles className="w-3 h-3 text-belmont-rose" />
          <span>Rede Social Privada • Mansão Belmont</span>
        </div>
      </div>

      {/* Actions (Notifications & Profile) */}
      <div className="flex items-center gap-2.5 ml-auto">
        {currentProfile?.is_admin && (
          <Link
            href="/admin"
            className="md:hidden p-1.5 text-amber-400 bg-amber-500/10 rounded-lg border border-amber-500/20"
            title="Painel Admin"
          >
            <ShieldAlert className="w-4 h-4" />
          </Link>
        )}

        <Link
          href="/notificacoes"
          className="relative p-1.5 text-belmont-text-muted hover:text-belmont-text-primary hover:bg-white/5 rounded-lg transition-colors"
          title="Notificações"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-belmont-rose rounded-full" />
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
