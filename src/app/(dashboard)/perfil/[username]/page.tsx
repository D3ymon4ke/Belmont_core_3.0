'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar,
  Coins,
  Edit3,
  Sparkles,
  Compass,
  CheckCircle2,
  Star,
  TrendingUp,
  Award as AwardIcon,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { PostCard } from '@/components/feed/PostCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  getProfileByUsernameService,
  updateProfileService,
  getPostsService,
} from '@/lib/services/data'
import {
  getUserProgressService,
  getUserAchievementsService,
  getAchievementsService,
  getRankProgress,
} from '@/lib/services/economy'
import { createClient } from '@/lib/supabase/client'
import { Profile, UserAchievement, Achievement, Post } from '@/types'

export default function UserProfilePage() {
  const params = useParams()
  const supabase = createClient()
  const usernameParam = Array.isArray(params?.username) ? params.username[0] : params?.username || ''

  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userXP, setUserXP] = useState<number>(0)
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([])
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false)

  const [editDisplayName, setEditDisplayName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editStatusText, setEditStatusText] = useState('')

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      const fetchedProfile = await getProfileByUsernameService(usernameParam)
      if (fetchedProfile) {
        setProfile(fetchedProfile)
        setEditDisplayName(fetchedProfile.display_name)
        setEditBio(fetchedProfile.bio || '')
        setEditStatusText(fetchedProfile.status_text || '')

        const progress = await getUserProgressService(fetchedProfile.id)
        setUserXP(progress.xp || 0)

        const uAchs = await getUserAchievementsService(fetchedProfile.id)
        setUserAchievements(uAchs)

        const posts = await getPostsService()
        setUserPosts(posts.filter((p) => p.author_id === fetchedProfile.id))
      }

      const catalogue = await getAchievementsService()
      setAllAchievements(catalogue)

      setIsLoading(false)
    }

    if (usernameParam) loadData()
  }, [usernameParam])

  const isOwner = currentUserId && profile && currentUserId === profile.id
  const rankData = getRankProgress(userXP)

  const handleSaveProfile = async () => {
    if (!profile || !isOwner) return

    const updated = await updateProfileService(profile.id, {
      display_name: editDisplayName,
      bio: editBio,
      status_text: editStatusText,
    })

    if (updated) {
      setProfile(updated)
    } else {
      setProfile((prev) => prev ? ({
        ...prev,
        display_name: editDisplayName,
        bio: editBio,
        status_text: editStatusText,
      }) : null)
    }
    setIsEditOpen(false)
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 space-y-3">
        <h2 className="text-xl font-bold font-display text-belmont-text-primary">
          Membro não encontrado
        </h2>
        <p className="text-xs text-belmont-text-muted">
          O perfil @{usernameParam} não foi localizado no Supabase da Mansão Belmont.
        </p>
      </div>
    )
  }

  const joinFormatted = new Date(profile.created_at).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Banner / Header Card */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-belmont-border relative">
        {/* Cover Backdrop */}
        <div className="h-40 sm:h-52 bg-gradient-to-r from-belmont-crimson via-belmont-surface-elevated to-belmont-bg relative overflow-hidden">
          <div className="absolute inset-0 bg-mansion-radial opacity-70" />
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Link href="/carteira">
              <Badge variant="gold" size="md" className="cursor-pointer hover:scale-105 transition-transform">
                <Coins className="w-3.5 h-3.5 mr-1" />
                {profile.belmont_coins ?? 0} Coins
              </Badge>
            </Link>
          </div>
        </div>

        {/* Profile Content Body */}
        <div className="p-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 gap-4 mb-4">
            <div className="relative">
              <Avatar
                src={profile.avatar_url}
                fallback={profile.display_name}
                size="xl"
                className="ring-4 ring-belmont-bg"
              />
            </div>

            {isOwner && (
              <Button
                onClick={() => setIsEditOpen(true)}
                variant="secondary"
                size="sm"
                leftIcon={<Edit3 className="w-4 h-4" />}
              >
                Editar Perfil
              </Button>
            )}
          </div>

          {/* Main Info */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold font-display text-belmont-text-primary">
                  {profile.display_name}
                </h1>
                {profile.is_admin && <Badge variant="crimson">ADMIN</Badge>}
                <Badge variant="gold">{rankData.currentRankTitle}</Badge>
              </div>
              <p className="text-xs text-belmont-text-muted mt-0.5">@{profile.username}</p>
            </div>

            {profile.status_text && (
              <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-belmont-surface/80 border border-belmont-border text-xs text-belmont-rose font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{profile.status_text}</span>
              </p>
            )}

            <p className="text-sm text-belmont-text-secondary leading-relaxed max-w-2xl">
              {profile.bio || 'Membro da Mansão Belmont.'}
            </p>

            <div className="flex items-center gap-4 text-xs text-belmont-text-muted pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-belmont-text-muted" />
                Membro desde {joinFormatted}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Member Progress Bar Card */}
      <div className="glass-panel p-5 rounded-2xl border border-belmont-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-belmont-rose" />
            <h3 className="text-xs font-bold text-belmont-text-primary font-display uppercase tracking-wider">
              Nível de Experiência — {rankData.currentRankTitle}
            </h3>
          </div>
          <span className="text-xs font-bold text-amber-300 font-display">
            {rankData.currentXP} / {rankData.maxXP} XP
          </span>
        </div>

        <div className="w-full h-2.5 bg-belmont-surface-elevated rounded-full overflow-hidden border border-belmont-border/50 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-belmont-crimson to-amber-400 rounded-full transition-all duration-500 shadow-gold-glow"
            style={{ width: `${rankData.percent}%` }}
          />
        </div>
      </div>

      {/* Achievements Gallery Section */}
      <div className="glass-panel p-5 rounded-2xl border border-belmont-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-belmont-text-primary font-display uppercase tracking-wider flex items-center gap-2">
            <AwardIcon className="w-4 h-4 text-amber-400" />
            Galeria de Conquistas ({userAchievements.length} Desbloqueadas)
          </h3>
          {allAchievements.length > 0 && (
            <button
              onClick={() => setIsAchievementsModalOpen(true)}
              className="text-xs text-belmont-rose hover:underline font-semibold"
            >
              Ver Todas ({allAchievements.length}) →
            </button>
          )}
        </div>

        {userAchievements.length === 0 ? (
          <EmptyState
            icon={<AwardIcon className="w-6 h-6 text-amber-400" />}
            title="Você ainda não desbloqueou nenhuma conquista."
            description="Participe das atividades da Mansão Belmont para conquistar insígnias."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {userAchievements.map((ua) => (
              <div
                key={ua.id}
                className="p-3.5 rounded-xl bg-belmont-surface/60 border border-belmont-border flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Star className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-belmont-text-primary truncate">
                    {ua.achievement?.title || 'Conquista'}
                  </p>
                  <p className="text-[10px] text-belmont-text-muted truncate">
                    +{ua.achievement?.xp_reward} XP • +{ua.achievement?.coins_reward} Coins
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Posts Section */}
      <div className="space-y-4">
        <h3 className="text-base font-bold font-display text-belmont-text-primary flex items-center gap-2">
          <Compass className="w-5 h-5 text-belmont-rose" />
          Publicações de {profile.display_name}
        </h3>

        {userPosts.length === 0 ? (
          <EmptyState
            title="Nenhuma publicação criada ainda."
            description="Este membro ainda não publicou nada no Feed da Mansão."
          />
        ) : (
          <div className="space-y-4">
            {userPosts.map((post) => (
              <PostCard key={post.id} post={{ ...post, author: profile }} />
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Personalizar Perfil"
      >
        <div className="space-y-4">
          <Input
            label="Nome de Exibição"
            value={editDisplayName}
            onChange={(e) => setEditDisplayName(e.target.value)}
          />

          <Input
            label="Status Atual"
            value={editStatusText}
            onChange={(e) => setEditStatusText(e.target.value)}
            placeholder="Ex: Gerenciando a Mansão"
          />

          <Textarea
            label="Biografia"
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveProfile}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Salvar Alterações
            </Button>
          </div>
        </div>
      </Modal>

      {/* All Achievements Modal */}
      <Modal
        isOpen={isAchievementsModalOpen}
        onClose={() => setIsAchievementsModalOpen(false)}
        title="Catálogo de Conquistas da Mansão"
        maxWidth="lg"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {allAchievements.map((ach) => {
            const isUnlocked = userAchievements.some((ua) => ua.achievement_id === ach.id)
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
                  isUnlocked
                    ? 'bg-belmont-surface/80 border-amber-500/30'
                    : 'bg-belmont-surface/30 border-belmont-border/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      isUnlocked
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-belmont-surface-elevated text-belmont-text-muted border-belmont-border'
                    }`}
                  >
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-belmont-text-primary">{ach.title}</h4>
                      <Badge variant={isUnlocked ? 'gold' : 'outline'} size="sm">
                        {isUnlocked ? 'DESBLOQUEADA' : 'BLOQUEADA'}
                      </Badge>
                    </div>
                    <p className="text-xs text-belmont-text-muted mt-0.5">{ach.description}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-amber-300">+{ach.xp_reward} XP</p>
                  <p className="text-[10px] text-belmont-text-muted">+{ach.coins_reward} Coins</p>
                </div>
              </div>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}
