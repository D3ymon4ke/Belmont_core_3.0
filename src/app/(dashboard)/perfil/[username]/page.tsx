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
  Award as AwardIcon,
  TrendingUp,
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
  const [activeTab, setActiveTab] = useState<'posts' | 'achievements' | 'activity'>('posts')

  const [isEditOpen, setIsEditOpen] = useState(false)
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
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-16 space-y-2">
        <h2 className="text-lg font-bold font-display text-belmont-text-primary">
          Membro não localizado
        </h2>
        <p className="text-xs text-belmont-text-muted">
          O perfil @{usernameParam} não foi encontrado na Mansão.
        </p>
      </div>
    )
  }

  const joinFormatted = new Date(profile.created_at).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Large Cover & Overlapping Avatar */}
      <div className="rounded-3xl bg-belmont-surface/70 border border-belmont-border overflow-hidden relative">
        {/* Cover backdrop */}
        <div className="h-40 sm:h-52 bg-gradient-to-r from-belmont-crimson/80 via-belmont-surface-elevated to-belmont-bg relative">
          <div className="absolute inset-0 bg-mansion-radial opacity-60 pointer-events-none" />
          <div className="absolute top-4 right-4">
            <Badge variant="gold" size="md">
              <Coins className="w-3.5 h-3.5 mr-1" />
              {profile.belmont_coins ?? 0} Coins
            </Badge>
          </div>
        </div>

        {/* Profile Details Header */}
        <div className="p-5 pt-0 relative">
          {/* Overlapping Avatar & Action Button */}
          <div className="flex items-end justify-between -mt-14 sm:-mt-16 mb-3">
            <div className="relative">
              <Avatar
                src={profile.avatar_url}
                fallback={profile.display_name}
                size="xl"
                className="ring-4 ring-belmont-bg rounded-2xl shadow-xl"
              />
            </div>

            {isOwner && (
              <Button
                onClick={() => setIsEditOpen(true)}
                variant="secondary"
                size="sm"
                leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                className="rounded-xl text-xs"
              >
                Editar Perfil
              </Button>
            )}
          </div>

          {/* Name & Bio */}
          <div className="space-y-2.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold font-display text-belmont-text-primary">
                  {profile.display_name}
                </h1>
                {profile.is_admin && <Badge variant="crimson" size="sm">ADMIN</Badge>}
                <Badge variant="gold" size="sm">{rankData.currentRankTitle}</Badge>
              </div>
              <p className="text-xs text-belmont-text-muted mt-0.5">@{profile.username}</p>
            </div>

            {profile.status_text && (
              <p className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-belmont-rose/10 border border-belmont-rose/20 text-xs text-belmont-rose font-medium">
                <Sparkles className="w-3 h-3" />
                <span>{profile.status_text}</span>
              </p>
            )}

            <p className="text-xs sm:text-sm text-belmont-text-secondary leading-relaxed">
              {profile.bio || 'Membro exclusivo da Mansão Belmont.'}
            </p>

            {/* Rank Level Progress Bar */}
            <div className="space-y-1.5 pt-2 border-t border-belmont-border/30">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-belmont-text-primary text-[11px]">
                  Patente: <span className="text-amber-300">{rankData.currentRankTitle}</span>
                </span>
                <span className="text-[10px] text-belmont-text-muted">
                  {rankData.currentXP} / {rankData.maxXP} XP ({rankData.percent}%)
                </span>
              </div>
              <div className="w-full h-2 bg-belmont-surface-elevated rounded-full overflow-hidden border border-belmont-border/40">
                <div
                  className="h-full bg-gradient-to-r from-belmont-crimson to-amber-400 rounded-full transition-all duration-500 shadow-gold-glow"
                  style={{ width: `${rankData.percent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-belmont-text-muted pt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Membro desde {joinFormatted}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs (Publicações | Conquistas | Atividade) */}
      <div className="flex items-center border-b border-belmont-border/50 text-xs font-semibold select-none">
        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === 'posts'
              ? 'border-belmont-rose text-belmont-rose'
              : 'border-transparent text-belmont-text-muted hover:text-belmont-text-primary'
          }`}
        >
          Publicações ({userPosts.length})
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === 'achievements'
              ? 'border-belmont-rose text-belmont-rose'
              : 'border-transparent text-belmont-text-muted hover:text-belmont-text-primary'
          }`}
        >
          Conquistas ({userAchievements.length})
        </button>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === 'activity'
              ? 'border-belmont-rose text-belmont-rose'
              : 'border-transparent text-belmont-text-muted hover:text-belmont-text-primary'
          }`}
        >
          Atividade
        </button>
      </div>

      {/* Tab 1: Posts */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {userPosts.length === 0 ? (
            <EmptyState
              title="Nenhuma publicação ainda."
              description="Este membro ainda não fez publicações no Feed da Mansão."
            />
          ) : (
            userPosts.map((post) => (
              <PostCard key={post.id} post={{ ...post, author: profile }} />
            ))
          )}
        </div>
      )}

      {/* Tab 2: Achievements */}
      {activeTab === 'achievements' && (
        <div className="space-y-3">
          {userAchievements.length === 0 ? (
            <EmptyState
              icon={<AwardIcon className="w-6 h-6 text-amber-400" />}
              title="Nenhuma conquista desbloqueada."
              description="Participe dos eventos e interações da Mansão para ganhar insígnias."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userAchievements.map((ua) => (
                <div key={ua.id} className="p-3.5 rounded-2xl bg-belmont-surface/50 border border-belmont-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-belmont-text-primary">
                      {ua.achievement?.title || 'Conquista'}
                    </p>
                    <p className="text-[10px] text-belmont-text-muted mt-0.5">
                      +{ua.achievement?.xp_reward} XP · +{ua.achievement?.coins_reward} Coins
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Activity */}
      {activeTab === 'activity' && (
        <div className="p-6 rounded-2xl bg-belmont-surface/40 border border-belmont-border space-y-3">
          <p className="text-xs text-belmont-text-muted italic">
            Histórico recente de atividades de {profile.display_name}:
          </p>
          <ul className="space-y-2 text-xs text-belmont-text-secondary">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-belmont-rose" />
              <span>Participando ativamente da Rede Social da Mansão Belmont</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Patente atual: <strong>{rankData.currentRankTitle}</strong></span>
            </li>
          </ul>
        </div>
      )}

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
            placeholder="Ex: Na Mansão Belmont"
          />

          <Textarea
            label="Biografia"
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveProfile}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Salvar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
