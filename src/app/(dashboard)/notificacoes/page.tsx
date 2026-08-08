'use client'

import React, { useState, useEffect } from 'react'
import { Bell, Heart, MessageSquare, Megaphone, CheckCircle2, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/types'

export default function NotificationsPage() {
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setNotifications([])
        return
      }

      const { data, error } = await (supabase
        .from('notifications') as any)
        .select('*, actor:profiles(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error || !data) {
        setNotifications([])
      } else {
        setNotifications(data as Notification[])
      }
    } catch (e) {
      setNotifications([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await (supabase.from('notifications') as any)
        .update({ is_read: true })
        .eq('user_id', user.id)
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read
    return true
  })

  const getIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-rose-400" />
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-sky-400" />
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-amber-400" />
      default:
        return <Sparkles className="w-4 h-4 text-belmont-rose" />
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-belmont-text-primary flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-belmont-rose" />
            Central de Notificações
          </h1>
          <p className="text-xs text-belmont-text-muted mt-1">
            Histórico oficial de alertas, menções e interações
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <Button
            onClick={markAllAsRead}
            variant="ghost"
            size="sm"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="glass-panel p-2 rounded-2xl border border-belmont-border flex items-center gap-2 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-xl font-semibold transition-all ${
            filter === 'all'
              ? 'bg-belmont-crimson text-white shadow-sm'
              : 'text-belmont-text-muted hover:text-belmont-text-primary'
          }`}
        >
          Todas ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-1.5 rounded-xl font-semibold transition-all ${
            filter === 'unread'
              ? 'bg-belmont-crimson text-white shadow-sm'
              : 'text-belmont-text-muted hover:text-belmont-text-primary'
          }`}
        >
          Não Lidas ({notifications.filter((n) => !n.is_read).length})
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-6 h-6 text-belmont-rose" />}
          title="Tudo tranquilo."
          description="Você não possui novas notificações no momento."
        />
      ) : (
        <div className="space-y-2.5">
          {filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
                notif.is_read
                  ? 'bg-belmont-surface/50 border-belmont-border/60'
                  : 'bg-belmont-surface/90 border-belmont-rose/30 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-belmont-surface-elevated border border-belmont-border flex items-center justify-center">
                  {getIcon(notif.type)}
                </div>
                <div>
                  <p className="text-xs font-bold text-belmont-text-primary">{notif.content}</p>
                  <p className="text-[10px] text-belmont-text-muted mt-0.5">
                    {new Date(notif.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {!notif.is_read && <Badge variant="crimson" size="sm">NOVO</Badge>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
