'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, RefreshCcw, ShieldCheck, Users } from 'lucide-react'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { getGeneralChatMessagesService, sendGeneralChatMessageService } from '@/lib/services/data'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/types'

export default function GeneralChatPage() {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true)
    try {
      const data = await getGeneralChatMessagesService()
      setMessages(data)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    // Fetch Current User Auth ID
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id)
    })

    fetchMessages()

    // Controlled Polling every 4 seconds
    const interval = setInterval(() => {
      if (document.hasFocus()) {
        fetchMessages()
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (content: string) => {
    const sentMsg = await sendGeneralChatMessageService(content)
    if (sentMsg) {
      setMessages((prev) => [...prev, sentMsg])
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto glass-panel rounded-3xl border border-belmont-border overflow-hidden animate-fadeIn">
      {/* Chat Room Header */}
      <div className="px-5 py-4 bg-belmont-surface/90 border-b border-belmont-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-belmont-crimson/20 border border-belmont-rose/30 flex items-center justify-center text-belmont-rose">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold font-display text-belmont-text-primary">
                Chat Geral Belmont
              </h1>
              <Badge variant="crimson" size="sm">MENSAGENS PERSISTIDAS</Badge>
            </div>
            <p className="text-[11px] text-belmont-text-muted flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Canal Oficial da Mansão • Polling Ativo
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchMessages(true)}
          className="p-2 text-belmont-text-muted hover:text-belmont-text-primary rounded-xl hover:bg-white/5 transition-colors"
          title="Atualizar mensagens"
        >
          <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-belmont-rose' : ''}`} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1 bg-belmont-bg/50">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-2/3 rounded-2xl" />
            <Skeleton className="h-12 w-1/2 ml-auto rounded-2xl" />
            <Skeleton className="h-12 w-3/4 rounded-2xl" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            title="Nenhuma mensagem ainda"
            description="Inicie a conversa no Chat Geral da Mansão Belmont."
          />
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isCurrentUser={msg.sender_id === currentUserId || msg.sender_id === 'user-1'}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <div className="p-3 bg-belmont-surface/90 border-t border-belmont-border">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}
