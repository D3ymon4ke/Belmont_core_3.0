import React from 'react'
import Link from 'next/link'
import {
  Sparkles,
  MessageSquare,
  Compass,
  ArrowRight,
  ShieldCheck,
  Award,
  Coins,
  Megaphone,
  Clock,
  Wallet,
  TrendingUp,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { MOCK_PROFILES, MOCK_ANNOUNCEMENTS, MOCK_POSTS } from '@/lib/services/data'
import { getRankProgress } from '@/lib/services/economy'
import { Profile } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()
  let userDisplayName = 'Membro Belmont'
  let userRank = 'Iniciado'
  let userCoins = 100
  let userXP = 1840

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: rawProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      const profile = rawProfile as Profile | null
      if (profile) {
        userDisplayName = profile.display_name
        userRank = profile.rank_title || 'Iniciado'
        userCoins = profile.belmont_coins || 100
      }

      const { data: progress } = await (supabase.from('user_progress') as any)
        .select('xp')
        .eq('user_id', user.id)
        .single()
      if (progress) userXP = progress.xp || 0
    }
  } catch (e) {
    // Fallback
  }

  const rankData = getRankProgress(userXP)

  const currentHour = new Date().getHours()
  let timeGreeting = 'Boa noite'
  if (currentHour >= 5 && currentHour < 12) timeGreeting = 'Bom dia'
  else if (currentHour >= 12 && currentHour < 18) timeGreeting = 'Boa tarde'

  const latestAnnouncement = MOCK_ANNOUNCEMENTS[0]
  const recentPosts = MOCK_POSTS.slice(0, 2)
  const activeMembers = MOCK_PROFILES

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Command Center Banner */}
      <section className="relative glass-card rounded-3xl p-6 sm:p-8 overflow-hidden border border-belmont-border bg-mansion-radial">
        <div className="absolute top-0 right-0 w-80 h-80 bg-belmont-crimson/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-belmont-rose/10 border border-belmont-rose/20 text-xs font-semibold text-rose-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sessão Protegida • Mansão Belmont em ordem</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-belmont-text-primary">
              {timeGreeting}, <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-belmont-rose via-rose-300 to-amber-300">{userDisplayName}</span>.
            </h1>
            
            <p className="text-xs sm:text-sm text-belmont-text-secondary leading-relaxed">
              Este é o Centro de Comando da sua plataforma social privada. Acompanhe os últimos comunicados da Mansão, interaja no chat geral e acesse conteúdos exclusivos.
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="flex items-center gap-3 self-start md:self-auto bg-belmont-surface/90 p-4 rounded-2xl border border-belmont-border shadow-lg">
            <Link href="/carteira" className="flex items-center gap-3 px-3 py-1 border-r border-belmont-border hover:opacity-80 transition-opacity">
              <Coins className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-[10px] text-belmont-text-muted font-bold uppercase tracking-wider">Belmont Coins</p>
                <p className="text-sm font-extrabold text-amber-300 font-display">{userCoins}</p>
              </div>
            </Link>

            <div className="flex items-center gap-3 px-3 py-1">
              <Award className="w-5 h-5 text-belmont-rose" />
              <div>
                <p className="text-[10px] text-belmont-text-muted font-bold uppercase tracking-wider">Patente</p>
                <p className="text-sm font-extrabold text-belmont-text-primary font-display">{userRank}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Member Progress & XP Bar Widget */}
      <div className="glass-panel rounded-2xl p-5 border border-belmont-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-belmont-rose" />
            <h3 className="text-xs font-bold text-belmont-text-primary font-display uppercase tracking-wider">
              Progressão do Membro — {rankData.currentRankTitle}
            </h3>
          </div>
          <span className="text-xs font-bold text-amber-300 font-display">
            {rankData.currentXP} / {rankData.maxXP} XP
            {!rankData.isMaxRank && (
              <span className="text-[10px] text-belmont-text-muted font-normal ml-2">
                ({rankData.remainingXP} XP para {rankData.nextRankTitle})
              </span>
            )}
          </span>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-2.5 bg-belmont-surface-elevated rounded-full overflow-hidden border border-belmont-border/50 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-belmont-crimson to-amber-400 rounded-full transition-all duration-500 shadow-gold-glow"
            style={{ width: `${rankData.percent}%` }}
          />
        </div>
      </div>

      {/* Main Grid: Announcements & Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2-Column: Announcement & Feed Highlights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Featured Announcement Card */}
          {latestAnnouncement && (
            <div className="glass-panel rounded-2xl p-6 border border-belmont-border hover:border-belmont-rose/40 transition-colors space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-belmont-rose/20 flex items-center justify-center text-belmont-rose border border-belmont-rose/30">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-belmont-rose">
                    Comunicado da Mansão
                  </span>
                </div>
                <Badge variant="gold">DESTAQUE</Badge>
              </div>

              <h2 className="text-lg font-bold text-belmont-text-primary font-display">
                {latestAnnouncement.title}
              </h2>

              <p className="text-xs sm:text-sm text-belmont-text-secondary leading-relaxed">
                {latestAnnouncement.body}
              </p>

              <div className="flex items-center justify-between text-xs text-belmont-text-muted pt-3 border-t border-belmont-border">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Transmitido recentemente
                </span>
                <Link href="/boas-vindas" className="text-belmont-rose hover:underline font-semibold inline-flex items-center gap-1">
                  Ver Arquivos da Mansão <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Feed Preview */}
          <div className="glass-panel rounded-2xl p-6 border border-belmont-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-belmont-border">
              <h3 className="text-sm font-bold text-belmont-text-primary font-display uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4.5 h-4.5 text-belmont-rose" />
                Atividade Recente no Feed
              </h3>
              <Link href="/feed" className="text-xs text-belmont-rose hover:underline font-semibold">
                Feed Completo →
              </Link>
            </div>

            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post.id} className="p-4 rounded-xl bg-belmont-surface/50 border border-belmont-border/60 hover:bg-belmont-surface-hover transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={post.author?.avatar_url} fallback={post.author?.display_name} size="sm" />
                      <div>
                        <p className="text-xs font-bold text-belmont-text-primary">{post.author?.display_name}</p>
                        <p className="text-[10px] text-belmont-text-muted">@{post.author?.username}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{post.likes_count} Curtidas</Badge>
                  </div>
                  <p className="text-xs text-belmont-text-secondary line-clamp-2">{post.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Shortcuts & Members */}
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <div className="glass-panel rounded-2xl p-5 border border-belmont-border space-y-3">
            <h3 className="text-xs font-bold text-belmont-text-primary font-display uppercase tracking-wider text-belmont-text-muted">
              Atalhos de Acesso
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/chat"
                className="flex flex-col items-start p-3.5 rounded-xl bg-belmont-surface/70 border border-belmont-border hover:border-belmont-rose/40 hover:bg-white/5 transition-all group"
              >
                <MessageSquare className="w-5 h-5 text-belmont-rose mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-belmont-text-primary">Chat Geral</span>
                <span className="text-[10px] text-belmont-text-muted mt-0.5">Sala de convivência</span>
              </Link>

              <Link
                href="/carteira"
                className="flex flex-col items-start p-3.5 rounded-xl bg-belmont-surface/70 border border-belmont-border hover:border-amber-500/40 hover:bg-white/5 transition-all group"
              >
                <Wallet className="w-5 h-5 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-belmont-text-primary">Carteira</span>
                <span className="text-[10px] text-belmont-text-muted mt-0.5">Ver extrato</span>
              </Link>
            </div>
          </div>

          {/* Active Members */}
          <div className="glass-panel rounded-2xl p-5 border border-belmont-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-belmont-text-primary font-display uppercase tracking-wider text-belmont-text-muted">
                Membros Presentes
              </h3>
              <Badge variant="success" size="sm">ONLINE</Badge>
            </div>

            <div className="space-y-3">
              {activeMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <Avatar src={member.avatar_url} fallback={member.display_name} size="sm" status="online" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-belmont-text-primary truncate">{member.display_name}</p>
                      <p className="text-[10px] text-belmont-text-muted truncate">{member.status_text}</p>
                    </div>
                  </div>
                  {member.is_admin && <Badge variant="crimson" size="sm">ADMIN</Badge>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
