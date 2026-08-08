'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Coins,
  Award,
  Megaphone,
  UserCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Newspaper,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { getAllProfilesService, createAnnouncementService } from '@/lib/services/data'
import { adjustUserCoinsAdminService, grantUserAchievementAdminService } from '@/lib/services/economy'
import { createEconomicEventAdminService, createNewsArticleAdminService } from '@/lib/services/news'
import { getAssetsService } from '@/lib/services/market'
import { Profile, Asset } from '@/types'

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchMemberQuery, setSearchMemberQuery] = useState('')

  // Selected Member for Coin / Achievement Adjustment
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null)
  const [coinAmount, setCoinAmount] = useState<string>('')
  const [coinDescription, setCoinDescription] = useState<string>('')
  const [achievementId, setAchievementId] = useState<string>('founder')

  // Announcement State
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementBody, setAnnouncementBody] = useState('')

  // Economic Event State
  const [eventTitle, setEventTitle] = useState('')
  const [eventDesc, setEventDesc] = useState('')
  const [eventType, setEventType] = useState<'positive' | 'negative' | 'neutral' | 'rumor'>('positive')
  const [eventTargetAsset, setEventTargetAsset] = useState<string>('')
  const [eventImpact, setEventImpact] = useState<string>('0.30')

  // News State
  const [newsTitle, setNewsTitle] = useState('')
  const [newsSummary, setNewsSummary] = useState('')
  const [newsContent, setNewsContent] = useState('')
  const [newsTargetAsset, setNewsTargetAsset] = useState<string>('')

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    const membersData = await getAllProfilesService()
    setProfiles(membersData)

    const activeAssets = await getAssetsService()
    setAssets(activeAssets)
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCoinAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember) return
    const amount = parseInt(coinAmount)
    if (isNaN(amount) || amount === 0) {
      setFeedback({ type: 'error', message: 'Informe uma quantidade válida.' })
      return
    }

    const res = await adjustUserCoinsAdminService(selectedMember.id, amount, coinDescription || 'Ajuste Administrativo')
    if (res.success) {
      setFeedback({ type: 'success', message: `Saldo de ${selectedMember.display_name} ajustado com sucesso!` })
      setCoinAmount('')
      setCoinDescription('')
      await loadData()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Falha ao ajustar moedas.' })
    }
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleGrantAchievement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember) return

    const res = await grantUserAchievementAdminService(selectedMember.id, achievementId)
    if (res.success) {
      setFeedback({ type: 'success', message: `Conquista concedida para ${selectedMember.display_name}!` })
      await loadData()
    } else {
      setFeedback({ type: 'error', message: res.error || 'Falha ao conceder conquista.' })
    }
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!announcementTitle.trim() || !announcementBody.trim()) return

    const res = await createAnnouncementService(announcementTitle.trim(), announcementBody.trim())
    if (res.success) {
      setFeedback({ type: 'success', message: 'Comunicado oficial publicado na Mansão!' })
      setAnnouncementTitle('')
      setAnnouncementBody('')
    } else {
      setFeedback({ type: 'error', message: res.error || 'Falha ao publicar comunicado.' })
    }
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventTitle.trim() || !eventDesc.trim()) return

    const impact = parseFloat(eventImpact)
    const res = await createEconomicEventAdminService(
      eventTitle.trim(),
      eventDesc.trim(),
      eventType,
      eventTargetAsset || null,
      isNaN(impact) ? 0.3 : impact
    )

    if (res.success) {
      setFeedback({ type: 'success', message: 'Evento Econômico ativado no mercado!' })
      setEventTitle('')
      setEventDesc('')
    } else {
      setFeedback({ type: 'error', message: res.error || 'Falha ao criar evento.' })
    }
    setTimeout(() => setFeedback(null), 4000)
  }

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsTitle.trim() || !newsSummary.trim() || !newsContent.trim()) return

    const res = await createNewsArticleAdminService(
      newsTitle.trim(),
      newsSummary.trim(),
      newsContent.trim(),
      null,
      newsTargetAsset || null
    )

    if (res.success) {
      setFeedback({ type: 'success', message: 'Notícia oficial publicada no ecossistema!' })
      setNewsTitle('')
      setNewsSummary('')
      setNewsContent('')
    } else {
      setFeedback({ type: 'error', message: res.error || 'Falha ao publicar notícia.' })
    }
    setTimeout(() => setFeedback(null), 4000)
  }

  const filteredProfiles = profiles.filter((p) =>
    p.display_name.toLowerCase().includes(searchMemberQuery.toLowerCase()) ||
    p.username.toLowerCase().includes(searchMemberQuery.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-amber-500/30 relative overflow-hidden bg-mansion-radial">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-belmont-text-primary">
              Painel de Administração
            </h1>
            <p className="text-xs sm:text-sm text-belmont-text-secondary">
              Gerencie moedas, conquistas, comunicados, eventos econômicos e notícias oficiais do Belmont Core.
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4.5 h-4.5" /> : <AlertTriangle className="w-4.5 h-4.5" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Admin Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Economic Events */}
        <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
          <h3 className="text-base font-bold font-display text-belmont-text-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Disparar Evento Econômico
          </h3>

          <form onSubmit={handleCreateEvent} className="space-y-4">
            <Input
              label="Título do Evento"
              placeholder="Ex: Expansão da Infraestrutura"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              required
            />

            <Input
              label="Descrição do Evento"
              placeholder="Ex: Aporte financeiro confirmado no setor de servidores."
              value={eventDesc}
              onChange={(e) => setEventDesc(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-belmont-text-secondary mb-1">Tipo de Evento</label>
                <select
                  value={eventType}
                  onChange={(e: any) => setEventType(e.target.value)}
                  className="w-full bg-belmont-bg text-xs text-belmont-text-primary p-2.5 rounded-xl border border-belmont-border"
                >
                  <option value="positive">Otimista (+)</option>
                  <option value="negative">Pessimista (-)</option>
                  <option value="neutral">Neutro (=)</option>
                  <option value="rumor">Rumor (!)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-belmont-text-secondary mb-1">Ativo Alvo</label>
                <select
                  value={eventTargetAsset}
                  onChange={(e) => setEventTargetAsset(e.target.value)}
                  className="w-full bg-belmont-bg text-xs text-belmont-text-primary p-2.5 rounded-xl border border-belmont-border"
                >
                  <option value="">Geral (Todos os Ativos)</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.symbol} - {a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button type="submit" variant="gold" size="md" fullWidth>
              Ativar Evento no Mercado
            </Button>
          </form>
        </div>

        {/* Section 2: News Articles */}
        <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
          <h3 className="text-base font-bold font-display text-belmont-text-primary flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-belmont-rose" />
            Publicar Notícia Oficial
          </h3>

          <form onSubmit={handleCreateNews} className="space-y-4">
            <Input
              label="Título da Notícia"
              placeholder="Ex: Anúncio de Expansão da Castle Holding"
              value={newsTitle}
              onChange={(e) => setNewsTitle(e.target.value)}
              required
            />

            <Input
              label="Resumo Curto"
              placeholder="Ex: Nova unidade de servidores confirmada para a Mansão."
              value={newsSummary}
              onChange={(e) => setNewsSummary(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-belmont-text-secondary mb-1">Conteúdo da Notícia</label>
              <textarea
                placeholder="Insira o texto completo da matéria..."
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                rows={3}
                className="w-full bg-belmont-bg text-xs text-belmont-text-primary p-3 rounded-xl border border-belmont-border focus:border-belmont-rose focus:outline-none"
                required
              />
            </div>

            <Button type="submit" variant="primary" size="md" fullWidth>
              Publicar Notícia na Mansão
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
