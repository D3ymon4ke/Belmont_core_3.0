'use client'

import React, { useState } from 'react'
import { Send, Smile } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>
  disabled?: boolean
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSending) return

    const textToSend = content.trim()
    setContent('')
    setIsSending(true)

    try {
      await onSendMessage(textToSend)
    } catch (error) {
      console.error(error)
      setContent(textToSend) // Restore text on error
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-panel p-2.5 rounded-2xl border border-belmont-border flex items-center gap-2"
    >
      <input
        type="text"
        placeholder="Enviar mensagem para o Chat Geral..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={disabled || isSending}
        className="flex-1 bg-transparent px-3 py-2 text-sm text-belmont-text-primary placeholder:text-belmont-text-muted/60 focus:outline-none"
      />

      <Button
        type="submit"
        disabled={!content.trim() || disabled}
        isLoading={isSending}
        size="sm"
        variant="primary"
        className="rounded-xl px-4"
      >
        <Send className="w-4 h-4" />
      </Button>
    </form>
  )
}
