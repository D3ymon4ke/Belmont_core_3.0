'use client'

import React, { useState } from 'react'
import { Image as ImageIcon, Send, Sparkles } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { createPostService } from '@/lib/services/data'
import { Post } from '@/types'

interface CreatePostBoxProps {
  onPostCreated: (newPost: Post) => void
  userAvatar?: string | null
  userDisplayName?: string
}

export const CreatePostBox: React.FC<CreatePostBoxProps> = ({
  onPostCreated,
  userAvatar,
  userDisplayName,
}) => {
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      const created = await createPostService(content, imageUrl.trim() || undefined)
      if (created) {
        onPostCreated(created)
        setContent('')
        setImageUrl('')
        setShowImageInput(false)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="glass-panel rounded-2xl p-5 border border-belmont-border space-y-4">
      <div className="flex items-start gap-3">
        <Avatar src={userAvatar} fallback={userDisplayName || 'B'} size="md" />
        <div className="flex-1 space-y-3">
          <Textarea
            placeholder="Compartilhe um pensamento, atualização ou projeto com a Mansão..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="bg-belmont-surface/60 border-belmont-border/80 focus:border-belmont-rose"
          />

          {showImageInput && (
            <Input
              placeholder="URL da Imagem (https://...)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="bg-belmont-surface/60"
            />
          )}

          <div className="flex items-center justify-between pt-2 border-t border-belmont-border/50">
            <button
              type="button"
              onClick={() => setShowImageInput(!showImageInput)}
              className="flex items-center gap-1.5 text-xs text-belmont-text-muted hover:text-belmont-text-primary transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
            >
              <ImageIcon className="w-4 h-4 text-belmont-rose" />
              <span>{showImageInput ? 'Remover Imagem' : 'Anexar Imagem'}</span>
            </button>

            <Button
              onClick={handleSubmit}
              disabled={!content.trim()}
              isLoading={isSubmitting}
              size="sm"
              variant="primary"
              rightIcon={<Send className="w-3.5 h-3.5" />}
            >
              Publicar Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
