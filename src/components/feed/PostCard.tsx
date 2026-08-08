'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MessageSquare, Share2, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { clsx } from 'clsx'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { toggleLikePostService, getPostCommentsService, addPostCommentService } from '@/lib/services/data'
import { Post, PostComment } from '@/types'

interface PostCardProps {
  post: Post
}

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [hasLiked, setHasLiked] = useState(post.user_has_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)

  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [commentsCount, setCommentsCount] = useState(post.comments_count || 0)
  const [newComment, setNewComment] = useState('')
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  const handleLikeToggle = async () => {
    const nextState = !hasLiked
    setHasLiked(nextState)
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)))
    await toggleLikePostService(post.id, hasLiked)
  }

  const handleToggleComments = async () => {
    const nextState = !showComments
    setShowComments(nextState)

    if (nextState && comments.length === 0) {
      setIsLoadingComments(true)
      const data = await getPostCommentsService(post.id)
      setComments(data)
      setIsLoadingComments(false)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    const created = await addPostCommentService(post.id, newComment.trim())
    if (created) {
      setComments((prev) => [...prev, created])
      setCommentsCount((prev) => prev + 1)
      setNewComment('')
    }
    setIsSubmittingComment(false)
  }

  const formattedDate = new Date(post.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <article className="glass-panel rounded-2xl p-5 border border-belmont-border space-y-4 hover:border-belmont-border-strong transition-all duration-200">
      {/* Header Author Info */}
      <div className="flex items-center justify-between">
        <Link href={`/perfil/${post.author?.username || 'usuario'}`} className="flex items-center gap-3 group">
          <Avatar
            src={post.author?.avatar_url}
            fallback={post.author?.display_name || 'B'}
            size="md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-belmont-text-primary group-hover:text-belmont-rose transition-colors">
                {post.author?.display_name || 'Membro Belmont'}
              </h3>
              {post.author?.is_admin && <Badge variant="crimson" size="sm">ADMIN</Badge>}
            </div>
            <p className="text-xs text-belmont-text-muted">
              @{post.author?.username || 'usuario'} • {formattedDate}
            </p>
          </div>
        </Link>
      </div>

      {/* Post Text Body */}
      <p className="text-sm text-belmont-text-primary leading-relaxed whitespace-pre-line">
        {post.content}
      </p>

      {/* Post Attachment Image */}
      {post.image_url && (
        <div className="relative w-full h-72 rounded-xl overflow-hidden border border-belmont-border/70 bg-belmont-surface/50">
          <Image
            src={post.image_url}
            alt="Anexo da publicação"
            fill
            className="object-cover hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      {/* Actions Footer */}
      <div className="flex items-center gap-4 pt-3 border-t border-belmont-border/60 text-xs font-medium">
        <button
          onClick={handleLikeToggle}
          className={clsx(
            'flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg hover:bg-white/5',
            hasLiked ? 'text-belmont-rose font-semibold' : 'text-belmont-text-muted hover:text-belmont-text-primary'
          )}
        >
          <Heart className={clsx('w-4 h-4 transition-transform active:scale-125', hasLiked && 'fill-belmont-rose text-belmont-rose')} />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-belmont-text-muted hover:text-belmont-text-primary transition-colors px-2.5 py-1 rounded-lg hover:bg-white/5"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{commentsCount} Comentários</span>
          {showComments ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <button className="flex items-center gap-1.5 text-belmont-text-muted hover:text-belmont-text-primary transition-colors px-2.5 py-1 rounded-lg hover:bg-white/5 ml-auto">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Comments Expansion Section */}
      {showComments && (
        <div className="pt-3 border-t border-belmont-border/40 space-y-3 animate-fadeIn">
          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Escreva um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-belmont-surface/70 text-xs text-belmont-text-primary rounded-xl px-3 py-2 border border-belmont-border focus:outline-none focus:border-belmont-rose"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmittingComment}
              className="p-2 bg-belmont-crimson text-white rounded-xl hover:brightness-110 disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Comments List */}
          {isLoadingComments ? (
            <p className="text-xs text-belmont-text-muted italic text-center py-2">Carregando comentários...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-belmont-text-muted italic text-center py-2">Nenhum comentário ainda. Seja o primeiro a comentar.</p>
          ) : (
            <div className="space-y-2.5 pt-1">
              {comments.map((cmt) => (
                <div key={cmt.id} className="p-3 rounded-xl bg-belmont-surface/40 border border-belmont-border/50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-belmont-text-primary">{cmt.author?.display_name || 'Membro'}</span>
                    <span className="text-[10px] text-belmont-text-muted">
                      {new Date(cmt.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-belmont-text-secondary">{cmt.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
