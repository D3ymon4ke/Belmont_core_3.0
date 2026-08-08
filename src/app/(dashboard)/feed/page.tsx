'use client'

import React, { useState, useEffect } from 'react'
import { Compass, RefreshCw } from 'lucide-react'
import { CreatePostBox } from '@/components/feed/CreatePostBox'
import { PostCard } from '@/components/feed/PostCard'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Button } from '@/components/ui/Button'
import { getPostsService } from '@/lib/services/data'
import { Post } from '@/types'

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getPostsService()
      setPosts(data)
    } catch (err: any) {
      setError('Falha ao carregar as postagens do Feed.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev])
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-belmont-text-primary flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-belmont-rose" />
            Feed da Mansão
          </h1>
          <p className="text-xs text-belmont-text-muted mt-1">
            Linha do tempo de publicações e discussões exclusivas do Belmont Core
          </p>
        </div>

        <Button
          onClick={fetchPosts}
          variant="ghost"
          size="sm"
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Atualizar
        </Button>
      </div>

      {/* Post Creation Box */}
      <CreatePostBox onPostCreated={handlePostCreated} />

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <ErrorState message={error} onRetry={fetchPosts} />
      )}

      {/* Empty State */}
      {!isLoading && !error && posts.length === 0 && (
        <EmptyState
          title="Nenhuma publicação encontrada"
          description="Seja o primeiro membro a publicar uma ideia ou atualização no feed."
        />
      )}

      {/* Posts Timeline */}
      {!isLoading && !error && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
