'use client'

import React, { useState, useEffect, useRef } from 'react'
import { RefreshCcw, VolumeX } from 'lucide-react'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { getGeneralChatMessagesService, sendGeneralChatMessageService, getAllProfilesService } from '@/lib/services/data'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/types'

export default function GeneralChatPage() {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [onlineCount, setOnlineCount] = useState<number>(12)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true)
    try {
      const [msgs, members] = await Promise.all([
        getGeneralChatMessagesService(),
        getAllProfilesService(),
      ])
      setMessages(msgs)
      setOnlineCount(Math.max(1, members.length))
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id)
    })

    fetchMessages()

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
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-2xl bg-belmont-surface/60 border border-belmont-border overflow-hidden animate-fadeIn">
      {/* Messenger Header */}
      <div className="px-4 py-3 bg-belmont-surface/90 border-b border-belmont-border/60 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold font-display text-belmont-text-primary tracking-wider uppercase">
            CHAT DA MANSÃO
          </h1>
          <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>● {onlineCount} presentes</span>
          </p>
        </div>

        <button
          onClick={() => fetchMessages(true)}
          className="p-1.5 text-belmont-text-muted hover:text-belmont-text-primary rounded-lg hover:bg-white/5 transition-colors"
          title="Atualizar mensagens"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-belmont-rose' : ''}`} />
        </button>
      </div>

      {/* Messages Feed Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-belmont-bg/40">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-2/3 rounded-xl" />
            <Skeleton className="h-10 w-1/2 ml-auto rounded-xl" />
            <Skeleton className="h-10 w-3/4 rounded-xl" />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<VolumeX className="w-6 h-6 text-belmont-rose" />}
            title="A sala está silenciosa."
            description="Envie a primeira mensagem no Chat da Mansão."
          />
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isCurrentUser={msg.sender_id === currentUserId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Composer Bottom */}
      <div className="p-3 bg-belmont-surface/90 border-t border-belmont-border/60">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}
