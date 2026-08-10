'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, MessageSquare, Share2, Send, Bookmark, Pin, ChevronDown, ChevronUp } from 'lucide-react'
import { clsx } from 'clsx'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { toggleLikePostService, getPostCommentsService, addPostCommentService } from '@/lib/services/data'
import { Post, PostComment } from '@/types'

interface PostCardProps {
  post: Post
  isPinned?: boolean
}

export const PostCard: React.FC<PostCardProps> = ({ post, isPinned = false }) => {
  const [hasLiked, setHasLiked] = useState(post.user_has_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [isSaved, setIsSaved] = useState(false)
  const [isHeartAnimating, setIsHeartAnimating] = useState(false)

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
    setIsHeartAnimating(true)
    setTimeout(() => setIsHeartAnimating(false), 300)
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
    <article className="p-4 sm:p-5 rounded-2xl bg-belmont-surface/40 border border-belmont-border space-y-3 transition-colors hover:border-belmont-border-strong">
      {/* Discreet Pinned Post Badge */}
      {(isPinned || post.author?.is_admin) && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-belmont-rose uppercase pb-1 border-b border-belmont-border/30">
          <Pin className="w-3 h-3 text-belmont-rose shrink-0" />
          <span>📌 FIXADO PELA MANSÃO</span>
        </div>
      )}

      {/* Post Author Line */}
      <div className="flex items-center justify-between">
        <Link href={`/perfil/${post.author?.username || 'usuario'}`} className="flex items-center gap-2.5 group">
          <Avatar
            src={post.author?.avatar_url}
            fallback={post.author?.display_name || 'B'}
            size="md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-belmont-text-primary group-hover:text-belmont-rose transition-colors">
                {post.author?.display_name || 'Membro Belmont'}
              </h3>
              <Badge variant="gold" size="sm" className="text-[9px] px-1.5 py-0">
                {post.author?.rank_title || 'Iniciado'}
              </Badge>
            </div>
            <p className="text-[11px] text-belmont-text-muted">
              @{post.author?.username || 'usuario'} · {formattedDate}
            </p>
          </div>
        </Link>
      </div>

      {/* Post Body Content */}
      <p className="text-xs sm:text-sm text-belmont-text-primary leading-relaxed whitespace-pre-line">
        {post.content}
      </p>

      {/* Post Image Attachment */}
      {post.image_url && (
        <div className="relative w-full h-64 sm:h-80 rounded-xl overflow-hidden border border-belmont-border/60 bg-belmont-bg/50">
          <Image
            src={post.image_url}
            alt="Anexo"
            fill
            className="object-cover hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 670px"
          />
        </div>
      )}

      {/* Post Action Buttons Bar */}
      <div className="flex items-center gap-5 pt-2 border-t border-belmont-border/40 text-xs font-medium text-belmont-text-muted">
        {/* Like */}
        <button
          onClick={handleLikeToggle}
          className={clsx(
            'flex items-center gap-1.5 transition-colors py-1 hover:text-belmont-rose group',
            hasLiked && 'text-belmont-rose font-bold'
          )}
        >
          <Heart
            className={clsx(
              'w-4 h-4 transition-transform group-hover:scale-110',
              hasLiked && 'fill-belmont-rose text-belmont-rose',
              isHeartAnimating && 'animate-heart-pop'
            )}
          />
          <span>{likesCount}</span>
        </button>

        {/* Comment */}
        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 hover:text-belmont-text-primary transition-colors py-1"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{commentsCount}</span>
          {showComments ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
        </button>

        {/* Share */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href)
            alert('Link da publicação copiado!')
          }}
          className="flex items-center gap-1.5 hover:text-belmont-text-primary transition-colors py-1"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Bookmark / Save */}
        <button
          onClick={() => setIsSaved(!isSaved)}
          className={clsx(
            'flex items-center gap-1.5 hover:text-belmont-text-primary transition-colors py-1 ml-auto',
            isSaved && 'text-amber-400'
          )}
        >
          <Bookmark className={clsx('w-4 h-4', isSaved && 'fill-amber-400')} />
        </button>
      </div>

      {/* Comments Expansion Drawer */}
      {showComments && (
        <div className="pt-3 border-t border-belmont-border/30 space-y-3 animate-fadeIn">
          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Escreva um comentário..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-belmont-bg/80 text-xs text-belmont-text-primary rounded-xl px-3 py-2 border border-belmont-border focus:outline-none focus:border-belmont-rose"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmittingComment}
              className="p-2 bg-belmont-crimson text-white rounded-xl hover:brightness-110 disabled:opacity-50 transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          {isLoadingComments ? (
            <p className="text-[11px] text-belmont-text-muted italic text-center py-2">Carregando comentários...</p>
          ) : comments.length === 0 ? (
            <p className="text-[11px] text-belmont-text-muted italic text-center py-2">Nenhum comentário ainda.</p>
          ) : (
            <div className="space-y-2 pt-1">
              {comments.map((cmt) => (
                <div key={cmt.id} className="p-2.5 rounded-xl bg-belmont-bg/40 border border-belmont-border/40 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-belmont-text-primary text-[11px]">{cmt.author?.display_name || 'Membro'}</span>
                    <span className="text-[9px] text-belmont-text-muted">
                      {new Date(cmt.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-belmont-text-secondary text-[11px] leading-relaxed">{cmt.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  )
}
