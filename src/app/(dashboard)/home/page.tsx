import React from 'react'
import Link from 'next/link'
import {
  Compass,
  ArrowRight,
  ShieldCheck,
  Award,
  Coins,
  Megaphone,
  Clock,
  TrendingUp,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { getPostsService, getAnnouncementsService, getAllProfilesService } from '@/lib/services/data'
import { getUserProgressService, getRankProgress } from '@/lib/services/economy'
import { Profile } from '@/types'

export default async function HomePage() {
  const supabase = await createClient()
  let currentProfile: Profile | null = null
  let userXP = 0

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: rawProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (rawProfile) currentProfile = rawProfile as Profile

      const { data: progress } = await (supabase.from('user_progress') as any)
        .select('xp')
        .eq('user_id', user.id)
        .single()
      if (progress) userXP = progress.xp || 0
    }
  } catch (e) {
    // Graceful error fallback
  }

  const userDisplayName = currentProfile?.display_name || 'Membro Belmont'
  const userRank = currentProfile?.rank_title || 'Iniciado'
  const userCoins = currentProfile?.belmont_coins ?? 0

  const rankData = getRankProgress(userXP)

  const currentHour = new Date().getHours()
  let timeGreeting = 'Boa noite'
  if (currentHour >= 5 && currentHour < 12) timeGreeting = 'Bom dia'
  else if (currentHour >= 12 && currentHour < 18) timeGreeting = 'Boa tarde'

  const announcements = await getAnnouncementsService()
  const latestAnnouncement = announcements[0] || null

  const allPosts = await getPostsService()
  const recentPosts = allPosts.slice(0, 2)

  const mansionMembers = await getAllProfilesService()

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Command Center Banner */}
      <section className="relative glass-card rounded-3xl p-6 sm:p-8 overflow-hidden border border-belmont-border bg-mansion-radial">
        <div className="absolute top-0 right-0 w-80 h-80 bg-belmont-crimson/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-belmont-rose/10 border border-belmont-rose/20 text-xs font-semibold text-rose-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sessão Protegida • Mansão Belmont</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-belmont-text-primary">
              {timeGreeting}, <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-belmont-rose via-rose-300 to-amber-300">{userDisplayName}</span>.
            </h1>
            
            <p className="text-xs sm:text-sm text-belmont-text-secondary leading-relaxed">
              Centro de Comando do Belmont Core. Acompanhe os comunicados da Mansão, interaja com os membros e gerencie sua conta.
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

        <div className="w-full h-2.5 bg-belmont-surface-elevated rounded-full overflow-hidden border border-belmont-border/50 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-belmont-crimson to-amber-400 rounded-full transition-all duration-500 shadow-gold-glow"
            style={{ width: `${rankData.percent}%` }}
          />
        </div>
      </div>

      {/* Main Grid: Announcements & Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2-Column: Announcement & Feed Highlights */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcement Section */}
          {latestAnnouncement ? (
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
                  {new Date(latestAnnouncement.created_at).toLocaleDateString('pt-BR')}
                </span>
                <Link href="/boas-vindas" className="text-belmont-rose hover:underline font-semibold inline-flex items-center gap-1">
                  Ver Boas-Vindas <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-6 border border-belmont-border text-center py-6">
              <Megaphone className="w-8 h-8 text-belmont-text-muted mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold text-belmont-text-primary">Nenhum comunicado no momento.</p>
              <p className="text-[10px] text-belmont-text-muted mt-0.5">Os avisos oficiais da Mansão aparecerão aqui.</p>
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
                Ir para o Feed →
              </Link>
            </div>

            {recentPosts.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <p className="text-xs font-semibold text-belmont-text-secondary">Ainda não há publicações na Mansão.</p>
                <Link href="/feed">
                  <Button size="sm" variant="secondary">Ir para o Feed</Button>
                </Link>
              </div>
            ) : (
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
            )}
          </div>
        </div>

        {/* Right Sidebar: Mansion Members */}
        <div className="space-y-6">
          {/* Registered Mansion Members List */}
          <div className="glass-panel rounded-2xl p-5 border border-belmont-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-belmont-text-primary font-display uppercase tracking-wider text-belmont-text-muted flex items-center gap-2">
                <Users className="w-4 h-4 text-belmont-rose" />
                Membros da Mansão ({mansionMembers.length})
              </h3>
            </div>

            {mansionMembers.length === 0 ? (
              <p className="text-xs text-belmont-text-muted text-center py-4">Nenhum outro membro cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {mansionMembers.map((member) => (
                  <Link
                    key={member.id}
                    href={`/perfil/${member.username}`}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Avatar src={member.avatar_url} fallback={member.display_name} size="sm" />
                      <div className="truncate">
                        <p className="text-xs font-bold text-belmont-text-primary truncate">{member.display_name}</p>
                        <p className="text-[10px] text-belmont-text-muted truncate">@{member.username}</p>
                      </div>
                    </div>
                    {member.is_admin && <Badge variant="crimson" size="sm">ADMIN</Badge>}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
