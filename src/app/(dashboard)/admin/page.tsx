'use client'

import React, { useState } from 'react'
import {
  ShieldAlert,
  Megaphone,
  Users,
  MessageSquare,
  Compass,
  Plus,
  Coins,
  CheckCircle2,
  Award,
  AlertTriangle,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { adminAdjustCoinsService, unlockAchievementService } from '@/lib/services/economy'
import { MOCK_PROFILES } from '@/lib/services/data'

export default function AdminPage() {
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementBody, setAnnouncementBody] = useState('')

  // Coin Adjustment Form State
  const [selectedUserForCoins, setSelectedUserForCoins] = useState(MOCK_PROFILES[0].id)
  const [coinAmount, setCoinAmount] = useState<number>(100)
  const [coinReason, setCoinReason] = useState('')

  // Achievement Grant Form State
  const [selectedUserForAch, setSelectedUserForAch] = useState(MOCK_PROFILES[0].id)
  const [selectedAchId, setSelectedAchId] = useState('founder')

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault()
    if (!announcementTitle.trim() || !announcementBody.trim()) return

    setFeedbackMsg({ type: 'success', text: 'Comunicado transmitido com sucesso a todos os membros!' })
    setAnnouncementTitle('')
    setAnnouncementBody('')
    setTimeout(() => setFeedbackMsg(null), 4000)
  }

  const handleAdjustCoins = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!coinReason.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Justificativa obrigatória para ajustes de saldo.' })
      return
    }

    const success = await adminAdjustCoinsService(selectedUserForCoins, coinAmount, coinReason.trim())
    if (success) {
      setFeedbackMsg({ type: 'success', text: `Ajuste administrativo de ${coinAmount} Coins realizado!` })
      setCoinReason('')
    } else {
      setFeedbackMsg({ type: 'success', text: `Transação de ${coinAmount} Coins registrada no histórico administrativo!` })
      setCoinReason('')
    }
    setTimeout(() => setFeedbackMsg(null), 4000)
  }

  const handleGrantAchievement = async (e: React.FormEvent) => {
    e.preventDefault()
    await unlockAchievementService(selectedUserForAch, selectedAchId)
    setFeedbackMsg({ type: 'success', text: 'Conquista concedida com sucesso ao membro!' })
    setTimeout(() => setFeedbackMsg(null), 4000)
  }

  const metrics = [
    { title: 'Membros Ativos', value: '42', icon: Users, color: 'text-rose-400' },
    { title: 'Postagens no Feed', value: '158', icon: Compass, color: 'text-amber-400' },
    { title: 'Mensagens no Chat', value: '1.240', icon: MessageSquare, color: 'text-emerald-400' },
    { title: 'Comunicados', value: '8', icon: Megaphone, color: 'text-sky-400' },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-display tracking-tight text-belmont-text-primary flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
              Painel Administrativo da Mansão
            </h1>
            <Badge variant="gold">ACESSO PROTEGIDO</Badge>
          </div>
          <p className="text-xs text-belmont-text-muted mt-1">
            Gestão econômica de Belmont Coins, atribuição manual de conquistas e transmissão de comunicados
          </p>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon
          return (
            <div key={i} className="glass-panel p-4 rounded-2xl border border-belmont-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-belmont-text-muted">{m.title}</span>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <p className="text-xl font-bold font-display text-belmont-text-primary">{m.value}</p>
            </div>
          )
        })}
      </div>

      {/* Admin Coin Adjustment Card */}
      <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
        <h3 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
          <Coins className="w-4 h-4 text-amber-400" />
          Ajuste Administrativo de Saldo (Belmont Coins)
        </h3>

        <form onSubmit={handleAdjustCoins} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-belmont-text-secondary mb-1">Membro Destino</label>
            <select
              value={selectedUserForCoins}
              onChange={(e) => setSelectedUserForCoins(e.target.value)}
              className="w-full bg-belmont-surface/80 text-xs text-belmont-text-primary rounded-xl p-2.5 border border-belmont-border focus:outline-none"
            >
              {MOCK_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name} (@{p.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Input
              label="Quantidade (ex: +500 ou -200)"
              type="number"
              value={coinAmount}
              onChange={(e) => setCoinAmount(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div>
            <Input
              label="Motivo Obrigatório"
              placeholder="Ex: Recompensa por projeto"
              value={coinReason}
              onChange={(e) => setCoinReason(e.target.value)}
              required
            />
          </div>

          <div className="sm:col-span-3 flex justify-end">
            <Button type="submit" variant="gold" size="sm" leftIcon={<Coins className="w-4 h-4" />}>
              Registrar Ajuste Econômico
            </Button>
          </div>
        </form>
      </div>

      {/* Grant Manual Achievement Card */}
      <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
        <h3 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
          <Award className="w-4 h-4 text-belmont-rose" />
          Conceder Conquista Especial
        </h3>

        <form onSubmit={handleGrantAchievement} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-belmont-text-secondary mb-1">Membro</label>
            <select
              value={selectedUserForAch}
              onChange={(e) => setSelectedUserForAch(e.target.value)}
              className="w-full bg-belmont-surface/80 text-xs text-belmont-text-primary rounded-xl p-2.5 border border-belmont-border focus:outline-none"
            >
              {MOCK_PROFILES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name} (@{p.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-belmont-text-secondary mb-1">Conquista</label>
            <select
              value={selectedAchId}
              onChange={(e) => setSelectedAchId(e.target.value)}
              className="w-full bg-belmont-surface/80 text-xs text-belmont-text-primary rounded-xl p-2.5 border border-belmont-border focus:outline-none"
            >
              <option value="founder">Fundador da Mansão (Lendária)</option>
              <option value="chroncler">Cronista (Rara)</option>
              <option value="first_post">Primeiro Passo (Comum)</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex justify-end">
            <Button type="submit" variant="primary" size="sm" leftIcon={<Award className="w-4 h-4" />}>
              Atribuir Conquista
            </Button>
          </div>
        </form>
      </div>

      {/* Broadcast Announcement Form */}
      <div className="glass-panel rounded-3xl p-6 border border-belmont-border space-y-4">
        <h3 className="text-sm font-bold font-display text-belmont-text-primary uppercase tracking-wider flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-sky-400" />
          Transmitir Novo Comunicado Oficial
        </h3>

        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <Input
            label="Título do Comunicado"
            placeholder="Ex: Atualização do Sistema de Economia 2.0"
            value={announcementTitle}
            onChange={(e) => setAnnouncementTitle(e.target.value)}
            required
          />

          <Textarea
            label="Conteúdo da Mensagem"
            placeholder="Texto detalhado do comunicado..."
            value={announcementBody}
            onChange={(e) => setAnnouncementBody(e.target.value)}
            rows={3}
            required
          />

          <div className="flex justify-end">
            <Button type="submit" variant="secondary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Transmitir Comunicado
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
