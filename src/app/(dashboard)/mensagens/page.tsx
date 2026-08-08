'use client'

import React, { useState, useEffect } from 'react'
import { Send, Search, ArrowLeft, MessageSquareDashed } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import { Skeleton } from '@/components/ui/Skeleton'
import { searchProfilesService, getAllProfilesService } from '@/lib/services/data'
import { createClient } from '@/lib/supabase/client'
import { Profile, Message } from '@/types'

export default function DirectMessagesPage() {
  const supabase = createClient()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id)
    })

    async function loadMembers() {
      setIsLoading(true)
      const data = await getAllProfilesService()
      setProfiles(data)
      setIsLoading(false)
    }

    loadMembers()
  }, [])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      const data = await getAllProfilesService()
      setProfiles(data)
      return
    }
    const filtered = await searchProfilesService(query)
    setProfiles(filtered)
  }

  const handleSendMessage = (content: string) => {
    if (!selectedProfile || !currentUserId) return
    const newMsg: Message = {
      id: `dm-${Date.now()}`,
      conversation_id: `conv-${selectedProfile.id}`,
      sender_id: currentUserId,
      content,
      media_url: null,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, newMsg])
  }

  return (
    <div className="h-[calc(100vh-8rem)] max-w-5xl mx-auto glass-panel rounded-3xl border border-belmont-border overflow-hidden flex flex-col md:flex-row animate-fadeIn">
      {/* Members List Panel */}
      <div
        className={`w-full md:w-80 border-r border-belmont-border flex flex-col bg-belmont-surface/70 ${
          selectedProfile ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Search Header */}
        <div className="p-4 border-b border-belmont-border space-y-3">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-belmont-rose" />
            <h1 className="text-base font-bold font-display text-belmont-text-primary">
              Mensagens Privadas
            </h1>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-belmont-text-muted absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar membro da Mansão..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-belmont-bg/80 text-xs text-belmont-text-primary pl-9 pr-3 py-2 rounded-xl border border-belmont-border focus:border-belmont-rose focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoading ? (
            <div className="space-y-2 p-2">
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </div>
          ) : profiles.length === 0 ? (
            <p className="text-xs text-belmont-text-muted text-center py-6">
              Nenhum membro encontrado.
            </p>
          ) : (
            profiles.map((profile) => {
              const isSelected = selectedProfile?.id === profile.id
              return (
                <button
                  key={profile.id}
                  onClick={() => setSelectedProfile(profile)}
                  className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-colors text-left ${
                    isSelected
                      ? 'bg-belmont-crimson/20 border border-belmont-rose/30 text-white'
                      : 'hover:bg-white/5 text-belmont-text-secondary'
                  }`}
                >
                  <Avatar src={profile.avatar_url} fallback={profile.display_name} size="md" />
                  <div className="truncate flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-belmont-text-primary truncate">
                        {profile.display_name}
                      </p>
                      {profile.is_admin && <Badge variant="crimson" size="sm">ADMIN</Badge>}
                    </div>
                    <p className="text-[10px] text-belmont-text-muted truncate">
                      @{profile.username}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* DM Chat Pane */}
      <div
        className={`flex-1 flex-col bg-belmont-bg/40 ${
          selectedProfile ? 'flex' : 'hidden md:flex'
        }`}
      >
        {selectedProfile ? (
          <>
            {/* DM Header */}
            <div className="p-4 bg-belmont-surface/90 border-b border-belmont-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedProfile(null)}
                  className="md:hidden p-1 text-belmont-text-muted hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Avatar src={selectedProfile.avatar_url} fallback={selectedProfile.display_name} size="md" />
                <div>
                  <h2 className="text-sm font-bold font-display text-belmont-text-primary">
                    {selectedProfile.display_name}
                  </h2>
                  <p className="text-[10px] text-belmont-text-muted">
                    @{selectedProfile.username}
                  </p>
                </div>
              </div>
            </div>

            {/* DM Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
              {messages.length === 0 ? (
                <EmptyState
                  icon={<MessageSquareDashed className="w-6 h-6 text-belmont-rose" />}
                  title="Nenhuma conversa ainda."
                  description={`Inicie um diálogo privado com ${selectedProfile.display_name}.`}
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
            </div>

            {/* Input */}
            <div className="p-3 bg-belmont-surface/90 border-t border-belmont-border">
              <ChatInput onSendMessage={handleSendMessage} placeholder={`Mensagem para @${selectedProfile.username}...`} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <EmptyState
              icon={<Send className="w-8 h-8 text-belmont-text-muted" />}
              title="Nenhuma conversa selecionada."
              description="Selecione um membro da Mansão Belmont na lista ao lado para conversar."
            />
          </div>
        )}
      </div>
    </div>
  )
}
