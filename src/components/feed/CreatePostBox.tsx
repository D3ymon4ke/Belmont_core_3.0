'use client'

import React, { useState } from 'react'
import { Image as ImageIcon, BarChart2, Send } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
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
    <div className="p-4 rounded-2xl bg-belmont-surface/60 border border-belmont-border space-y-3">
      <div className="flex items-start gap-3">
        <Avatar src={userAvatar} fallback={userDisplayName || 'B'} size="md" className="shrink-0" />
        <div className="flex-1 space-y-2.5">
          <textarea
            placeholder="O que está acontecendo na Mansão? Escreva alguma coisa..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            className="w-full bg-transparent text-sm text-belmont-text-primary placeholder:text-belmont-text-muted border-none focus:outline-none resize-none"
          />

          {showImageInput && (
            <Input
              placeholder="Cole a URL da imagem (https://...)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="bg-belmont-surface/70 border-belmont-border/80 text-xs"
            />
          )}

          <div className="flex items-center justify-between pt-2 border-t border-belmont-border/40">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowImageInput(!showImageInput)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors ${
                  showImageInput
                    ? 'text-belmont-rose bg-belmont-rose/10 font-semibold'
                    : 'text-belmont-text-muted hover:text-belmont-text-primary hover:bg-white/5'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-belmont-rose" />
                <span>Imagem</span>
              </button>

              <button
                type="button"
                onClick={() => alert('Enquetes em breve na Mansão Belmont.')}
                className="flex items-center gap-1.5 text-xs text-belmont-text-muted hover:text-belmont-text-primary hover:bg-white/5 px-2.5 py-1 rounded-lg transition-colors"
              >
                <BarChart2 className="w-4 h-4 text-amber-400" />
                <span>Enquete</span>
              </button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!content.trim()}
              isLoading={isSubmitting}
              size="sm"
              variant="primary"
              rightIcon={<Send className="w-3.5 h-3.5" />}
              className="rounded-xl px-4 py-1.5 text-xs"
            >
              Publicar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
