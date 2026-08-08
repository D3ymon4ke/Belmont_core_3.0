'use client'

import React, { useState, useEffect } from 'react'
import { Send, Search, MessageSquare, ArrowLeft } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { ChatInput } from '@/components/chat/ChatInput'
import { searchProfilesService, MOCK_PROFILES, MOCK_MESSAGES } from '@/lib/services/data'
import { Profile, Message } from '@/types'

export default function PrivateMessagesPage() {
  const [conversationsList, setConversationsList] = useState<Profile[]>(MOCK_PROFILES.slice(1))
  const [selectedUser, setSelectedUser] = useState<Profile | null>(MOCK_PROFILES[1] || null)
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!searchQuery.trim()) return

    const timer = setTimeout(async () => {
      setIsSearching(true)
      const results = await searchProfilesService(searchQuery.trim())
      if (results.length > 0) {
        setConversationsList(results)
      }
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSendMessage = async (content: string) => {
    const newMsg: Message = {
      id: `dm-${Date.now()}`,
      conversation_id: `conv-${selectedUser?.id}`,
      sender_id: 'user-1',
      content,
      media_url: null,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, newMsg])
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] max-w-5xl mx-auto glass-panel rounded-3xl border border-belmont-border overflow-hidden animate-fadeIn pb-[env(safe-area-inset-bottom)]">
      {/* Conversations List Sidebar Pane */}
      <div
        className={`w-full md:w-80 bg-belmont-surface/90 border-r border-belmont-border flex flex-col ${
          selectedUser ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-belmont-border space-y-3">
          <h2 className="text-base font-bold font-display text-belmont-text-primary flex items-center gap-2">
            <Send className="w-4 h-4 text-belmont-rose" />
            Mensagens Privadas
          </h2>
          <Input
            placeholder="Buscar membros da Mansão..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
            className="bg-belmont-bg/60 text-xs py-1.5"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isSearching ? (
            <p className="text-xs text-belmont-text-muted text-center py-4 italic">Buscando membros...</p>
          ) : conversationsList.length === 0 ? (
            <p className="text-xs text-belmont-text-muted text-center py-4 italic">Nenhum membro encontrado.</p>
          ) : (
            conversationsList.map((user) => {
              const isSelected = selectedUser?.id === user.id
              return (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                    isSelected
                      ? 'bg-gradient-to-r from-belmont-crimson/20 to-transparent border-l-2 border-belmont-rose text-white'
                      : 'hover:bg-white/5 text-belmont-text-secondary'
                  }`}
                >
                  <Avatar src={user.avatar_url} fallback={user.display_name} size="md" status="online" />
                  <div className="flex-1 truncate">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-belmont-text-primary truncate">
                        {user.display_name}
                      </span>
                      <span className="text-[10px] text-belmont-text-muted">Ativo</span>
                    </div>
                    <p className="text-[11px] text-belmont-text-muted truncate mt-0.5">
                      {user.status_text || `@${user.username}`}
                    </p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Active Conversation Chat Pane */}
      <div
        className={`flex-1 flex flex-col bg-belmont-bg/50 ${
          !selectedUser ? 'hidden md:flex' : 'flex'
        }`}
      >
        {selectedUser ? (
          <>
            {/* Conversation Topbar */}
            <div className="px-5 py-3.5 bg-belmont-surface/90 border-b border-belmont-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden p-1.5 text-belmont-text-muted hover:text-belmont-text-primary rounded-lg hover:bg-white/5"
                  title="Voltar para conversas"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Avatar src={selectedUser.avatar_url} fallback={selectedUser.display_name} size="sm" status="online" />
                <div>
                  <h3 className="text-sm font-bold text-belmont-text-primary font-display">
                    {selectedUser.display_name}
                  </h3>
                  <p className="text-[10px] text-belmont-text-muted">@{selectedUser.username}</p>
                </div>
              </div>
              <Badge variant="outline" size="sm">Canal Privado</Badge>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-1">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isCurrentUser={msg.sender_id === 'user-1'}
                />
              ))}
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-belmont-surface/90 border-t border-belmont-border">
              <ChatInput onSendMessage={handleSendMessage} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-belmont-text-muted">
            <MessageSquare className="w-12 h-12 text-belmont-rose mb-3 opacity-60" />
            <h3 className="text-base font-bold text-belmont-text-primary font-display">
              Caixa de Mensagens Privadas
            </h3>
            <p className="text-xs text-belmont-text-muted mt-1 max-w-xs">
              Selecione um membro na lista lateral para conversar diretamente.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
