'use client'

import React, { useState, useEffect } from 'react'
import { Compass, RefreshCw, Feather } from 'lucide-react'
import { CreatePostBox } from '@/components/feed/CreatePostBox'
import { MansionStories } from '@/components/feed/MansionStories'
import { PostCard } from '@/components/feed/PostCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { getPostsService, getAllProfilesService } from '@/lib/services/data'
import { createClient } from '@/lib/supabase/client'
import { Post, Profile } from '@/types'

export default function FeedPage() {
  const supabase = createClient()
  const [posts, setPosts] = useState<Post[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPostsAndData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: prof } = await (supabase.from('profiles') as any).select('*').eq('id', user.id).single()
        if (prof) setCurrentUserProfile(prof as Profile)
      }

      const [postsData, profilesData] = await Promise.all([
        getPostsService(),
        getAllProfilesService(),
      ])

      setPosts(postsData)
      setMembers(profilesData)
    } catch (err) {
      setError('Não foi possível carregar o Feed da Mansão.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPostsAndData()
  }, [])

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev])
  }

  const userDisplayName = currentUserProfile?.display_name?.split(' ')[0] || 'Damon'

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      {/* Social Feed Header */}
      <div className="flex items-center justify-between pb-2 border-b border-belmont-border/40">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold font-display tracking-tight text-belmont-text-primary">
            Olá, {userDisplayName}.
          </h1>
          <p className="text-xs text-belmont-text-muted mt-0.5">
            Que histórias a Mansão guarda hoje?
          </p>
        </div>

        <Button
          onClick={fetchPostsAndData}
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="text-xs text-belmont-text-muted hover:text-belmont-text-primary"
        >
          Atualizar
        </Button>
      </div>

      {/* Stories / Mansion Activity Circles */}
      <MansionStories members={members} currentUserProfile={currentUserProfile} />

      {/* Composer */}
      <CreatePostBox
        onPostCreated={handlePostCreated}
        userAvatar={currentUserProfile?.avatar_url}
        userDisplayName={currentUserProfile?.display_name}
      />

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <ErrorState message={error} onRetry={fetchPostsAndData} />
      )}

      {/* Empty State */}
      {!isLoading && !error && posts.length === 0 && (
        <EmptyState
          icon={<Feather className="w-6 h-6 text-belmont-rose" />}
          title="A Mansão ainda está silenciosa."
          description="Seja o primeiro a publicar no Feed da Mansão Belmont."
        />
      )}

      {/* Posts Timeline */}
      {!isLoading && !error && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post, idx) => (
            <PostCard key={post.id} post={post} isPinned={idx === 0 && post.author?.is_admin} />
          ))}
        </div>
      )}
    </div>
  )
}
