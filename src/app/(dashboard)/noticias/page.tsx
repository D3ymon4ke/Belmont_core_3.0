'use client'

import React, { useState, useEffect } from 'react'
import { Newspaper, TrendingUp, TrendingDown, HelpCircle, Calendar, Tag, Search, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { getNewsArticlesService, getEconomicEventsService } from '@/lib/services/news'
import { NewsArticle, EconomicEvent } from '@/types'

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [activeEvents, setActiveEvents] = useState<EconomicEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const newsData = await getNewsArticlesService()
      setArticles(newsData)

      const eventsData = await getEconomicEventsService(true)
      setActiveEvents(eventsData)

      setIsLoading(false)
    }
    loadData()
  }, [])

  const filteredArticles = articles.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.summary.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getEventTypeBadge = (type?: string) => {
    switch (type) {
      case 'positive':
        return <Badge variant="success" size="sm">Otimista</Badge>
      case 'negative':
        return <Badge variant="crimson" size="sm">Pessimista</Badge>
      case 'rumor':
        return <Badge variant="gold" size="sm">Rumor</Badge>
      default:
        return <Badge variant="outline" size="sm">Informativo</Badge>
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-belmont-border relative overflow-hidden bg-mansion-radial">
        <div className="absolute top-0 right-0 w-80 h-80 bg-belmont-rose/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-belmont-rose/10 border border-belmont-rose/20 text-xs font-semibold text-rose-300">
            <Newspaper className="w-3.5 h-3.5 text-belmont-rose" />
            <span>Informa & Economia • Mansão Belmont</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-belmont-text-primary">
            Notícias da Mansão
          </h1>
          <p className="text-xs sm:text-sm text-belmont-text-secondary">
            Acompanhe comunicados oficiais, análises econômicas e acontecimentos do universo Belmont.
          </p>
        </div>
      </div>

      {/* Active Events Carousel Banner */}
      {activeEvents.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
            ⚡ Eventos Econômicos Ativos no Ecossistema
          </p>
          <div className="flex flex-wrap gap-2">
            {activeEvents.map((evt) => (
              <div key={evt.id} className="px-3 py-1.5 rounded-xl bg-belmont-surface/90 border border-amber-500/30 text-xs flex items-center gap-2">
                <span className="font-bold text-amber-300">{evt.title}</span>
                {evt.target_asset && (
                  <Badge variant="gold" size="sm">{evt.target_asset.symbol}</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-belmont-text-muted absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Pesquisar notícias por título ou resumo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-belmont-surface/80 text-xs text-belmont-text-primary pl-10 pr-4 py-3 rounded-2xl border border-belmont-border focus:border-belmont-rose focus:outline-none"
        />
      </div>

      {/* Articles Feed */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : filteredArticles.length === 0 ? (
        <EmptyState
          icon={<Newspaper className="w-6 h-6 text-belmont-rose" />}
          title="A Mansão permanece silenciosa."
          description="Nenhuma notícia foi localizada com o filtro informado."
        />
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="glass-panel p-5 rounded-3xl border border-belmont-border hover:border-belmont-rose/40 cursor-pointer transition-all space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getEventTypeBadge(article.event?.type)}
                  {article.related_asset && (
                    <Badge variant="outline" size="sm">{article.related_asset.symbol}</Badge>
                  )}
                </div>

                <span className="text-[10px] text-belmont-text-muted flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(article.published_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold font-display text-belmont-text-primary group-hover:text-belmont-rose transition-colors">
                  {article.title}
                </h3>
                <p className="text-xs text-belmont-text-secondary line-clamp-2">{article.summary}</p>
              </div>

              <div className="flex items-center text-xs font-bold text-belmont-rose gap-1 pt-1">
                <span>Ler matéria completa</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedArticle && (
        <Modal
          isOpen={!!selectedArticle}
          onClose={() => setSelectedArticle(null)}
          title={selectedArticle.title}
        >
          <div className="space-y-4 text-xs text-belmont-text-secondary">
            <div className="flex items-center gap-2 pb-2 border-b border-belmont-border">
              {getEventTypeBadge(selectedArticle.event?.type)}
              {selectedArticle.related_asset && (
                <Badge variant="gold" size="sm">Ativo: {selectedArticle.related_asset.name} ({selectedArticle.related_asset.symbol})</Badge>
              )}
            </div>

            <p className="font-semibold text-belmont-text-primary text-sm leading-relaxed">
              {selectedArticle.summary}
            </p>

            <div className="p-4 rounded-2xl bg-belmont-bg/90 border border-belmont-border leading-relaxed whitespace-pre-line text-belmont-text-primary">
              {selectedArticle.content}
            </div>

            <p className="text-[10px] text-belmont-text-muted text-right">
              Publicado em {new Date(selectedArticle.published_at).toLocaleString('pt-BR')}
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}
