'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Compass,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Coins,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  ShieldCheck,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Skeleton } from '@/components/ui/Skeleton'
import { PostCard } from '@/components/feed/PostCard'
import { createClient } from '@/lib/supabase/client'
import { getAnnouncementsService, getRecentPostsService, getAllProfilesService } from '@/lib/services/data'
import { getBankAccountService } from '@/lib/services/bank'
import { getUserHoldingsService, getAssetsService } from '@/lib/services/market'
import { Profile, Announcement, Post, Asset } from '@/types'

export default function HomePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [patrimony, setPatrimony] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  const [greeting, setGreeting] = useState<{ title: string; subtitle: string; icon: React.ReactNode }>({
    title: 'Boa noite',
    subtitle: 'A quietude da noite vigia o ecossistema Belmont.',
    icon: <Moon className="w-4 h-4 text-belmont-rose" />,
  })

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) {
      setGreeting({
        title: 'Bom dia',
        subtitle: 'A Mansão desperta com novas histórias.',
        icon: <Sun className="w-4 h-4 text-amber-400" />,
      })
    } else if (hour >= 12 && hour < 18) {
      setGreeting({
        title: 'Boa tarde',
        subtitle: 'As atividades na Mansão seguem ativas.',
        icon: <Sunset className="w-4 h-4 text-amber-500" />,
      })
    } else {
      setGreeting({
        title: 'Boa noite',
        subtitle: 'A Mansão está tranquila.',
        icon: <Moon className="w-4 h-4 text-belmont-rose" />,
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

          // Calculate Total Coins/Patrimony
          const bankAcc = await getBankAccountService(user.id)
          const holdings = await getUserHoldingsService(user.id)
          const holdingsVal = holdings.reduce((sum, h) => sum + (h.quantity * (h.asset?.current_price || 0)), 0)
          const total = (userProfile.belmont_coins || 0) + (bankAcc?.balance || 0) + holdingsVal
          setPatrimony(total)
        }
      }

      const [annsData, postsData, profilesData, assetsData] = await Promise.all([
        getAnnouncementsService(),
        getRecentPostsService(),
        getAllProfilesService(),
        getAssetsService(),
      ])

      setAnnouncements(annsData.slice(0, 1))
      setRecentPosts(postsData.slice(0, 4))
      setMembers(profilesData.slice(0, 5))
      setAssets(assetsData.slice(0, 2))

      setIsLoading(false)
    }

    loadData()
  }, [])

  const userDisplayName = profile?.display_name?.split(' ')[0] || 'Membro'

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Warm Greeting Header */}
      <div className="flex items-center justify-between pb-3 border-b border-belmont-border/40">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-belmont-rose font-medium">
            {greeting.icon}
            <span>{greeting.subtitle}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-belmont-text-primary">
            {greeting.title}, <span className="text-belmont-rose">{userDisplayName}</span>.
          </h1>
        </div>

        <Link
          href="/carteira"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 transition-all text-xs font-bold shrink-0"
        >
          <Coins className="w-4 h-4 text-amber-400" />
          <span>{patrimony} Coins</span>
        </Link>
      </div>

      {/* 2. Announcement Banner (If Exists) */}
      {announcements.length > 0 && (
        <div className="p-4 rounded-2xl bg-belmont-surface/70 border-l-4 border-l-belmont-rose border border-belmont-border flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-belmont-rose mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-belmont-text-primary">{announcements[0].title}</h3>
            <p className="text-xs text-belmont-text-secondary leading-relaxed">{announcements[0].body}</p>
          </div>
        </div>
      )}

      {/* 3. Market Ticker Pill */}
      <div className="p-3 rounded-2xl bg-belmont-surface/50 border border-belmont-border flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 shrink-0">
          <TrendingUp className="w-4 h-4" />
          <span>MERCADO</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium shrink-0">
          {assets.length === 0 ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-belmont-text-primary">BELMONT</span>
                <span className="text-amber-300">253 Coins</span>
                <span className="text-[10px] text-emerald-400 font-bold">+0.4%</span>
              </div>
              <span className="text-belmont-border">•</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-belmont-text-primary">CASTLE</span>
                <span className="text-amber-300">463 Coins</span>
                <span className="text-[10px] text-emerald-400 font-bold">+2.1%</span>
              </div>
            </>
          ) : (
            assets.map((ast) => (
              <div key={ast.id} className="flex items-center gap-1.5">
                <span className="font-bold text-belmont-text-primary">{ast.symbol}</span>
                <span className="text-amber-300">{ast.current_price} Coins</span>
                <span className={`text-[10px] font-bold ${(ast.change_24h || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(ast.change_24h || 0) >= 0 ? '+' : ''}{ast.change_24h || 0}%
                </span>
              </div>
            ))
          )}
        </div>

        <Link href="/bolsa" className="text-[11px] text-belmont-rose hover:underline font-semibold shrink-0 flex items-center">
          Bolsa <ChevronRight className="w-3 h-3 ml-0.5" />
        </Link>
      </div>

      {/* 4. Timeline Section: What's Happening in the Mansion */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
            <Compass className="w-4 h-4 text-belmont-rose" />
            O que está acontecendo na Mansão
          </h2>
          <Link href="/feed" className="text-xs text-belmont-rose font-bold hover:underline flex items-center gap-1">
            Ver Feed Completo <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : recentPosts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-belmont-surface/30 border border-belmont-border text-center space-y-2">
            <p className="text-xs text-belmont-text-muted">A Mansão ainda está silenciosa hoje.</p>
            <Link href="/feed" className="inline-block text-xs text-belmont-rose font-semibold hover:underline">
              Escrever primeira publicação →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
