'use client'

import React, { useState } from 'react'
import { Bell, Heart, MessageSquare, Megaphone, CheckCheck, Send } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { MOCK_PROFILES } from '@/lib/services/data'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      actor: MOCK_PROFILES[1],
      type: 'like',
      category: 'Curtidas',
      content: 'curtiu a sua publicação no Feed da Mansão.',
      time: 'Há 20 minutos',
      is_read: false,
    },
    {
      id: 'notif-2',
      actor: MOCK_PROFILES[2],
      type: 'comment',
      category: 'Comentários',
      content: 'comentou no seu tópico sobre arquitetura.',
      time: 'Há 2 horas',
      is_read: false,
    },
    {
      id: 'notif-3',
      actor: MOCK_PROFILES[0],
      type: 'announcement',
      category: 'Comunicados',
      content: 'publicou um novo comunicado oficial da Mansão.',
      time: 'Há 1 dia',
      is_read: true,
    },
  ])

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-3.5 h-3.5 text-belmont-rose" />
      case 'comment':
        return <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
      case 'message':
        return <Send className="w-3.5 h-3.5 text-sky-400" />
      default:
        return <Megaphone className="w-3.5 h-3.5 text-emerald-400" />
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-belmont-text-primary flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-belmont-rose" />
            Central de Notificações
          </h1>
          <p className="text-xs text-belmont-text-muted mt-1">
            Interações, respostas e avisos oficiais da Mansão Belmont
          </p>
        </div>

        <Button
          onClick={markAllRead}
          variant="ghost"
          size="sm"
          leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
        >
          Marcar lidas
        </Button>
      </div>

      <div className="glass-panel rounded-3xl border border-belmont-border overflow-hidden divide-y divide-belmont-border/50">
        {notifications.map((item) => (
          <div
            key={item.id}
            className={`p-4 flex items-center justify-between transition-colors ${
              !item.is_read ? 'bg-belmont-rose/5' : 'hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <Avatar src={item.actor.avatar_url} fallback={item.actor.display_name} size="md" />
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-belmont-surface border border-belmont-border">
                  {getIcon(item.type)}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-belmont-text-primary">
                    <span className="font-bold">{item.actor.display_name}</span> {item.content}
                  </p>
                  <Badge variant="outline" size="sm">{item.category}</Badge>
                </div>
                <p className="text-[10px] text-belmont-text-muted mt-0.5">{item.time}</p>
              </div>
            </div>

            {!item.is_read && (
              <span className="w-2 h-2 rounded-full bg-belmont-rose shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
