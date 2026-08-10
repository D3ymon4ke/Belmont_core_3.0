'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Newspaper, Users, TrendingUp, ShieldAlert, ChevronRight, Sparkles } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { getAnnouncementsService, getAllProfilesService } from '@/lib/services/data'
import { getNewsArticlesService } from '@/lib/services/news'
import { getAssetsService } from '@/lib/services/market'
import { Announcement, NewsArticle, Profile, Asset } from '@/types'

export const RightSidebar: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [news, setNews] = useState<NewsArticle[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadRightSidebarData() {
      try {
        const [annsData, newsData, profilesData, assetsData] = await Promise.all([
          getAnnouncementsService(),
          getNewsArticlesService(),
          getAllProfilesService(),
          getAssetsService(),
        ])
        setAnnouncements(annsData.slice(0, 1))
        setNews(newsData.slice(0, 3))
        setMembers(profilesData.slice(0, 4))
        setAssets(assetsData.slice(0, 3))
      } catch (e) {
        console.error('Error loading right sidebar data:', e)
      } finally {
        setIsLoading(false)
      }
    }

    loadRightSidebarData()
  }, [])

  return (
    <aside className="hidden lg:block w-80 shrink-0 space-y-5 sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar pb-6 select-none">
      {/* 1. COMUNICADO DA MANSÃO */}
      {announcements.length > 0 && (
        <div className="p-4 rounded-2xl bg-belmont-surface/70 border border-belmont-border space-y-2">
          <div className="flex items-center gap-2 text-belmont-rose">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Comunicado da Mansão</span>
          </div>
          <h4 className="text-xs font-bold text-belmont-text-primary leading-snug">
            {announcements[0].title}
          </h4>
          <p className="text-[11px] text-belmont-text-muted line-clamp-3 leading-relaxed">
            {announcements[0].body}
          </p>
        </div>
      )}

      {/* 2. ÚLTIMAS NOTÍCIAS */}
      <div className="p-4 rounded-2xl bg-belmont-surface/50 border border-belmont-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-belmont-text-muted flex items-center gap-1.5">
            <Newspaper className="w-3.5 h-3.5 text-belmont-rose" />
            Últimas Notícias
          </span>
          <Link href="/noticias" className="text-[10px] text-belmont-rose hover:underline font-semibold flex items-center">
            Ver tudo <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>

        {news.length === 0 ? (
          <p className="text-[11px] text-belmont-text-muted italic">Nenhuma notícia recente.</p>
        ) : (
          <div className="space-y-2.5 pt-1">
            {news.map((item, idx) => (
              <Link
                key={item.id || idx}
                href="/noticias"
                className="block group space-y-0.5 pb-2 border-b border-belmont-border/40 last:border-b-0 last:pb-0"
              >
                <p className="text-xs font-semibold text-belmont-text-primary group-hover:text-belmont-rose transition-colors line-clamp-1">
                  {item.title}
                </p>
                <p className="text-[10px] text-belmont-text-muted">
                  há {Math.max(1, (idx + 1) * 2)}h
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 3. MEMBROS PRESENTES */}
      <div className="p-4 rounded-2xl bg-belmont-surface/50 border border-belmont-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-belmont-text-muted flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            Membros Presentes
          </span>
          <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {members.length} ativos
          </span>
        </div>

        <div className="space-y-2 pt-1">
          {members.map((member) => (
            <Link
              key={member.id}
              href={`/perfil/${member.username}`}
              className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="relative shrink-0">
                  <Avatar src={member.avatar_url} fallback={member.display_name} size="sm" />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-belmont-bg" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-belmont-text-primary group-hover:text-belmont-rose transition-colors truncate">
                    {member.display_name}
                  </p>
                  <p className="text-[10px] text-belmont-text-muted truncate">
                    @{member.username}
                  </p>
                </div>
              </div>
              <Badge variant="gold" size="sm" className="shrink-0 text-[9px] px-1.5 py-0.5">
                {member.rank_title || 'Iniciado'}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* 4. MERCADO */}
      <div className="p-4 rounded-2xl bg-belmont-surface/50 border border-belmont-border space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-belmont-text-muted flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            Mercado Belmont
          </span>
          <Link href="/bolsa" className="text-[10px] text-amber-400 hover:underline font-semibold flex items-center">
            Bolsa <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>

        <div className="space-y-2 pt-1">
          {assets.length === 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-belmont-surface-elevated/60 border border-belmont-border/50">
                <span className="font-bold text-amber-300">BELMONT</span>
                <div className="text-right">
                  <span className="font-bold text-belmont-text-primary">253 Coins</span>
                  <span className="text-[10px] text-emerald-400 ml-1.5">+0.4%</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-belmont-surface-elevated/60 border border-belmont-border/50">
                <span className="font-bold text-amber-300">CASTLE</span>
                <div className="text-right">
                  <span className="font-bold text-belmont-text-primary">463 Coins</span>
                  <span className="text-[10px] text-emerald-400 ml-1.5">+2.1%</span>
                </div>
              </div>
            </div>
          ) : (
            assets.map((asset) => {
              const isPositive = (asset.change_24h || 0) >= 0
              return (
                <Link
                  key={asset.id}
                  href="/bolsa"
                  className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-belmont-surface-elevated/50 border border-belmont-border/40 hover:border-amber-500/30 transition-all group"
                >
                  <span className="font-bold text-amber-300 group-hover:text-amber-200 transition-colors">
                    {asset.symbol}
                  </span>
                  <div className="text-right">
                    <span className="font-bold text-belmont-text-primary">
                      {asset.current_price} Coins
                    </span>
                    <span className={`text-[10px] ml-1.5 font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? '+' : ''}{asset.change_24h || 0}%
                    </span>
                  </div>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </aside>
  )
}
