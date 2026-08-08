'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Compass,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Landmark,
  ShieldCheck,
  Users,
  Coins,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Newspaper,
  Calendar,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { createClient } from '@/lib/supabase/client'
import { getAnnouncementsService, getRecentPostsService, getAllProfilesService } from '@/lib/services/data'
import { getBankAccountService } from '@/lib/services/bank'
import { getUserHoldingsService } from '@/lib/services/market'
import { getNewsArticlesService } from '@/lib/services/news'
import { Profile, Announcement, Post, NewsArticle } from '@/types'

export default function HomePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [news, setNews] = useState<NewsArticle[]>([])
  const [patrimony, setPatrimony] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  const [greeting, setGreeting] = useState<{ title: string; subtitle: string; icon: React.ReactNode }>({
    title: 'Bem-vindo',
    subtitle: 'Sessão protegida da Mansão Belmont',
    icon: <Moon className="w-5 h-5 text-belmont-rose" />,
  })

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      setGreeting({
        title: 'Bom dia',
        subtitle: 'A luz ilumina os corredores da Mansão Belmont.',
        icon: <Sun className="w-5 h-5 text-amber-400" />,
      })
    } else if (hour >= 12 && hour < 18) {
      setGreeting({
        title: 'Boa tarde',
        subtitle: 'As atividades na Mansão seguem a todo vapor.',
        icon: <Sunset className="w-5 h-5 text-amber-500" />,
      })
    } else {
      setGreeting({
        title: 'Boa noite',
        subtitle: 'A quietude da noite vigia o ecossistema Belmont.',
        icon: <Moon className="w-5 h-5 text-belmont-rose" />,
      })
    }
  }, [])

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userProfile } = await (supabase.from('profiles') as any)
          .select('*')
          .eq('id', user.id)
          .single()

        if (userProfile) {
          setProfile(userProfile as Profile)

          // Calculate Patrimony
          const bankAcc = await getBankAccountService(user.id)
          const holdings = await getUserHoldingsService(user.id)
          const holdingsVal = holdings.reduce((sum, h) => sum + (h.quantity * (h.asset?.current_price || 0)), 0)
          const total = (userProfile.belmont_coins || 0) + (bankAcc?.balance || 0) + holdingsVal
          setPatrimony(total)
        }
      }

      const activeAnnouncements = await getAnnouncementsService()
      setAnnouncements(activeAnnouncements)

      const postsData = await getRecentPostsService()
      setRecentPosts(postsData.slice(0, 3))

      const profilesData = await getAllProfilesService()
      setMembers(profilesData.slice(0, 5))

      const newsData = await getNewsArticlesService()
      setNews(newsData.slice(0, 2))

      setIsLoading(false)
    }

    loadData()
  }, [])

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Dynamic Welcome Hero Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-belmont-border relative overflow-hidden bg-mansion-radial">
        <div className="absolute top-0 right-0 w-96 h-96 bg-belmont-crimson/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-belmont-rose/10 border border-belmont-rose/20 text-xs font-semibold text-rose-300">
              {greeting.icon}
              <span>{greeting.subtitle}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-belmont-text-primary">
              {greeting.title}, <span className="gradient-text">{profile?.display_name || 'Membro'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-belmont-text-secondary max-w-lg">
              Você está no Command Center da Mansão Belmont. Acompanhe a economia, o feed comunitário e os avisos mais recentes.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-belmont-surface/90 p-4 rounded-2xl border border-belmont-border shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-belmont-text-muted font-bold uppercase tracking-wider">Patrimônio Total</p>
              <p className="text-2xl font-extrabold text-amber-300 font-display">{patrimony} Coins</p>
            </div>
          </div>
        </div>
      </div>

      {/* Announcements Banner */}
      {announcements.length > 0 && (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div key={ann.id} className="glass-panel p-5 rounded-2xl border-l-4 border-l-belmont-rose border border-belmont-border flex items-start gap-4">
              <ShieldCheck className="w-5 h-5 text-belmont-rose mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-bold font-display text-belmont-text-primary">{ann.title}</h3>
                <p className="text-xs text-belmont-text-secondary mt-1">{ann.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Grid: Feed & Community News */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Feed & News */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent News Widget */}
          {news.length > 0 && (
            <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-belmont-rose" />
                  Últimas Notícias da Mansão
                </h3>
                <Link href="/noticias" className="text-xs text-belmont-rose font-bold hover:underline flex items-center gap-1">
                  Ver Todas <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {news.map((item) => (
                  <Link key={item.id} href="/noticias" className="p-4 rounded-2xl bg-belmont-surface/50 border border-belmont-border hover:border-belmont-rose/40 transition-all space-y-2 group">
                    <p className="text-xs font-bold text-belmont-text-primary group-hover:text-belmont-rose transition-colors line-clamp-1">{item.title}</p>
                    <p className="text-[11px] text-belmont-text-muted line-clamp-2">{item.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Feed Preview */}
          <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-belmont-rose" />
                Últimas Publicações do Feed
              </h3>
              <Link href="/feed" className="text-xs text-belmont-rose font-bold hover:underline flex items-center gap-1">
                Ver Feed Completo <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            ) : recentPosts.length === 0 ? (
              <p className="text-xs text-belmont-text-muted text-center py-6">
                A Mansão ainda está silenciosa. Seja o primeiro a publicar no Feed!
              </p>
            ) : (
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <div key={post.id} className="p-4 rounded-2xl bg-belmont-surface/50 border border-belmont-border space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar src={post.author?.avatar_url} fallback={post.author?.display_name || 'M'} size="sm" />
                      <div>
                        <p className="text-xs font-bold text-belmont-text-primary">{post.author?.display_name}</p>
                        <p className="text-[10px] text-belmont-text-muted">@{post.author?.username}</p>
                      </div>
                    </div>
                    <p className="text-xs text-belmont-text-secondary line-clamp-2">{post.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mansion Members */}
        <div className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
            <h3 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Membros da Mansão
            </h3>

            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded-2xl" />
                <Skeleton className="h-12 w-full rounded-2xl" />
              </div>
            ) : (
              <div className="space-y-2.5">
                {members.map((m) => (
                  <Link key={m.id} href={`/perfil/${m.username}`} className="p-2.5 rounded-2xl bg-belmont-surface/40 hover:bg-white/5 border border-belmont-border/60 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar src={m.avatar_url} fallback={m.display_name} size="sm" />
                      <div>
                        <p className="text-xs font-bold text-belmont-text-primary">{m.display_name}</p>
                        <p className="text-[10px] text-belmont-text-muted">@{m.username}</p>
                      </div>
                    </div>
                    <Badge variant="gold" size="sm">{m.rank_title || 'Iniciado'}</Badge>
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
